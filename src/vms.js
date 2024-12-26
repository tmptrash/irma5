import CFG from './cfg.js'
import { VM_OFFS_SHIFT, VM_OFFS_MASK, VM_ENERGY_MASK, ATOM_TYPE_MASK,
  ATOM_TYPE_UNMASK, NO_DIR, ATOM_CON, MOV_BREAK_MASK, MOV_BREAK_UNMASK,
  DMA, DNA, DMD, DIR_REV, UInt32Array, UInt64Array } from './shared.js'
import { get, move, put, offs, toOffs } from './world.js'
import { vmDir, b1Dir, b2Dir, b3Dir, ifDir, thenDir, elseDir,
  setVmDir, setThenDir, setElseDir, type } from './atom.js'
//
// Left bit of every number is a flag, which means - "possible to break". It means
// that we may break mov command running and continue next time. Break is only possible,
// if all previous flags are equal to 1.
//
const STACK = new UInt32Array(CFG.ATOM.stackBufSize)
let stackIdx = 0
let MOVED = {}

export const CMDS = [nop, mov, fix, spl, con, job, rep]

export default function VMs(w, vmOffs) {
  const vms = {
    offs: UInt64Array.create(0), // 64bit array of VMs: (32bit - vm offset, 32bit - vm energy)
    map: {},                     // key: 32bit vm offs, val: UInt32Array vm indexes in offs array
    w
  }
  set(vms, vmOffs)
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
    for (let vmIdx = 0; vmIdx < vms.offs.i;) {
      const a = get(vms.w, toOffs(vms.offs[vmIdx]))
      const inc = CMDS[type(a)](vms, a, vmIdx)
      vmIdx += (inc < 0 ? 0 : 1)
    }
}

export function tick(vms, vmIdx) {
  const a = get(vms.w, toOffs(vms.offs[vmIdx]))
  const inc = CMDS[type(a)](vms, a, vmIdx)
  return vmIdx + (inc < 0 ? 0 : 1)
}

function nop() {}

function mov(vms, a, vmIdx) {
  const vmOffs = STACK[stackIdx++] = toOffs(vms.offs[vmIdx])// put mov atom offs into the stack
  const oldAtom = a
  const atomOffs = fromStack()                             // offset of moved atom
  const movDir = b1Dir(a)                                  // mov direction
  const w = vms.w
  let moved = 0
  while (stackIdx > 0) {                                   // go for all items in stack
    const aOffs = fromStack()                              // last offs in stack (not pop)
    a = get(w, aOffs)
    if (MOVED[aOffs] || !a) { stackIdx--; continue }       // this offs was already moved or no atom
    const dstOffs = offs(aOffs, movDir)                    // dest offset we are going to move
    if (get(w, dstOffs)) {                                 // dest place is not free
      STACK[stackIdx++] = dstOffs | MOV_BREAK_MASK         // MOV_BREAK_MASK means "we may interrupt mov here"
      continue
    }
    const oldA = a
    stackIdx--                                             // pop atom offs from stack
    move(w, aOffs, dstOffs)                                // dest place is free, move atom
    const m = vms.map[aOffs]                               // if atom have > 1 VMs, then we move them all to the dst position
    while (m && m.i > 0) {                                 // move all VMs from old atom pos to moved pos
      if (aOffs === vmOffs && m[0] === vmIdx) vmIdx = moveVm(vms, a, m[0], aOffs, 0, movDir)
      else moveVm(vms, a, m[0], aOffs, 0, movDir)
    }
    MOVED[dstOffs] = true                                  // add moved atom to moved store
    moved++                                                // calc amount of moved near atoms
    if (type(a) === ATOM_CON) {                            // update bonds of if atom. we don't neet to update spl, fix
      a = rebond(w, a, aOffs, movDir, thenDir, setThenDir) // update then bond of moved atom
      a = rebond(w, a, aOffs, movDir, elseDir, setElseDir) // update else bond of moved atom
    }
    a = rebond(w, a, aOffs, movDir, vmDir, setVmDir)       // update vm bond of moved atom
    rebond2(w, aOffs, movDir)                              // update near atoms bonds
    oldA !== a && put(w, dstOffs, a)                       // put updated atom back to the world
  }
  MOVED = {}                                               // reset moved and stack sets
  stackIdx = 0

  if (oldAtom !== get(w, atomOffs)) {                      // move VM to the next atom
    const newOffs = offs(atomOffs, movDir)
    vmIdx = updateNrg(vms, vmIdx, -moved * CFG.ATOM.NRG.mov)
    vmIdx > -1 && moveVm(vms, get(w, newOffs), vmIdx, newOffs)
  }
  return vmIdx
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
  if (type(a1) !== ATOM_CON && b2d !== vmDir(a1)) {
    vmDir(a1) === NO_DIR && (vmIdx = updateNrg(vms, vmIdx, -CFG.ATOM.NRG.onFix))
    a1 = setVmDir(a1, b2d)
    put(w, o1, a1)
  } else if (type(a2) !== ATOM_CON && DIR_REV[b2d] !== vmDir(a2)) {
    vmDir(a2) === NO_DIR && (vmIdx = updateNrg(vms, vmIdx, -CFG.ATOM.NRG.onFix))
    a2 = setVmDir(a2, DIR_REV[b2d])
    put(w, o2, a2)
  }
  // move vm to the next atom offset
  if (vmIdx > -1) vmIdx = moveVm(vms, a, vmIdx, vmOffs, -CFG.ATOM.NRG.fix)
  return vmIdx
}

