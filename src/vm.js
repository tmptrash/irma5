import CFG from './cfg'
import { VM_OFFS_SHIFT, VM_VMS_MASK, NO_DIR, ATOM_CON, MOV_BREAK_MASK } from './shared'
import { type, atom, offs, offs4, isAtom, move, dot } from './world'
import { vmDir, b1Dir, b2Dir, b3Dir, ifDir, thenDir, elseDir, setVmDir } from './atom'

const CMDS = [nop, mov, fix, spl, con, job, rep]
const DIR_REV = [4, 5, 6, 7, 0, 1, 2, 3]
//
// Dir Mov Atom - Directions map for the atom, which is moving. Is used for updating it's bonds
//
const DMA = [
  [NO_DIR,      7,      0, NO_DIR, NO_DIR, NO_DIR,      2,      3],
  [     3, NO_DIR,      1, NO_DIR, NO_DIR, NO_DIR, NO_DIR, NO_DIR],
  [     4,      5, NO_DIR,      1,      2, NO_DIR, NO_DIR, NO_DIR],
  [NO_DIR, NO_DIR,      5, NO_DIR,      3, NO_DIR, NO_DIR, NO_DIR],
  [NO_DIR, NO_DIR,      6,      7, NO_DIR,      3,      4, NO_DIR],
  [NO_DIR, NO_DIR, NO_DIR, NO_DIR,      7, NO_DIR,      5, NO_DIR],
  [     6, NO_DIR, NO_DIR, NO_DIR,      0,      1, NO_DIR,      5],
  [     7, NO_DIR, NO_DIR, NO_DIR, NO_DIR, NO_DIR,      1, NO_DIR]
]
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
  STACK[stackIdx++] = offs4(vm.vmsOffs[vmIdx]) // put mov atom offs into the stack
  const movDir = b1Dir(a)                      // mov direction
  for (; stackIdx > -1; stackIdx--) {          // go for all items in stack
    const offs = STACK[stackIdx - 1]           // last offs in stack (not pop)
    if (MOVED[offs]) { stackIdx--; continue }  // this offs was already moved
    const dstOffs = offs(offs, movDir)         // dest offset we are goint to move
    const a = atom(dstOffs)                    // destination position of moved atom
    if (a === 0) {                             // dest place is not free
      STACK[stackIdx++] = dstOffs | MOV_BREAK_MASK
      continue
    }
    stackIdx--                                 // pop atom offs from stack
    move(vm.w, offs, dstOffs)                  // dest place is free, move atom
    MOVED[dstOffs] = true                      // add moved atom to moved store
    if (type(a) === ATOM_CON) {                // update bonds of if atom
      const trueDir = thenDir(a)               // update then direction of "if" atom
      const trueOffs = offs(offs, trueDir)
      if (atom(trueOffs)) {                    // atom, where then bond points exists
        const newDir = DMA[trueDir][movDir]    // updated direction for then atom bond to moved
        if (DMA[trueDir][movDir] === NO_DIR) { // if distance between moved atom and then bond atom is > 1
          STACK[stackIdx++] = trueOffs         // handle this atom later
        } else {
          setVmDir(a, newDir)                  // update moved atom then bond
          dot(vm.w, dstOffs, a)                // put atom back to the world
        }
      }
    } else {                                   // update bonds of not "if" atom
      
    }
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
  moveVM(vm, a, vmIdx, vmOffs)
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
  moveVM(vm, a, vmIdx, vmOffs)
}

function con(vm, a, vmIdx) {
  const dir3 = b3Dir(a)
  const vmOffs = offs4(vm.vmsOffs[vmIdx])
  const ifOffs = offs(vmOffs, ifDir(a))
  // if then else mode
  if (!dir3) {
    const atom = isAtom(w, ifOffs)
    moveVM(vm, a, vmIdx, vmOffs, atom ? thenDir(a) : elseDir(a))
    return
  }
  // atoms compare mode
  const similar = type(atom(vm.w, ifOffs)) === type(atom(vm.w, offs(vmOffs, dir3)))
  moveVM(vm, a, vmIdx, vmOffs, similar ? thenDir(a) : elseDir(a))
}

function job(vm, a, vmIdx) {
  const vmOffs    = offs4(vm.vmsOffs[vmIdx])
  const newVmOffs = offs(vmOffs, b1Dir(a))
  if (!isAtom(w, newVmOffs)) {
    const offsIdx = findIdx(vm, newVmOffs)
    offsIdx !== -1 && addVm(newVmOffs, offsIdx, 1)
  }

  // move vm to the next atom offset
  moveVM(vm, a, vmIdx, vmOffs)
}

function rep(vm, a, vmIdx) {
  const vmOffs = offs4(vm.vmsOffs[vmIdx])
  const a1     = atom(vm.w, offs(vmOffs, b1Dir(a)))
  const a2Offs = offs(vmOffs, b2Dir(a))
  const a2     = atom(vm.w, a2Offs)
  a1 && a2 && putAtom(vm.w, a2Offs, (a2 & ATOM_TYPE_MASK) | (a1 & ATOM_TYPE_UNMASK))
  // move vm to the next atom offset
  moveVM(vm, a, vmIdx, vmOffs)
}

/**
 * Moves VM from one atom to another if possible and updates
 * related vm.vmsOffs array
 */
function moveVM(vm, a, offsIdx, offs, dir = NO_DIR) {
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