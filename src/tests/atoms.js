import { vm, ticks, addVm } from './../vms'
import { get, put } from './../world'

export const U  = 0 // up
export const UR = 1 // up-right
export const R  = 2 // right
export const RD = 3 // ...
export const D  = 4
export const DL = 5
export const L  = 6
export const LU = 7

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
 * Tests atoms and VMs in a world. It works like this: we put all atoms from
 * "atomsFrom" array into the world, put all VMs from "vmsFrom" array into the
 * world as well. Runs all VMs one by one. Check if atoms "atomsTo" and VMs 
 * "vmsTo" are on the right places and with right amount of energy.
 * @param {Array} vms irma5 VM array
 * @param {World} w World instance
 * @param {Array} atomsFrom Atoms data to put before run: [[offs, atom],...]
 * @param {Array} vmsFrom VMs data to put before run: [[offs, energy],...]
 * @param {Array} atomsTo Atoms data to check after run: [[offs, atom],...]
 * @param {Array} vmsTo VMs data to check after run: [[offs, energy],...]
 */
export function testAtoms(vms, w, atomsFrom = [], vmsFrom = [], atomsTo = [], vmsTo = []) {
  atomsFrom.forEach(a => put(w, a[0], a[1]))
  vmsFrom.forEach(v => addVm(vms, v[0], v[1]))
  ticks(vms)
  atomsTo.forEach(a => expect(get(w, a[0])).toBe(a[1]))
  vmsTo.forEach((v, i) => expect(checkVm(vms, v[0], i, v[1])).toBe(true))
  expect(vmsTo.length).toBe(vms.offs.length)
}

/**
 * Checks if vms.map and vms.offs are synchronized
 * @return vm instance
 */
export function checkVm(vms, offs, idx, energy) {
  const idxArr = vms.map[offs]
  if (idxArr === undefined) throw `vms.map is broken: ${vms.map}. Offset ${offs} not found.`
  const vmIdx = idxArr.index(idx)
  if (vmIdx === -1 || idx === -1) throw `Invalid indexes. vmIdx: ${idx}, found vmIdx: ${vmIdx}`
  const res = vms.offs[idx] === vm(offs, energy)
  if (!res) throw `VM structure broken for vm with index ${idx}. VM should be ${vm(offs, energy)}, but is ${vms.offs[idx]}`
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