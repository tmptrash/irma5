import CFG from './cfg'
import { VM_OFFS_SHIFT, VM_VMS_MASK, NO_DIR, ATOM_CON, MOV_BREAK_MASK, DMA, DMD, DIR_REV } from './shared'
import { type, atom, offs, offs4, isAtom, move, dot } from './world'
import { vmDir, b1Dir, b2Dir, b3Dir, ifDir, thenDir, elseDir, setVmDir, elseDir, setThenDir, setElseDir } from './atom'

const CMDS = [nop, mov, fix, spl, con, job, rep]
//
// Left bit of every number is a flag, which means - "possible to break". It means
// that we may break mov command running and continue next time. Break is only possible,
// if all previous flags are equal to 1
//
const STACK = new BigInt64Array(CFG.ATOM.moveBufSize)
let stackIdx = 0
let MOVED = {}

export default function VM(w) {
  return {
    vmsOffs: [],
    vmsLast: 0,
    vmMap: {},
    w
  }
}

export function setVMs(vm, vmsOffs) {
  vm.vmsOffs = vmsOffs
  const l = vm.vmsLast = vmsOffs.length
  const map = vm.vmMap
  for (let i = 0; i < l; i++) map[(vmsOffs[i] & VM_OFFS_MASK) >> VM_OFFS_SHIFT] = i
}

export function tick(vm) {
  for (let round = 0, roundl = CFG.rpi; round < roundl; round++)
    for (let vmIdx = 0, l = vm.vmsOffs.length; vmIdx < l; vmIdx++) {
      const a = atom(vm.w, vm.vmsOffs[vmIdx])
      CMDS[type(a)](vm, a, vmIdx)
    }
}

function nop() {}

function mov(vm, a, vmIdx) {
  STACK[stackIdx++] = offs4(vm.vmsOffs[vmIdx])         // put mov atom offs into the stack
  const movDir = b1Dir(a)                              // mov direction
  for (; stackIdx > -1; stackIdx--) {                  // go for all items in stack
    const offs = STACK[stackIdx - 1]                   // last offs in stack (not pop)
    if (MOVED[offs]) { stackIdx--; continue }          // this offs was already moved
    const dstOffs = offs(offs, movDir)                 // dest offset we are goint to move
    let a = atom(dstOffs)                              // destination position of moved atom
    if (a) {                                           // dest place is not free
      STACK[stackIdx++] = dstOffs | MOV_BREAK_MASK     // MOV_BREAK_MASK means "we may interrupt mov here"
      continue
    }
    const oldA = a
    stackIdx--                                         // pop atom offs from stack
    move(vm.w, offs, dstOffs)                          // dest place is free, move atom
    MOVED[dstOffs] = true                              // add moved atom to moved store
    if (type(a) === ATOM_CON) {                        // update bonds of if atom. we don't neet to update spl, fix
      a = rebond(a, offs, movDir, thenDir, setThenDir) // update then bond of moved atom
      a = rebond(a, offs, movDir, elseDir, setElseDir) // update else bond of moved atom
    }
    a = rebond(a, offs, movDir, vmDir, setVmDir)       // update vm bond of moved atom
    rebond2(vm.w, offs, movDir)                        // update near atoms bonds
    oldA !== a && dot(vm.w, dstOffs, a)                // put updated atom back to the world
  }
}

function fix(vm, a, vmIdx) {
  const vmOffs  = offs4(vm.vmsOffs[vmIdx])
  const b1d     = b1Dir(a)
  const a1      = atom(vm.w, offs(vmOffs, b1d))
  if (a1 === 0) return
  const a2      = atom(vm.w, offs(vmOffs, b2Dir(a)))
  if (a2 === 0) return
  if (!vmDir(a1) && type(a1) !== ATOM_CON) setVmDir(a1, b1d)
  else if (!vmDir(a2) && type(a2) !== ATOM_CON) setVmDir(a2, DIR_REV[b1d])
  // move vm to the next atom offset
  moveVm(vm, a, vmIdx, vmOffs)
}

function spl(vm, a, vmIdx) {
  const vmOffs  = offs4(vm.vmsOffs[vmIdx])
  const a1      = atom(vm.w, offs(vmOffs, b1Dir(a)))
  if (a1 === 0) return
  const a2      = atom(vm.w, offs(vmOffs, b2Dir(a)))
  if (a2 === 0) return
  if (vmDir(a1) && type(a1) !== ATOM_CON) setVmDir(a1, NO_DIR)
  else if (vmDir(a2) && type(a2) !== ATOM_CON) setVmDir(a2, NO_DIR)
  // move vm to the next atom offset
  moveVm(vm, a, vmIdx, vmOffs)
}

function con(vm, a, vmIdx) {
  const dir3 = b3Dir(a)
  const vmOffs = offs4(vm.vmsOffs[vmIdx])
  const ifOffs = offs(vmOffs, ifDir(a))
  // if then else mode
  if (!dir3) {
    const atom = isAtom(w, ifOffs)
    moveVm(vm, a, vmIdx, vmOffs, atom ? thenDir(a) : elseDir(a))
    return
  }
  // atoms compare mode
  const similar = type(atom(vm.w, ifOffs)) === type(atom(vm.w, offs(vmOffs, dir3)))
  moveVm(vm, a, vmIdx, vmOffs, similar ? thenDir(a) : elseDir(a))
}

