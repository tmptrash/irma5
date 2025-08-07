/**
 * This module controls & runs virtual machines in the atom's world. Virtual Machine itself it's an
 * abstraction above atoms, which "alives" them. It also brings an energy for them and run atoms
 * depending on type (mov atom moves itself and near atoms, fix atom fixes bonds between atoms, etc).
 * Every VM is described by 64bit number, where first 32bits is an offset of the atom the VM is above
 * and other 32bit is amount of energy of the VM. Because we have many VMs, we keep them in an array
 * - vms.offs. VMs offset (first 32bits) should always point to the atom & it's always not empty.
 * Another property is a vms.map. It contains a map of 32bit arrays of VM indexes in vms.offs array, 
 * where key is an offset of the atom in the world. For example: vms.map = {2: [0, 2]} means that
 * there are 2 VMs with indexes 0 and 2 in a vms.offs are located on the offset atom with offset 2.
 * Because "mov" atom is the slowest atom in the system, it has it's own logic implemented with
 * generators. Every time we "run" "mov" atom with a VM, system runs it's generator function, which
 * moves only few near atoms (CFG.ATOM.moveTries) and postpones the rest of atoms to the next mov()
 * function call. This allows to run "mov" atom smoothly and not to freeze the system. Generator
 * related data is located in vms.movMap, which contains a map of arrays of generator functions.
 */
import CFG from './cfg.js'
import { VM_OFFS_SHIFT, VM_OFFS_MASK, VM_ENERGY_MASK, ATOM_TYPE_MASK, ATOM_TYPE_UNMASK, NO_DIR,
  ATOM_CON, MOV_BREAK_MASK, MOV_BREAK_UNMASK, DMA, DNA, DMD, DIR_REV, UInt32Array, UInt64Array,
  ATOMS_SECTIONS, ATOM_MOV, ATOM_MOV_MOVING_MASK, ATOM_MOV_DONE_MASK, ATOM_MOV_UNMASK } from './shared.js'
import { get, move, put, offs, toOffs } from './world.js'
import { vmDir, b1Dir, b2Dir, b3Dir, ifDir, thenDir, elseDir, setVmDir, setThenDir, setElseDir, type,
  secIdx, secVal, getBitIdx, setBits } from './atom.js'

export const CMDS = [nop, mov, fix, spl, con, job, rep, mut]

export default function VMs(w, vmOffs) {
  const vms = {
    offs: UInt64Array.create(0),                                     // 64bit array of VMs: (32bit - vm offset, 32bit - vm energy)
    map: {},                                                         // key: 32bit vm offs, val: UInt32Array vm indexes in offs array
    movMap: {},                                                      // contains a map of arrays of mov() generator functions to make moving smooth
    w
  }
  vmOffs && set(vms, vmOffs)
  return vms
}

export function set(vms, offs) {
  vms.offs = offs
  const l = offs.i
  const map = vms.map
  for (let i = 0; i < l; i++) {
    const o = toOffs(offs[i])
    const m = map[o]
    map[o] = m ? (m.end() ? m.double() : m) : UInt32Array.create(1)
    map[o].add(i)
  }
}

export function vm(offs, energy = 0) {
  return ((BigInt(offs) << VM_OFFS_SHIFT) & VM_OFFS_MASK) | (BigInt(energy) & VM_ENERGY_MASK)
}

export function nrg(offs) {
  return Number(offs & VM_ENERGY_MASK)
}

export function ticks(vms) {
  for (let round = 0, roundl = CFG.rpi; round < roundl; round++)
    for (let vmIdx = 0; vmIdx < vms.offs.i;)
      vmIdx = tick(vms, vmIdx)
}
/**
 * Runs one atom (make one tick) using current VM instance and it's related data. The VM must be
 * above a concrete atom (not empty).
 * @param {Object} vms Instance returned by VMs function
 * @param {Number} vmIdx Index of current VM instance to run
 * @returns {Number} next VM index to run
 */
