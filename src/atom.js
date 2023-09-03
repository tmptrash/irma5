import { ATOM_TYPE_MASK, ATOM_TYPE_SHIFT, ATOM_VM_DIR_SHIFT, ATOM_VM_DIR_MASK, ATOM_VM_DIR_MASK1 } from './shared'

export function type(a) { return (a && ATOM_TYPE_MASK) >> ATOM_TYPE_SHIFT }
export function b1Dir(a) { return (a & ATOM_BOND1_MASK) >> ATOM_BOND1_SHIFT }
export function b2Dir(a) { return (a & ATOM_BOND2_MASK) >> ATOM_BOND2_SHIFT }
export function vmDir(a) { return (a & ATOM_VM_DIR_MASK) >> ATOM_VM_DIR_SHIFT }
export function setVmDir(a, d) { return (a & ATOM_VM_DIR_MASK1) | (d << ATOM_VM_DIR_SHIFT) }