function job(vm, a, vmIdx) {
  const vmOffs    = offs4(vm.vmsOffs[vmIdx])
  const newVmOffs = offs(vmOffs, b1Dir(a))
  if (!isAtom(w, newVmOffs)) {
    const offsIdx = findIdx(vm, newVmOffs)
    offsIdx !== -1 && addVm(newVmOffs, offsIdx, 1)
  }

  // move vm to the next atom offset
  moveVm(vm, a, vmIdx, vmOffs)
}

function rep(vm, a, vmIdx) {
  const vmOffs = offs4(vm.vmsOffs[vmIdx])
  const a1     = atom(vm.w, offs(vmOffs, b1Dir(a)))
  const a2Offs = offs(vmOffs, b2Dir(a))
  const a2     = atom(vm.w, a2Offs)
  a1 && a2 && putAtom(vm.w, a2Offs, (a2 & ATOM_TYPE_MASK) | (a1 & ATOM_TYPE_UNMASK))
  // move vm to the next atom offset
  moveVm(vm, a, vmIdx, vmOffs)
}

/**
 * Moves VM from one atom to another if possible and updates
 * related vm.vmsOffs array
 */
function moveVm(vm, a, offsIdx, offs, dir = NO_DIR) {
  let nextDir = dir || vmDir(a)
  if (nextDir === NO_DIR && dir !== NO_DIR) return
  nextDir--
  const vms      = getVms(vm.vmsOffs, offsIdx)
  const offsIdx1 = findIdx(vm, offs(vm.vmsOffs, nextDir))
  if (offsIdx1 === -1) return
  vms && addVm(vm.vmsOffs, offsIdx, -1)
  vms && addVm(vm.vmsOffs, offsIdx1, 1)
}

/**
 * Adds a number n to amount of vms in vmsOffs[idx]
 */
function addVm(vmsOffs, idx, n) {
  vmsOffs[idx] = (vmsOffs[idx] & VM_VMS_MASK) | (((vmsOffs[idx] & VM_OFFS_MASK) >> VM_OFFS_SHIFT) + n)
}

function getVms(vmsOffs, idx) {
  return vmsOffs[idx] & VM_VMS_MASK
}

/**
 * Finds an index in vmsOffs array of specified VM offset. If there is no
 * such offset it adds new empty cell to vmsOffs array
 */
function findIdx(vm, offs) {
  const idx = vm.vmMap[offs]
  if (idx !== undefined) return idx
  if (vm.vmsLast >= vm.vmsOffs.length || !isAtom(vm, offs)) return -1
  vmsOffs[vm.vmsLast++] = (offs << VM_OFFS_SHIFT)
  return vm.vmsLast
}

/**
 * Updates moved atom bonds
 */
function rebond(a, o, mdir, dirFn, setDirFn) {
  const dir = dirFn(a)                    // gets direction of near atom
  const dstOffs = offs(o, dir)            // near atom offset
  if (atom(dstOffs)) {                    // atom, where the bond points exists
    const newDir = DMA[dir][mdir]         // updated direction for near atom bond to moved
    if (newDir === NO_DIR) {              // if distance between moved atom and the bond atom is > 1
      STACK[stackIdx++] = dstOffs         // handle this atom later
    } else a = setDirFn(a, newDir)        // update moved atom's bond
  }
  return a
}

/**
 * Updates near atoms bonds
 */
function rebond2(w, o, mdir) {
  const dirs = DMD[mdir]                  // array of all near atoms directions
  for (let i = 0; i < 8; i++) {           // go through all near atoms
    const d = dirs[i]                     // current direction of near atom
    if (d === mdir) continue              // exclude direction of moved atom
    const dstOffs = offs(o, d)            // near atom affset
    let a = atom(dstOffs)                 // near atom
    if (a) {                              // near atom doesn't exist
      const revDir = vmDir(a)             // vm bond of near atom
      const rDir = DIR_REV[d]             // opposite direction of near atom
      if (d !== NO_DIR) {                 // means that distance between moved and near atom still == 1
        const oldA = a
        if (revDir === rDir) a = setVmDir(a, DNA[revDir][mdir])
        else if (type(a) === ATOM_CON) {  // for "if" atom update then, else bonds
          if (thenDir(a) === rDir) a = setThenDir(a, DNA[revDir][mdir])
          else if (elseDir(a) === rDir) a = setElseDir(a, DNA[revDir][mdir])
        }
        oldA !== a && dot(w, dstOffs, a)  // update near atom's bond
      } else {                            // distance between moved atom and near > 1
        if (revDir == rDir || type(a) === ATOM_CON && (thenDir(a) === rDir || elseDir(a) === rDir)) {
          STACK[stackIdx++] = dstOffs
        }
      }
    }
  }
}