export function tick(vms, vmIdx) {
  let offs = toOffs(vms.offs[vmIdx])
  let a    = get(vms.w, offs)
  let typ  = type(a)
  let inc
  if (typ === ATOM_MOV) {                                            // for "mov" atom we do it's generator fn run or continue
    if (a & ATOM_MOV_DONE_MASK) {                                    // "mov" atom completed moving of near atoms on prev call, we have to move VM to the next atom & skip this call
      put(vms.w, offs, a & ATOM_MOV_UNMASK)                          // removes "moving" bit
      delete vms.movMap[offs]                                        // we have to remove "mov" atom generator fn from a map
      inc = moveVm(vms, a, vmIdx, offs)                              // we move VM to the next atom & run VM again on next atom
      return vmIdx + (inc < 0 ? 0 : 1)                               // if VM was removed, then we return -1, otherwise we return next VM index
    }
    if (typ === ATOM_MOV) {                                          // it's possiblr that a VM was moved to near atom, so we have to check it again
      if (!vms.movMap[offs]) vms.movMap[offs] = mov(vms, a, vmIdx)   // this is a first time we run a mov() on this offs, so we create a generator fn
      const val = vms.movMap[offs].next()                            // val === new vmIdx
      inc = val.value
      if (val.done) delete vms.movMap[offs]                          // we have to remove "mov" atom generator fn
    } else inc = CMDS[typ](vms, a, vmIdx)                            // for all other atoms we run just normal functions (spl, rep,...)
  } else inc = CMDS[typ](vms, a, vmIdx)                              // for all other atoms we run just normal functions (spl, rep,...)
  // TODO: why do we start from 0 if inc < 0
  return vmIdx + (inc < 0 ? 0 : 1)
}

export function parseVM(vm) {
  return `offs: ${toOffs(vm)}, nrg: ${nrg(vm)}`
}

function nop() {}
/**
 * mov atom is special, because it contains move logic related to it and near atoms. First version
 * worked in a way where all near atoms moved together with the main and it produced huge fps delays.
 * So I decided to run only CFG.ATOM.moveTries attempts per one mov atom call to make entire
 * system to work smoother and up fps.
 */
function* mov(vms, a, vmIdx) {
  //
  // Left bit of every number is a flag, which means - "possible to break". It means
  // that we may break mov command running and continue next time. Break is only possible,
  // if all previous flags are equal to 1.
  //
  const atoms = {
    stack: new UInt32Array(CFG.ATOM.stackBufSize),                   // stack of offsets of atoms to move
    idx: 0,                                                          // current index in the stack
    offs: {},                                                        // offs[offset] = true, means that atom was already moved in prev iteration
    frozen: {}                                                       // frozen[offset] = direction, means that this atom's bond shouldn't be updated
  }
  const vmOffs = atoms.stack[atoms.idx++] = toOffs(vms.offs[vmIdx])  // put "mov" atom offs into the stack
  const w = vms.w
  put(w, vmOffs, (a & ATOM_MOV_UNMASK) | ATOM_MOV_MOVING_MASK)       // sets "moving" bit. means that "moving" is active now
  const movDir = b1Dir(a)                                            // mov direction
  let moved = 0
  let tries = 0
  while (atoms.idx > 0) {                                            // go for all items in stack
    tries++ >= CFG.ATOM.moveTries && (tries = 0, yield vmIdx)        // after few move attempts we have to leave this fn
    const aOffs = fromStack(atoms)                                   // last offs in stack (not pop)
    a = get(w, aOffs)
    if (atoms.offs[aOffs] || !a) { atoms.idx--; continue }           // this offs was already moved or no atom
    const dstOffs = offs(aOffs, movDir)                              // dest offset we are going to move
    if (get(w, dstOffs)) {                                           // dest place is not free
      atoms.stack[atoms.idx++] = dstOffs | MOV_BREAK_MASK            // MOV_BREAK_MASK means "we may interrupt mov here"
      if (atoms.idx > CFG.ATOM.stackBufSize) break
      continue
    }
    const oldA = a
    atoms.idx--                                                      // pop atom offs from stack
    if (vms.movMap[aOffs]) {                                         // if cur atom is "mov" we have to update it's generator's key in a vms.movMap
      vms.movMap[dstOffs] = vms.movMap[aOffs]
      delete vms.movMap[aOffs]
    }
    move(w, aOffs, dstOffs)                                          // dest place is free, move atom
    const m = vms.map[aOffs]                                         // if atom have > 1 VMs, then we move them all to the dst position
    while (m && m.i > 0) {                                           // move all VMs from old atom pos to moved pos
      if (vmIdx === m[0]) vmIdx = moveVm(vms, a, m[0], aOffs, 0, movDir) // moving current VM, so we update vmIdx
      else moveVm(vms, a, m[0], aOffs, 0, movDir)                    // moving a VM of near atom, so we do not need to update vmIdx
      if (vmIdx < 0) {
        delete vms.movMap[vmOffs]                                    // we have to remove "mov" atom generator fn
        return vmIdx                                                 // no energy for current VM
      }
    }
    atoms.offs[dstOffs] = true                                       // add moved atom to moved store
    moved++                                                          // calc amount of moved near atoms
    if (type(a) === ATOM_CON) {                                      // update bonds of "if" atom. we don't neet to update spl, fix
      a = rebond(w, a, aOffs, movDir, thenDir, setThenDir, atoms)    // update then bond of moved atom
      a = rebond(w, a, aOffs, movDir, elseDir, setElseDir, atoms)    // update else bond of moved atom
    } else a = rebond(w, a, aOffs, movDir, vmDir, setVmDir, atoms)   // update vm bond of moved atom
    rebond2(w, aOffs, movDir, atoms)                                 // update near atoms bonds
    oldA !== a && put(w, dstOffs, a)                                 // put updated atom back to the world
  }

  const aOffs = toOffs(vms.offs[vmIdx])                              // gets current "mov" atom offset
  a = get(w, aOffs)
  if (a && type(a) === ATOM_MOV) {                                   // it should be "mov" atom, so we set "moving" bit to "done" state
    put(w, aOffs, (a & ATOM_MOV_UNMASK) | ATOM_MOV_DONE_MASK)        // sets "moving" bit for current mov atom to "done"
  }
  return updateNrg(vms, vmIdx, -moved * CFG.ATOM.NRG.mov)            // after all near atoms moved we have to decrease VM energy
}

