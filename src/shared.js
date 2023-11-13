import CFG from './cfg'

export const VM_OFFS_MASK         = 0xFFFFFFFF00000000n
export const VM_OFFS_SHIFT        = 32n
export const VM_VMS_MASK          = 0x00000000FFFFFFFF
export const MOV_BREAK_MASK       = 8000000000000000n

export const NO_DIR               = -1
export const ATOM_NOP             = 0
export const ATOM_MOV             = 1
export const ATOM_FIX             = 2
export const ATOM_SPL             = 3
export const ATOM_CON             = 4
export const ATOM_JOB             = 5
export const ATOM_REP             = 6

export const ATOM_TYPE_MASK       = 0b11100000000000000000000000000000
export const ATOM_TYPE_UNMASK     = 0b00011111111111111111111111111111
export const ATOM_TYPE_SHIFT      = 29
export const ATOM_VM_DIR_MASK     = 0b00011110000000000000000000000000
export const ATOM_VM_DIR_MASK1    = 0b11100001111111111111111111111111
export const ATOM_VM_DIR_SHIFT    = 25
export const ATOM_BOND1_MASK      = 0b00000001110000000000000000000000
export const ATOM_BOND1_SHIFT     = 22
export const ATOM_BOND2_MASK      = 0b00000000001110000000000000000000
export const ATOM_BOND2_SHIFT     = 19
export const ATOM_BOND3_MASK      = 0b00000000000011110000000000000000
export const ATOM_BOND3_SHIFT     = 16
export const ATOM_IF_BOND_MASK    = 0b00011100000000000000000000000000
export const ATOM_IF_BOND_SHIFT   = 26
export const ATOM_THEN_BOND_MASK  = 0b00000011100000000000000000000000
export const ATOM_THEN_BOND_MASK1 = 0b11111100011111111111111111111111
export const ATOM_THEN_BOND_SHIFT = 23
export const ATOM_ELSE_BOND_MASK  = 0b00000000011100000000000000000000
export const ATOM_ELSE_BOND_MASK1 = 0b11111111100011111111111111111111
export const ATOM_ELSE_BOND_SHIFT = 20

export const DIR_2_OFFS = [
  -CFG.WORLD.width, -CFG.WORLD.width + 1, 1, CFG.WORLD.width + 1,
  CFG.WORLD.width, CFG.WORLD.width - 1, -1, -CFG.WORLD.width - 1
]
/**
 * Reverted directions
 */
export const DIR_REV = [4, 5, 6, 7, 0, 1, 2, 3]
/**
 * Dir Mov Atom - Directions map for the atom, which is moving.
 * Is used for updating it's bonds
 */
export const DMA = [
  [NO_DIR,      7,      0, NO_DIR, NO_DIR, NO_DIR,      2,      3],
  [     3, NO_DIR,      1, NO_DIR, NO_DIR, NO_DIR, NO_DIR, NO_DIR],
  [     4,      5, NO_DIR,      1,      2, NO_DIR, NO_DIR, NO_DIR],
  [NO_DIR, NO_DIR,      5, NO_DIR,      3, NO_DIR, NO_DIR, NO_DIR],
  [NO_DIR, NO_DIR,      6,      7, NO_DIR,      3,      4, NO_DIR],
  [NO_DIR, NO_DIR, NO_DIR, NO_DIR,      7, NO_DIR,      5, NO_DIR],
  [     6, NO_DIR, NO_DIR, NO_DIR,      0,      1, NO_DIR,      5],
  [     7, NO_DIR, NO_DIR, NO_DIR, NO_DIR, NO_DIR,      1, NO_DIR]
]
/**
 * Dir Mov Disconnected
 * Directions maps for checking possible near atoms which may have a
 * bond with current. We use this map in "mov" atom. You should use
 * mov atom direction as an index here
 */
export const DMD = [
  [NO_DIR, NO_DIR, NO_DIR, NO_DIR,      4,      5,      6, NO_DIR],
  [     0, NO_DIR, NO_DIR, NO_DIR,      4,      5,      6,      7],
  [     0, NO_DIR, NO_DIR, NO_DIR, NO_DIR, NO_DIR,      6,      7],
  [     0,      1,      2, NO_DIR, NO_DIR, NO_DIR,      6,      7],
  [     0,      1,      2, NO_DIR, NO_DIR, NO_DIR, NO_DIR, NO_DIR],
  [     0,      1,      2,      3,      4, NO_DIR, NO_DIR, NO_DIR],
  [NO_DIR, NO_DIR,      2,      3,      4, NO_DIR, NO_DIR, NO_DIR],
  [NO_DIR, NO_DIR,      2,      3,      4,      5,      6, NO_DIR]
]
/**
 * Dir Near Atom
 * Directions map for the atom, which is near the moved atom. Is 
 * used for updating it's (near) bonds
 */
export const DNA = [
  [NO_DIR, NO_DIR,      0, NO_DIR,      6, NO_DIR, NO_DIR, NO_DIR],
  [NO_DIR, NO_DIR,      1,      2, NO_DIR,      6,      7, NO_DIR],
  [NO_DIR, NO_DIR, NO_DIR, NO_DIR,      2, NO_DIR,      0, NO_DIR],
  [     1, NO_DIR, NO_DIR, NO_DIR,      3,      4, NO_DIR,      0],
  [     2, NO_DIR, NO_DIR, NO_DIR, NO_DIR, NO_DIR,      4, NO_DIR],
  [NO_DIR,      2,      3, NO_DIR, NO_DIR, NO_DIR,      5,      6],
  [     6, NO_DIR,      4, NO_DIR, NO_DIR, NO_DIR, NO_DIR, NO_DIR],
  [     7,      0, NO_DIR,      4,      5, NO_DIR, NO_DIR, NO_DIR]
]