import CFG from './cfg'
import { typeByOffs } from './world'

const CMDS = [nop, mov, fix, spl, con, job]

export default function VM(w) {
  return {
    vmOffs: [],
    vmMap: {},
    w
  }
}

export function setVMOffs(vm, vmOffs) {
  vm.vmOffs = vmOffs
}

export function tick(vm) {
  for (let round = 0, roundl = CFG.rpi; round < roundl; round++)
    for (let o = 0, l = vm.vmOffs.length; o < l; o++)
      CMDS[typeByOffs(vm.w, vm.vmOffs[o])](vm)
}

function nop() {}
function mov(vm) {}
function fix(vm) {}
function spl(vm) {}
function con(vm) {}
function job(vm) {}