function fix(vms, a, vmIdx) {
  const w       = vms.w
  const vmOffs  = toOffs(vms.offs[vmIdx])
  const o1      = offs(vmOffs, b1Dir(a))
  let a1        = get(w, o1)
  if (a1 === 0) return moveVm(vms, a, vmIdx, vmOffs, -CFG.ATOM.NRG.fix)
  const b2d     = b2Dir(a)
  const o2      = offs(o1, b2d)
  let a2        = get(w, o2)
  if (a2 === 0) return moveVm(vms, a, vmIdx, vmOffs, -CFG.ATOM.NRG.fix)
  if (type(a1) !== ATOM_CON && vmDir(a1) === NO_DIR) {               // creates vm bond from atom 1 to atom 2
    vmIdx = updateNrg(vms, vmIdx, -CFG.ATOM.NRG.onFix)
    put(w, o1, setVmDir(a1, b2d))
  } else if (type(a2) !== ATOM_CON && vmDir(a2) === NO_DIR) {
    vmIdx = updateNrg(vms, vmIdx, -CFG.ATOM.NRG.onFix)               // creates vm bond from atom 2 to atom 1
    put(w, o2, setVmDir(a2, DIR_REV[b2d]))
  }
  // move vm to the next atom offset. we have to get latest atom from
  // the world, because it may be changed during fix atom work
  if (vmIdx > -1) vmIdx = moveVm(vms, get(w, vmOffs), vmIdx, vmOffs, -CFG.ATOM.NRG.fix)
  return vmIdx
}

function spl(vms, a, vmIdx) {
  const w       = vms.w
  const vmOffs  = toOffs(vms.offs[vmIdx])
  const o1      = offs(vmOffs, b1Dir(a))
  let a1        = get(w, o1)
  if (a1 === 0) return moveVm(vms, a, vmIdx, vmOffs, -CFG.ATOM.NRG.spl)
  const b2d     = b2Dir(a)
  const o2      = offs(o1, b2d)
  let a2        = get(w, o2)
  if (a2 === 0) return moveVm(vms, a, vmIdx, vmOffs, -CFG.ATOM.NRG.spl)
  if (type(a1) !== ATOM_CON && vmDir(a1) !== NO_DIR && b2d === vmDir(a1)) {
    vmIdx = updateNrg(vms, vmIdx, CFG.ATOM.NRG.onSpl)                // splits vm bond from atom 1 to atom 2
    put(w, o1, setVmDir(a1, NO_DIR))
  } else if (type(a2) !== ATOM_CON && vmDir(a2) !== NO_DIR && DIR_REV[b2d] === vmDir(a2)) {
    vmIdx = updateNrg(vms, vmIdx, CFG.ATOM.NRG.onSpl)                // splits vm bond from atom 2 to atom 1
    put(w, o2, setVmDir(a2, NO_DIR))
  }
  // move vm to the next atom offset. we have to get latest atom from
  // the world, because it may be changed during spl atom work
  if (vmIdx > -1) vmIdx = moveVm(vms, get(w, vmOffs), vmIdx, vmOffs, -CFG.ATOM.NRG.spl)
  return vmIdx
}

