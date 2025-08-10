import { vm, ticks, addVm, nrg } from '../vms'
import { get, put, toOffs } from '../world'
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
  expect(vmsTo.length > 0 && vmsTo.length === vms.offs.i || vmsTo.length <= 0 && vms.offs.i <= 0).toBe(true)
}

/**
 * Checks if vms.map and vms.offs are synchronized
 * @return vm instance
 */
export function checkVm(vms, offs, idx, energy) {
  const idxArr = vms.map[offs]
  if (idxArr === undefined) throw `There is no VM under offset ${offs}. vms.map: ${JSON.stringify(vms.map, null, 2)}.`
  const vmIdx = idxArr.index(idx)
  if (vmIdx === -1 || idx === -1) throw `Invalid indexes. vmIdx: ${idx}, found vmIdx: ${vmIdx}`
  const res = vms.offs[idx] === vm(offs, energy)
  if (!res) throw `VM with index ${idx} broken. Should be (offs:${offs}, nrg:${energy}), but is (offs:${toOffs(vms.offs[idx])}, nrg:${nrg(vms.offs[idx])})`
  return res
}