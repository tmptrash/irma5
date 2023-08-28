import CFG from './cfg'
import { type, atom, offs, isAtom } from './world'
import { vmDir, b1Dir, b2Dir, setVmDir } from './atom'
import { VM_OFFS_SHIFT, NO_DIR, ATOM_CON } from './shared'

const CMDS = [nop, mov, fix, spl, con, job, rep]

export default function VM(w) {
  return {
    vmOffs: [],
    vmMap: {},
    w
  }
}

export function setVMs(vm, vmOffs) {
  vm.vmOffs = vmOffs
}

export function tick(vm) {
  for (let round = 0, roundl = CFG.rpi; round < roundl; round++)
    for (let vmIdx = 0, l = vm.vmOffs.length; vmIdx < l; vmIdx++) {
      const a = atom(vm.w, vm.vmOffs[vmIdx])
      CMDS[type(a)](vm, a, vmIdx)
    }
}

function nop() {}
function mov(vm, a) {}
function fix(vm, a, vmIdx) {
  const vmOffs  = vm.vmOffs[vmIdx]
  const b1d     = b1Dir(a)
  const a1Offs  = offs(vmOffs, b1d)
  const a2Offs  = offs(vmOffs, b2Dir(a))
  const a1      = atom(vm.w, a1Offs)
  if (a1 === 0) return
  const a2      = atom(vm.w, a2Offs)
  if (a2 === 0) return
  const a1VmDir = vmDir(a1)
  const a2VmDir = vmDir(a2)
  if (!a1VmDir && type(a1) !== ATOM_CON) { setVmDir(a1, b1d); return }
  // TODO: we should get inverse direction to a1 from a2
  if (!a2VmDir && type(a2) !== ATOM_CON) { setVmDir(a2, b1d); return }

  // move vm to the next atom offset
  updateVM(vm.w, vm.vmOffs, vmIdx, vmOffs)
}
function spl(vm, a) {}
function con(vm, a) {}
function job(vm, a) {}
function rep(vm, a) {}

function updateVM(w, vmOffs, vmIdx, offs) {
  const nextDir = vmDir(a)
  const newVmOffs = offs(vmOffs, newVmOffs)
  nextDir !== NO_DIR && isAtom(w, newVmOffs) && (vmOffs[vmIdx] = (vmOffs[vmIdx] & VM_OFFS_MASK) | (offs << VM_OFFS_SHIFT))
}