function con(vms, a, vmIdx) {
  const dir3 = b3Dir(a)
  const vmOffs = toOffs(vms.offs[vmIdx])
  const ifOffs = offs(vmOffs, ifDir(a))
  // if then else mode
  if (dir3 == NO_DIR) {
    const atom = get(vms.w, ifOffs)
    return moveVm(vms, a, vmIdx, vmOffs, -CFG.ATOM.NRG.con, atom ? thenDir(a) : elseDir(a))
  }
  // atoms compare mode
  const similar = type(get(vms.w, ifOffs)) === type(get(vms.w, offs(vmOffs, dir3)))
  return moveVm(vms, a, vmIdx, vmOffs, -CFG.ATOM.NRG.con, similar ? thenDir(a) : elseDir(a))
}

function job(vms, a, vmIdx) {
  const vmOffs    = toOffs(vms.offs[vmIdx])
  const newVmOffs = offs(vmOffs, b1Dir(a))
  if (get(vms.w, newVmOffs)) {
    const energy = Math.floor(nrg(vms.offs[vmIdx]) / 2)
    if (energy > 0) {
      addVm(vms, newVmOffs, energy)                                  // adds new vm to near atom with energy / 2
      vms.offs[vmIdx] = vm(vmOffs, energy)                           // updates energy of current vm
    }
  }

  // move vm to the next atom offset
  return moveVm(vms, a, vmIdx, vmOffs, -CFG.ATOM.NRG.job)
}

function rep(vms, a, vmIdx) {
  const vmOffs = toOffs(vms.offs[vmIdx])
  const a1Offs = offs(vmOffs, b1Dir(a))
  const a1     = get(vms.w, a1Offs)
  if (a1 === 0) return moveVm(vms, a, vmIdx, vmOffs, -CFG.ATOM.NRG.rep)
  const a2Offs = offs(a1Offs, b2Dir(a))
  const a2     = get(vms.w, a2Offs)
  if (a2 === 0) return moveVm(vms, a, vmIdx, vmOffs, -CFG.ATOM.NRG.rep)

  if (type(a1) === type(a2)) put(vms.w, a2Offs, (a2 & ATOM_TYPE_MASK) | (a1 & ATOM_TYPE_UNMASK))
  // move vm to the next atom offset
  return moveVm(vms, a, vmIdx, vmOffs, -CFG.ATOM.NRG.rep)
}

function mut(vms, a, vmIdx) {
  const vmOffs = toOffs(vms.offs[vmIdx])                             // gets offset of the current VM on a current atom
  const a1Offs = offs(vmOffs, b1Dir(a))                              // offset of the destination atom, we are gonna mutate
  const a1     = get(vms.w, a1Offs)                                  // destination atom
  let nrg      = 0
  if (a1) {                                                          // we found near atom to mutate
    const typ    = type(a1)                                          // near atom's type
    const idx    = secIdx(a)                                         // index of near atom section
    const bitIdx = getBitIdx(typ, idx)                               // gets index of first bit for the section value "val"
    if (bitIdx < 0) return vmIdx
    const val    = secVal(a)                                         // value to change inside near atom
    const valLen = ATOMS_SECTIONS[typ][idx]                          // value length
    put(vms.w, a1Offs, setBits(a1, val, bitIdx, valLen))             // put updated atom into the canvas data array
    nrg = -CFG.ATOM.NRG.mut                                          // mutation completed, it requires energy
  }

  return moveVm(vms, a, vmIdx, vmOffs, nrg)                          // move vm to the next atom offset & decrease energy for mut atom
}
/**
 * Moves VM from one atom to another if possible and updates related
 * vm.offs array & vm.map. It gets aOffs and calc destination offset
 * using dir. If dir is not set, then it uses vmDir of atom.
 */
function moveVm(vms, a, vmIdx, aOffs, energy = 0, dir = NO_DIR) {
  const newIdx = updateNrg(vms, vmIdx, energy)
  if (newIdx < 0) return newIdx                                      // VM was removed
  const d = dir !== NO_DIR ? dir : vmDir(a)                          // if dir is not set, then we use vmDir of atom
  const dstOffs = offs(aOffs, d)
  if (d === NO_DIR || !get(vms.w, dstOffs)) return newIdx            // move VM dir is not set or destination atom doesn't exist
  const m = vms.map
  let md = m[dstOffs]
  if (md === undefined) md = m[dstOffs] = UInt32Array.create(1)
  else if (md.end()) md = m[dstOffs] = md.double()
  md.add(vmIdx)                                                      // sets dst VM index
  const o = vms.offs[vmIdx]
  md = m[toOffs(o)]
  md.del(md.index(vmIdx))                                            // removed VM old offset index
  if (md.i === 0) delete m[toOffs(o)]
  vms.offs[vmIdx] = vm(dstOffs, nrg(o))                              // sets VM new offset index
  return newIdx
}

/**
 * Adds one VM to vms offs and map
 */
