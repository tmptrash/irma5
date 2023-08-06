import CFG from './cfg'
import { typeByOffs } from './world'

const OFFS_MSK = BigInt(0x00000000FFFFFFFF)
const CMDS     = [nop, mov, fix, spl, con, job]

export default function VM(w) {
  return {
    vmOffs: new BigUint64Array(CFG.vms),
    vmMap: {},
    w
  }
}

export function tick(vm) {
  for (let round = 0, roundl = CFG.rpi; round < roundl; round++)
    for (let i = 0, l = vm.vmOffs.length; i < l; i++) {}
      //CMDS[typeByOffs(vm.w, vm.vmOffs[i] & OFFS_MSK)](vm)
}

function nop() {}
function mov(vm) {}
function fix(vm) {}
function spl(vm) {}
function con(vm) {}
function job(vm) {}
