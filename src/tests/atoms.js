import { vm } from './../vms'

export function mov(vmDir, movDir) {
  return parseInt(`001${dir4(vmDir)}${dir(movDir)}000000`, 2)
}
export function fix(vmDir, b1Dir, b2Dir) {
  return parseInt(`010${dir4(vmDir)}${dir(b1Dir)}${dir(b2Dir)}000`, 2)
}
export function spl(vmDir, b1Dir, b2Dir) {
  return parseInt(`011${dir4(vmDir)}${dir(b1Dir)}${dir(b2Dir)}000`, 2)
}
export function con(ifDir, thenDir, elseDir, cmpDir) {
  return parseInt(`100${dir(ifDir)}${dir(thenDir)}${dir(elseDir)}${dir4(cmpDir)}`, 2)
}
export function job(vmDir, newVmDir) {
  return parseInt(`101${dir4(vmDir)}${dir(newVmDir)}000000`, 2)
}
export function rep(vmDir, a1Dir, a2Dir) {
  return parseInt(`110${dir4(vmDir)}${dir(a1Dir)}${dir(a2Dir)}000`, 2)
}

/**
 * Checks if vms.map and vms.offs are synchronized
 * @return vm instance
 */
export function checkVm(vms, offs, idx, energy) {
  const idxArr = vms.map[offs]
  if (idxArr === undefined) {console.error(`vms.map is broken: ${vms.map}. Offset ${offs} not found.`); return false}
  const vmIdx = idxArr.index(idx)
  if (vmIdx === -1 || idx === -1 || vmIdx !== idx) { console.error(`Invalid indexes. vmIdx: ${idx}, found vmIdx: ${vmIdx}`); return false }
  const res = vms.offs[idx] === vm(offs, energy)
  if (!res) console.error(`VM structure broken for vm with index ${idx}`)
  return res
}

function pad(n, l) {
  return n.toString(2).padStart(l, '0')
}
function dir(d) {
  return pad(d, 3)
}
function dir4(d) {
  return pad(d+1, 4)
}