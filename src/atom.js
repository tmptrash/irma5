import { ATOM_TYPE_MASK, ATOM_TYPE_SHIFT, ATOM_VM_DIR_SHIFT, ATOM_VM_DIR_MASK,
  ATOM_VM_DIR_MASK1, ATOM_BOND1_MASK, ATOM_BOND1_SHIFT, ATOM_BOND2_MASK,
  ATOM_BOND2_SHIFT, ATOM_BOND3_MASK, ATOM_BOND3_SHIFT, ATOM_IF_BOND_MASK,
  ATOM_IF_BOND_SHIFT, ATOM_THEN_BOND_MASK, ATOM_THEN_BOND_SHIFT, ATOM_ELSE_BOND_MASK,
  ATOM_ELSE_BOND_SHIFT } from './shared'

export function type(a) { return (a && ATOM_TYPE_MASK) >> ATOM_TYPE_SHIFT }
export function b1Dir(a) { return (a & ATOM_BOND1_MASK) >> ATOM_BOND1_SHIFT }
export function b2Dir(a) { return (a & ATOM_BOND2_MASK) >> ATOM_BOND2_SHIFT }
export function b3Dir(a) { return (a & ATOM_BOND3_MASK) >> ATOM_BOND3_SHIFT }
export function ifDir(a) { return (a & ATOM_IF_BOND_MASK) >> ATOM_IF_BOND_SHIFT }
export function thenDir(a) { return (a & ATOM_THEN_BOND_MASK) >> ATOM_THEN_BOND_SHIFT }
export function elseDir(a) { return (a & ATOM_ELSE_BOND_MASK) >> ATOM_ELSE_BOND_SHIFT }
export function vmDir(a) { return ((a & ATOM_VM_DIR_MASK) >> ATOM_VM_DIR_SHIFT) - 1 }
export function setVmDir(a, d) { return (a & ATOM_VM_DIR_MASK1) | ((d + 1) << ATOM_VM_DIR_SHIFT) }