export function addVm(vms, o, energy) {
  if (!get(vms.w, o)) return                                         // no atom on this offset, so we can't add VM
  const m = vms.map
  let offs = vms.offs
  if (offs.end()) offs = vms.offs = offs.double()                    // if offs array is full, then double it
  offs.add(vm(o, energy))                                            // adds new VM, which consists of VM offs and energy

  if (m[o] === undefined) m[o] = UInt32Array.create(1)
  else if (m[o].end()) m[o] = m[o].double()
  m[o].add(offs.i - 1)
  return offs.i - 1                                                  // returns index of added VM in vms.offs array (vmIdx)
}

/**
 * Removes one VM from vms offs and the map
 */
function delVm(vms, idx) {
  const offs = vms.offs
  if (idx < offs.i - 1) {                                            // remove 1 vm from offs requires update of associated map
    const o = toOffs(offs[offs.i - 1])                               // get offset of last VM in the offs array
    const indexes = vms.map[o]
    if (indexes) {
      const i = indexes.index(offs.i - 1)
      if (i >= 0) indexes[i] = idx
    }
  }
  const o = toOffs(offs[idx])
  offs.del(idx)                                                      // removes vm from vm offs array
  const indexes = vms.map[o]
  if (indexes === undefined) return
  const i = indexes.index(idx)
  if (i < 0) return
  indexes.del(i)                                                     // remove VM index from the map
  if (indexes.i === 0) delete vms.map[o]                             // there are no other vms on this offset
}

/**
 * Updates moved atom bonds
 */
function rebond(w, a, o, mdir, dirFn, setDirFn, atoms) {
  const dir = dirFn(a)                                               // gets direction of near atom
  if (mdir === dir) return a                                         // direction the same. skip dir change
  if (dir === NO_DIR) return a                                       // current bond has no exist
  const dstOffs = offs(o, dir)                                       // near atom offset
  if (get(w, dstOffs)) {                                             // atom, where the bond points exists
    const newDir = DMA[dir][mdir]                                    // updated direction for near atom bond to moved
    if (newDir === NO_DIR) {                                         // if distance between moved atom and the bond atom is > 1
      atoms.stack[atoms.idx++] = dstOffs                             // handle this atom later
      atoms.frozen[offs(o, mdir)] = dir                              // this bond of moved atom shouldn't be updated later by other atoms
    } else if (atoms.frozen[o] !== dir) a = setDirFn(a, newDir)      // update moved atom's bond
  }
  return a
}

/**
 * Updates near atoms bonds
 */
function rebond2(w, o, mdir, atoms) {
  const dirs = DMD[mdir]                                             // array of all near atoms directions
  for (let i = 0; i < 8; i++) {                                      // go through all near atoms
    const d = dirs[i]                                                // current direction of near atom
    if (i === mdir) continue                                         // exclude direction of moved atom
    const dstOffs = offs(o, i)                                       // near atom offset
    let a = get(w, dstOffs)                                          // near atom
    if (!a) continue                                                 // near atom doesn't exist
    const revDir = vmDir(a)                                          // vm bond of near atom
    const rDir = DIR_REV[i]                                          // opposite direction of near atom
    if (d === NO_DIR) {                                              // distance between moved and near atom still == 1
      const oldA = a
      if (revDir === rDir && atoms.frozen[dstOffs] !== rDir) a = setVmDir(a, DNA[revDir][mdir])
      else if (type(a) === ATOM_CON) {                               // for "if" atom update then, else bonds
        const thend = thenDir(a)
        const elsed = elseDir(a)
        if (atoms.frozen[dstOffs] !== rDir) {
          if (thend === rDir) a = setThenDir(a, DNA[thend][mdir])
          if (elsed === rDir) a = setElseDir(a, DNA[elsed][mdir])
        }
      }
      oldA !== a && put(w, dstOffs, a)                               // update near atom's bond
    } else {                                                         // distance between moved atom and near > 1
      if (revDir == rDir || type(a) === ATOM_CON && (thenDir(a) === rDir || elseDir(a) === rDir)) {
        atoms.stack[atoms.idx++] = dstOffs
        atoms.frozen[dstOffs] = rDir
      }
    }
  }
}

function fromStack(atoms) {
  return atoms.stack[atoms.idx - 1] & MOV_BREAK_UNMASK
}

function updateNrg(vms, vmIdx, energy) {
  if (!energy) return vmIdx
  const o = vms.offs[vmIdx]
  const newNrg = nrg(o) + energy
  if (newNrg < 1) {
    delVm(vms, vmIdx)
    return -1
  }
  vms.offs[vmIdx] = vm(toOffs(o), newNrg)
  return vmIdx
}