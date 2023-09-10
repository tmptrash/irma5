import CFG from './cfg'
import { type, atom, offs, offs4, isAtom } from './world'
import { vmDir, b1Dir, b2Dir, b3Dir, ifDir, thenDir, elseDir, setVmDir } from './atom'
import { VM_OFFS_SHIFT, VM_VMS_MASK, NO_DIR, ATOM_CON } from './shared'

const CMDS = [nop, mov, fix, spl, con, job, rep]

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

function mov(vm, a) {}

function fix(vm, a, vmIdx) {
  const vmOffs  = offs4(vm.vmsOffs[vmIdx])
  const b1d     = b1Dir(a)
  const a1      = atom(vm.w, offs(vmOffs, b1d))
  if (a1 === 0) return
  const a2      = atom(vm.w, offs(vmOffs, b2Dir(a)))
  if (a2 === 0) return
  const a1VmDir = vmDir(a1)
  const a2VmDir = vmDir(a2)
  if (!a1VmDir && type(a1) !== ATOM_CON) setVmDir(a1, b1d)
  // TODO: we should get inverse direction to a1 from a2
  else if (!a2VmDir && type(a2) !== ATOM_CON) setVmDir(a2, b1d)

  // move vm to the next atom offset
  moveVM(vm, a, vmIdx, vmOffs)
}

function spl(vm, a, vmIdx) {
  const vmOffs  = offs4(vm.vmsOffs[vmIdx])
  const a1      = atom(vm.w, offs(vmOffs, b1Dir(a)))
  if (a1 === 0) return
  const a2      = atom(vm.w, offs(vmOffs, b2Dir(a)))
  if (a2 === 0) return
  const a1VmDir = vmDir(a1)
  const a2VmDir = vmDir(a2)
  if (a1VmDir && type(a1) !== ATOM_CON) setVmDir(a1, NO_DIR)
  // TODO: we should get inverse direction to a1 from a2
  else if (a2VmDir && type(a2) !== ATOM_CON) setVmDir(a2, NO_DIR)

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