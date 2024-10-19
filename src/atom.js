/**
 * Module of the atom. Describes all atom related stuff. Uses config & shared modules.
 */
import { ATOM_TYPE_MASK, ATOM_TYPE_SHIFT, ATOM_VM_DIR_SHIFT, ATOM_VM_DIR_MASK,
  ATOM_VM_DIR_MASK1, ATOM_BOND1_MASK, ATOM_BOND1_MASK1, ATOM_BOND1_SHIFT, ATOM_BOND2_MASK,
  ATOM_BOND2_MASK1, ATOM_BOND2_SHIFT, ATOM_BOND3_MASK, ATOM_BOND3_MASK1, ATOM_IF_BOND_MASK,
  ATOM_IF_BOND_MASK1, ATOM_IF_BOND_SHIFT, ATOM_THEN_BOND_MASK, ATOM_THEN_BOND_MASK1,
  ATOM_THEN_BOND_SHIFT, ATOM_ELSE_BOND_MASK, ATOM_ELSE_BOND_MASK1, ATOM_ELSE_BOND_SHIFT
} from './shared.js'
/**
 * Returns a 3bit atom type. Atom is a two bytes number, where 0 - is no atom
 * @param {Number} a 2 bytes of Atom value
 * @returns 0 - no atom, 1 - mov, ...
 */
export function type(a) { return (a & ATOM_TYPE_MASK) >> ATOM_TYPE_SHIFT }
/**
 * Returns 3bit bond 1 value. For different atoms it means different. For example
 * b1Dir() for mov atom returns move direction (0..7); For the fix/spl it'd bond 1;
 * For job it's new VM direction; For rep it's atom 1 direction.
 * @param {Number} a 2 bytes of atom value
 * @returns 3bits direction (0..7)
 */
export function b1Dir(a) { return (a & ATOM_BOND1_MASK) >> ATOM_BOND1_SHIFT }
/**
 * Sets new 3bits direction for the bond 1 and returns changed atom
 * @param {Number} a 2bytes Atom value
 * @param {Number} d 3bits new direction
 * @returns Updated 2bytes atom
 */
export function setB1Dir(a, d) { return (a & ATOM_BOND1_MASK1) | (d << ATOM_BOND1_SHIFT) }
/**
 * Returns bond 2 3bits direction (0..7). For different atoms it means different.
 * For example: fix/spl - it's a second bond; rep - atom 2 direction
 * @param {Number} a 2bytes Atom value
 * @returns 3bits direction (0..7)
 */
export function b2Dir(a) { return (a & ATOM_BOND2_MASK) >> ATOM_BOND2_SHIFT }
export function setB2Dir(a, d) { return (a & ATOM_BOND2_MASK1) | (d << ATOM_BOND2_SHIFT) }
export function b3Dir(a) { return (a & ATOM_BOND3_MASK) - 1 }
export function setB3Dir(a, d) { return (a & ATOM_BOND3_MASK1) | (d + 1) }
export function ifDir(a) { return (a & ATOM_IF_BOND_MASK) >> ATOM_IF_BOND_SHIFT }
export function setIfDir(a, d) { return (a & ATOM_IF_BOND_MASK1) | (d << ATOM_IF_BOND_SHIFT) }
export function thenDir(a) { return (a & ATOM_THEN_BOND_MASK) >> ATOM_THEN_BOND_SHIFT }
export function setThenDir(a, d) { return (a & ATOM_THEN_BOND_MASK1) | (d << ATOM_THEN_BOND_SHIFT) }
export function elseDir(a) { return (a & ATOM_ELSE_BOND_MASK) >> ATOM_ELSE_BOND_SHIFT }
export function setElseDir(a, d) { return (a & ATOM_ELSE_BOND_MASK1) | (d << ATOM_ELSE_BOND_SHIFT) }
export function vmDir(a) { return ((a & ATOM_VM_DIR_MASK) >> ATOM_VM_DIR_SHIFT) - 1 }
export function setVmDir(a, d) { return (a & ATOM_VM_DIR_MASK1) | ((d + 1) << ATOM_VM_DIR_SHIFT) }