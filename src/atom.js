/**
 * Module of the atom. Describes all atom related stuff. Uses config & shared modules.
 */
import { ATOM_TYPE_MASK, ATOM_TYPE_SHIFT, ATOM_VM_DIR_SHIFT, ATOM_VM_DIR_MASK,
  ATOM_VM_DIR_MASK1, ATOM_BOND1_MASK, ATOM_BOND1_MASK1, ATOM_BOND1_SHIFT, ATOM_BOND2_MASK,
  ATOM_BOND2_MASK1, ATOM_BOND2_SHIFT, ATOM_BOND3_MASK, ATOM_BOND3_MASK1, ATOM_IF_BOND_MASK,
  ATOM_IF_BOND_MASK1, ATOM_IF_BOND_SHIFT, ATOM_THEN_BOND_MASK, ATOM_THEN_BOND_MASK1,
  ATOM_THEN_BOND_SHIFT, ATOM_ELSE_BOND_MASK, ATOM_ELSE_BOND_MASK1, ATOM_ELSE_BOND_SHIFT,
  DIR_MASK_3BITS } from './shared.js'
/**
 * Returns a 3bit atom type. Atom is a two bytes number, where 0 - is no atom
 * @param {Number} a 2 bytes of Atom value
 * @returns 0 - no atom, 1 - mov, ...
 */
export function type(a) {
  return (a & ATOM_TYPE_MASK) >> ATOM_TYPE_SHIFT
}
/**
 * Returns 3bit bond 1 value. For different atoms it means different. For example
 * b1Dir() for "mov" atom returns move direction (0..7); For the "fix/spl" it's bond 1;
 * For "job" it's new VM direction; For "rep" it's atom 1 direction.
 * @param {Number} a 2 bytes of atom value
 * @returns 3bits direction (0..7)
 */
export function b1Dir(a) {
  return (a & ATOM_BOND1_MASK) >> ATOM_BOND1_SHIFT
}
/**
 * Sets new 3bits direction for the bond 1 and returns changed atom
 * @param {Number} a 2bytes Atom value
 * @param {Number} d 3bits new direction
 * @returns Updated 2bytes atom
 */
export function setB1Dir(a, d) {
  return (a & ATOM_BOND1_MASK1) | ((d & DIR_MASK_3BITS) << ATOM_BOND1_SHIFT)
}
/**
 * Returns bond 2 3bits direction (0..7). For different atoms it means different.
 * For example: "fix/spl" - it's a second bond; "rep" - atom 2 direction
 * @param {Number} a 2bytes Atom value
 * @returns 3bits direction (0..7)
 */
export function b2Dir(a) {
  return (a & ATOM_BOND2_MASK) >> ATOM_BOND2_SHIFT
}
/**
 * Sets 3bits bond 2 direction into the 2bytes atom and returns it back
 * @param {Number} a 2bytes atom value 
 * @param {Number} d 3bits direction
 * @returns Changed 2bytes atom
 */
export function setB2Dir(a, d) {
  return (a & ATOM_BOND2_MASK1) | ((d & DIR_MASK_3BITS) << ATOM_BOND2_SHIFT)
}
/**
 * Returns 4bits bond 3 direction value. Only for "con" atom it means second atom "if"
 * direction in comparison mode. Stores these vbalues: 0 - no dir, 1 - up, ...
 * @param {Number} a 2bytes atom
 * @returns {Number} 4bits direction: -1 - no dir, 0 - up, 1 - up-right,...
 */
export function b3Dir(a) {
  return (a & ATOM_BOND3_MASK) - 1
}
/**
 * Sets 4bits bond 3 direction. It make sense only for "con" atom. It means
 * second atom "if" direction in comparison mode.
 * @param {Number} a 2bytes Atom
 * @param {Number} d 3bits new direction
 * @returns {Number} 2bytes changed atom
 */
export function setB3Dir(a, d) {
  return (a & ATOM_BOND3_MASK1) | ((d > 7 ? 7 : (d < -1 ? -1 : d)) + 1)
}
/**
 * Returns con atom 3bits "if" direction. 
 * @param {Number} a 2bytes atom 
 * @returns {Number} 3bits Direction
 */
export function ifDir(a) {
  return (a & ATOM_IF_BOND_MASK) >> ATOM_IF_BOND_SHIFT
}
/**
 * Sets 3bits "if" direction for con atom
 * @param {Number} a 2bytes Atom
 * @param {Number} d 3bits "if" direction of "con" atom
 * @returns {Number} 2bytes updated atom
 */
export function setIfDir(a, d) {
  return (a & ATOM_IF_BOND_MASK1) | ((d & DIR_MASK_3BITS) << ATOM_IF_BOND_SHIFT)
}
/**
 * Returns 3bits "then" direction for "con" atom
 * @param {Number} a 2bytes atom
 * @returns {Number} 3bits direction
 */
export function thenDir(a) {
  return (a & ATOM_THEN_BOND_MASK) >> ATOM_THEN_BOND_SHIFT
}
/**
 * Sets "con" atom 3bits "then" direction
 * @param {Number} a 2bytes Atom
 * @param {Number} d 3bits new direction
 * @returns {Number} updated 2bytes atom
 */
export function setThenDir(a, d) { return (a & ATOM_THEN_BOND_MASK1) | ((d & DIR_MASK_3BITS) << ATOM_THEN_BOND_SHIFT) }
/**
 * Returns "else" direction for the "con" atom
 * @param {Number} a 2bytes "con" atom 
 * @returns {Number} 3bits "else" direction
 */
export function elseDir(a) { return (a & ATOM_ELSE_BOND_MASK) >> ATOM_ELSE_BOND_SHIFT }
/**
 * Sets "con" atom 3bits "else" direction
 * @param {Number} a Atom to change
 * @param {Number} d 3bits direction
 * @returns {Number} Updated atom
 */
export function setElseDir(a, d) { return (a & ATOM_ELSE_BOND_MASK1) | ((d & DIR_MASK_3BITS) << ATOM_ELSE_BOND_SHIFT) }
export function vmDir(a) { return ((a & ATOM_VM_DIR_MASK) >> ATOM_VM_DIR_SHIFT) - 1 }
export function setVmDir(a, d) { return (a & ATOM_VM_DIR_MASK1) | (((d > 7 ? 7 : (d < -1 ? -1 : d)) + 1) << ATOM_VM_DIR_SHIFT) }