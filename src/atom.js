import CFG from './cfg.js'
import { ATOM_TYPE_MASK, ATOM_TYPE_SHIFT, ATOM_VM_DIR_SHIFT, ATOM_VM_DIR_MASK,
  ATOM_VM_DIR_MASK1, ATOM_BOND1_MASK, ATOM_BOND1_SHIFT, ATOM_BOND2_MASK,
  ATOM_BOND2_SHIFT, ATOM_BOND3_MASK, ATOM_IF_BOND_MASK, ATOM_IF_BOND_SHIFT,
  ATOM_THEN_BOND_MASK, ATOM_THEN_BOND_MASK1, ATOM_THEN_BOND_SHIFT,
  ATOM_ELSE_BOND_MASK, ATOM_ELSE_BOND_MASK1, ATOM_ELSE_BOND_SHIFT, VM_OFFS_MASK,
  VM_OFFS_SHIFT, DIR_2_OFFS } from './shared.js'

const W = CFG.WORLD

export function type(a) { return (a & ATOM_TYPE_MASK) >> ATOM_TYPE_SHIFT }
export function b1Dir(a) { return (a & ATOM_BOND1_MASK) >> ATOM_BOND1_SHIFT }
export function b2Dir(a) { return (a & ATOM_BOND2_MASK) >> ATOM_BOND2_SHIFT }
export function b3Dir(a) { return a & ATOM_BOND3_MASK }
export function ifDir(a) { return (a & ATOM_IF_BOND_MASK) >> ATOM_IF_BOND_SHIFT }
export function thenDir(a) { return (a & ATOM_THEN_BOND_MASK) >> ATOM_THEN_BOND_SHIFT }
export function setThenDir(a, d) { return (a & ATOM_THEN_BOND_MASK1) | (d << ATOM_THEN_BOND_SHIFT) }
export function elseDir(a) { return (a & ATOM_ELSE_BOND_MASK) >> ATOM_ELSE_BOND_SHIFT }
export function setElseDir(a, d) { return (a & ATOM_ELSE_BOND_MASK1) (d >> ATOM_ELSE_BOND_SHIFT) }
export function vmDir(a) { return ((a & ATOM_VM_DIR_MASK) >> ATOM_VM_DIR_SHIFT) - 1 }
export function setVmDir(a, d) { return (a & ATOM_VM_DIR_MASK1) | ((d + 1) << ATOM_VM_DIR_SHIFT) }
/**
 * Returns 32bit offset for direction. The world is cyclical
 */
export function offs(offs, dir) {
  let o = offs + DIR_2_OFFS(dir)
  if (o < 0) o += W.width * W.height
  else if (o > W.width * W.height - 1) o -= W.width * W.height
  return o
}
/**
 * Returns 32bit offset obtained from vmsOffs 64 bit array
 * @param offs 64bit Offset
 * @returns 32bit offset
 */
export function toOffs(offs) {
  return Number((offs & VM_OFFS_MASK) >> VM_OFFS_SHIFT)
}