function spl(vms, a, vmIdx) {
  const w       = vms.w
  const vmOffs  = toOffs(vms.offs[vmIdx])
  const o1      = offs(vmOffs, b1Dir(a))
  let a1        = get(w, o1)
  if (a1 === 0) return moveVm(vms, a, vmIdx, vmOffs, -CFG.ATOM.NRG.spl)
  const o2      = offs(o1, b2Dir(a))
  let a2        = get(w, o2)
  if (a2 === 0) return moveVm(vms, a, vmIdx, vmOffs, -CFG.ATOM.NRG.spl)
  if (vmDir(a1) !== NO_DIR && type(a1) !== ATOM_CON) {
    a1 = setVmDir(a1, NO_DIR)
    put(w, o1, a1)
    vmIdx = updateNrg(vms, vmIdx, CFG.ATOM.NRG.onSpl)
  } else if (vmDir(a2) !== NO_DIR && type(a2) !== ATOM_CON) {
    a2 = setVmDir(a2, NO_DIR)
    put(w, o2, a2)
    vmIdx = updateNrg(vms, vmIdx, CFG.ATOM.NRG.onSpl)
  }
  // move vm to the next atom offset
  if (vmIdx > -1) vmIdx = moveVm(vms, a, vmIdx, vmOffs, -CFG.ATOM.NRG.spl)
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
      addVm(vms, newVmOffs, energy)                        // adds new vm to near atom with energy / 2
      vms.offs[vmIdx] = vm(vmOffs, energy)                 // updates energy of current vm
    }
  }

  // move vm to the next atom offset
  return moveVm(vms, a, vmIdx, vmOffs, -CFG.ATOM.NRG.job)
}

function rep(vms, a, vmIdx) {
  const vmOffs = toOffs(vms.offs[vmIdx])
  const a1Offs = offs(vmOffs, b1Dir(a))
  const a1     = get(vms.w, a1Offs)
  const a2Offs = offs(a1Offs, b2Dir(a))
  const a2     = get(vms.w, a2Offs)

  if (a1 && a2 && type(a1) === type(a2)) put(vms.w, a2Offs, (a2 & ATOM_TYPE_MASK) | (a1 & ATOM_TYPE_UNMASK))
  // move vm to the next atom offset
  return moveVm(vms, a, vmIdx, vmOffs, -CFG.ATOM.NRG.rep)
}

/**
 * Moves VM from one atom to another if possible and updates
 * related vm.offs array
 */
function moveVm(vms, a, vmIdx, aOffs, energy = 0, dir = NO_DIR) {
  const d = dir !== NO_DIR ? dir : vmDir(a)
  const dstOffs = offs(aOffs, d)
  if (d === NO_DIR || !get(vms.w, dstOffs)) return vmIdx
  const m = vms.map
  let md = m[dstOffs]
  if (md === undefined) md = m[dstOffs] = UInt32Array.create(1)
  if (md.end()) md = m[dstOffs] = md.double()
  md.add(vmIdx)                                            // sets dst VM index
  const o = vms.offs[vmIdx]
  md = m[toOffs(o)]
  md.del(md.index(vmIdx))                                  // removed VM old offset index
  if (md.i === 0) delete m[toOffs(o)]
  vms.offs[vmIdx] = vm(dstOffs, nrg(o))                    // sets VM new offset index
  return updateNrg(vms, vmIdx, energy)
}

