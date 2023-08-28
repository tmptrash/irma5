export const VM_OFFS_MASK      = 0x00000000FFFFFFFF
export const VM_OFFS_SHIFT     = 32

export const NO_DIR            = 0
export const ATOM_NOP          = 0
export const ATOM_MOV          = 1
export const ATOM_FIX          = 2
export const ATOM_SPL          = 3
export const ATOM_CON          = 4
export const ATOM_JOB          = 5

export const ATOM_TYPE_MASK    = 0b11100000000000000000000000000000
export const ATOM_NEXT_MASK    = 0b00011110000000000000000000000000
export const ATOM_TYPE_SHIFT   = 29
export const ATOM_VM_DIR_MASK  = 0b00011110000000000000000000000000
export const ATOM_VM_DIR_MASK1 = 0b11100001111111111111111111111111
export const ATOM_VM_DIR_SHIFT = 25
export const ATOM_BOND1_MASK   = 0b00000001110000000000000000000000
export const ATOM_BOND1_SHIFT  = 22
export const ATOM_BOND2_MASK   = 0b00000000001110000000000000000000
export const ATOM_BOND2_SHIFT  = 19