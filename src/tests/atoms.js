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
export function job(vmDir, newVmDir, b2Dir) {
  return parseInt(`101${dir4(vmDir)}${dir(newVmDir)}000000`, 2)
}
export function rep(vmDir, a1Dir, a2Dir) {
  return parseInt(`110${dir4(vmDir)}${dir(a1Dir)}${dir(a2Dir)}000`, 2)
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