/**
 * Adds one VM to vms array and map
 */
export function addVm(vms, o, energy) {
  const m = vms.map
  let offs = vms.offs
  if (offs.end()) offs = vms.offs = offs.double()
  offs.add(vm(o, energy))
  if (m[o] === undefined) m[o] = UInt32Array.create(1)
  if (m[o].end()) m[o] = m[o].double()
  m[o].add(offs.i - 1)
  return offs.i - 1
}

/**
 * Removes one VM from vms array and associated map
 */
function delVm(vms, idx) {
  const offs = vms.offs
  if (idx < offs.i - 1) {                                  // remove 1 vm from offs requires update of associated map
    const o = toOffs(offs[offs.i - 1])
    const indexes = vms.map[o]
    if (indexes) {
      const i = indexes.index(offs.i - 1)
      if (i >= 0) indexes[i] = idx
    }
  }
  const o = toOffs(offs[idx])
  offs.del(idx)                                            // removes vm from vm offs array
  const indexes = vms.map[o]
  if (indexes === undefined) return
  const i = indexes.index(idx)
  if (i < 0) return
  indexes.del(i)                                           // remove VM index from the map
  if (indexes.i === 0) delete vms.map[o]                   // there are no other vms on this offset
}

/**
 * Updates moved atom bonds
 */
function rebond(w, a, o, mdir, dirFn, setDirFn) {
  const dir = dirFn(a)                                     // gets direction of near atom
  if (mdir === dir) return a                               // direction the same. skip dir change
  if (dir === NO_DIR) return a                             // current bond has no exist
  const dstOffs = offs(o, dir)                             // near atom offset
  if (get(w, dstOffs)) {                                   // atom, where the bond points exists
    const newDir = DMA[dir][mdir]                          // updated direction for near atom bond to moved
    if (newDir === NO_DIR) {                               // if distance between moved atom and the bond atom is > 1
      STACK[stackIdx++] = dstOffs                          // handle this atom later
    } else a = setDirFn(a, newDir)                         // update moved atom's bond
  }
  return a
}

/**
 * Updates near atoms bonds
 */
function rebond2(w, o, mdir) {
  const dirs = DMD[mdir]                                   // array of all near atoms directions
  for (let i = 0; i < 8; i++) {                            // go through all near atoms
    const d = dirs[i]                                      // current direction of near atom
    if (i === mdir) continue                               // exclude direction of moved atom
    const dstOffs = offs(o, i)                             // near atom offset
    if (MOVED[dstOffs]) continue                           // if near atom is already moved, skip it
    let a = get(w, dstOffs)                                // near atom
    if (a) {                                               // near atom doesn't exist
      const revDir = vmDir(a)                              // vm bond of near atom
      const rDir = DIR_REV[i]                              // opposite direction of near atom
      if (d === NO_DIR) {                                  // distance between moved and near atom still == 1
        const oldA = a
        if (revDir === rDir) a = setVmDir(a, DNA[revDir][mdir])
        else if (type(a) === ATOM_CON) {                   // for "if" atom update then, else bonds
          const thend = thenDir(a)
          const elsed = elseDir(a)
          if (thend === rDir) a = setThenDir(a, DNA[thend][mdir])
          if (elsed === rDir) a = setElseDir(a, DNA[elsed][mdir])
        }
        oldA !== a && put(w, dstOffs, a)                   // update near atom's bond
      } else {                                             // distance between moved atom and near > 1
        if (revDir == rDir || type(a) === ATOM_CON && (thenDir(a) === rDir || elseDir(a) === rDir)) {
          STACK[stackIdx++] = dstOffs
        }
      }
    }
  }
}

function fromStack() {
  return STACK[stackIdx - 1] & MOV_BREAK_UNMASK
}

function updateNrg(vms, vmIdx, energy) {
  const o = vms.offs[vmIdx]
  const newNrg = nrg(o) + energy
  if (newNrg < 1) {
    delVm(vms, vmIdx)
    return -1
  }
  vms.offs[vmIdx] = vm(toOffs(o), newNrg)
  return vmIdx
}