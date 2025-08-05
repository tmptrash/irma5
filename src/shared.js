import CFG from './cfg.js'

let seed = CFG.ATOM.seed

export const VM_OFFS_MASK           = 0xFFFFFFFF00000000n
export const VM_OFFS_SHIFT          = 32n
export const VM_ENERGY_MASK         = 0x00000000FFFFFFFFn
export const MOV_BREAK_MASK         = 0b10000000000000000000000000000000
export const MOV_BREAK_UNMASK       = 0b01111111111111111111111111111111

export const NO_DIR                 = -1

export const MASK_4BITS             = 0b1111
export const MASK_3BITS             = 0b111
export const MASK_2BITS             = 0b11

export const ATOM_NOP               = 0
export const ATOM_MOV               = 1
export const ATOM_FIX               = 2
export const ATOM_SPL               = 3
export const ATOM_CON               = 4
export const ATOM_JOB               = 5
export const ATOM_REP               = 6
export const ATOM_MUT               = 7

export const ATOM_TYPE_MASK         = 0b1110000000000000
export const ATOM_TYPE_UNMASK       = 0b0001111111111111
export const ATOM_TYPE_SHIFT        = 13
export const ATOM_VM_DIR_MASK       = 0b0001111000000000
export const ATOM_VM_DIR_MASK1      = 0b1110000111111111
export const ATOM_VM_DIR_SHIFT      = 9
export const ATOM_BOND1_MASK        = 0b0000000111000000
export const ATOM_BOND1_MASK1       = 0b1111111000111111
export const ATOM_BOND1_SHIFT       = 6
export const ATOM_SECTION_MASK      = 0b0000000000110000
export const ATOM_SECTION_MASK1     = 0b1111111111001111
export const ATOM_SECTION_SHIFT     = 4
export const ATOM_BOND2_MASK        = 0b0000000000111000
export const ATOM_BOND2_MASK1       = 0b1111111111000111
export const ATOM_BOND2_SHIFT       = 3
export const ATOM_BOND3_MASK        = 0b0000000000001111
export const ATOM_BOND3_MASK1       = 0b1111111111110000
export const ATOM_SECTION_VAL_MASK  = 0b0000000000001111
export const ATOM_IF_BOND_MASK      = 0b0001110000000000
export const ATOM_IF_BOND_MASK1     = 0b1110001111111111
export const ATOM_IF_BOND_SHIFT     = 10
export const ATOM_THEN_BOND_MASK    = 0b0000001110000000
export const ATOM_THEN_BOND_MASK1   = 0b1111110001111111
export const ATOM_THEN_BOND_SHIFT   = 7
export const ATOM_ELSE_BOND_MASK    = 0b0000000001110000
export const ATOM_ELSE_BOND_MASK1   = 0b1111111110001111
export const ATOM_ELSE_BOND_SHIFT   = 4
export const ATOM_MOV_MOVING_MASK   = 0b0000000000100000
export const ATOM_MOV_DONE_MASK     = 0b0000000000010000
export const ATOM_MOV_UNMASK        = 0b1111111111001111
/**
 * Bits sections offsets of all supported atoms. For example atom spl has these sections:
 * section 0: 07..09 - bits of bond 1 dir
 * section 1: 10..12 - bits of bond 2 dir (from the perspective of atom 1)
 *
 * All sections start from bit 7. Before that bit we keep atom type and next atom dir. Only
 * con atom has it's ows structure and has 4 sections
 */
export const ATOMS_SECTIONS = [
  [],            // nop
  [3],           // mov
  [3, 3],        // fix
  [3, 3],        // spl
  [3, 3, 3, 4],  // con
  [3],           // job
  [3, 3],        // rep
  [3, 2, 4]      // mut
]

let d2o = null
export const DIR_2_OFFS = (dir) => !d2o ? (d2o = [
  -CFG.WORLD.width, -CFG.WORLD.width + 1, 1, CFG.WORLD.width + 1,
  CFG.WORLD.width, CFG.WORLD.width - 1, -1, -CFG.WORLD.width - 1
])[dir] : d2o[dir]
/**
 * Reverted directions. 0 (up) - 4 (down), 6 (left) - 2 (right),...
 */
export const DIR_REV = [4, 5, 6, 7, 0, 1, 2, 3]
/**
 * Dir Mov Atom - is used for updating moving atom bonds. Let's imagine
 * we have a mov atom and one more atom on the right side of it: m -> s
 * m atom has a vm bond with a direction 2. If mov atom moves to the top,
 * it should update it's bond to the s atom by setting it to direction 3.
 * To complete this we have to use DMA like this:
 * DMA[m bond dir before move][move direction] === DMA[2][0]. It will
 * return new mov atom bond direction - 3. NO_DIR means that moved atom
 * and near to which moved atom's bond points have distane > 1.
 */
export const DMA = [
  [NO_DIR,      6,      7, NO_DIR, NO_DIR, NO_DIR,      1,      2],
  [     2, NO_DIR,      0, NO_DIR, NO_DIR, NO_DIR, NO_DIR, NO_DIR],
  [     3,      4, NO_DIR,      0,      1, NO_DIR, NO_DIR, NO_DIR],
  [NO_DIR, NO_DIR,      4, NO_DIR,      2, NO_DIR, NO_DIR, NO_DIR],
  [NO_DIR, NO_DIR,      5,      6, NO_DIR,      2,      3, NO_DIR],
  [NO_DIR, NO_DIR, NO_DIR, NO_DIR,      6, NO_DIR,      4, NO_DIR],
  [     5, NO_DIR, NO_DIR, NO_DIR,      7,      0, NO_DIR,      4],
  [     6, NO_DIR, NO_DIR, NO_DIR, NO_DIR, NO_DIR,      0, NO_DIR]
]
/**
 * Dir Mov Disconnected - shows which near atoms will have distance
 * > 1 with moved atom. Let's imagine we have a mov atom and it moves
 * up (direction 0). If we get DMD[moving dir] === DMD[0] we see
 * that direction 3,4,5 will have distance > 1 and all other NO_DIR
 * directions will need to update it's bonds and have distance == 1.
 * So number means distance > 1, NO_DIR means distance == 1.
 */
export const DMD = [
  [NO_DIR, NO_DIR, NO_DIR,      3,      4,      5, NO_DIR, NO_DIR],
  [NO_DIR, NO_DIR, NO_DIR,      3,      4,      5,      6,      7],
  [NO_DIR, NO_DIR, NO_DIR, NO_DIR, NO_DIR,      5,      6,      7],
  [     0,      1, NO_DIR, NO_DIR, NO_DIR,      5,      6,      7],
  [     0,      1, NO_DIR, NO_DIR, NO_DIR, NO_DIR, NO_DIR,      7],
  [     0,      1,      2,      3, NO_DIR, NO_DIR, NO_DIR,      7],
  [NO_DIR,      1,      2,      3, NO_DIR, NO_DIR, NO_DIR, NO_DIR],
  [NO_DIR,      1,      2,      3,      4,      5, NO_DIR, NO_DIR]
]
/**
 * Dir Near Atom - shows new bond direction for near atom after atom
 * move. Let's imagine we have a mov atom and other one on the right:
 * m <- s. If m atom moves to the top, s atom should update it's bond
 * to 7. For this we have to use DNA[near atom dir to moved][move dir]
 * === DNA[6][0] === 7
 */
export const DNA = [
  [NO_DIR, NO_DIR,      1,      2, NO_DIR,      6,      7, NO_DIR],
  [NO_DIR, NO_DIR, NO_DIR, NO_DIR,      2, NO_DIR,      0, NO_DIR],
  [     1, NO_DIR, NO_DIR, NO_DIR,      3,      4, NO_DIR,      0],
  [     2, NO_DIR, NO_DIR, NO_DIR, NO_DIR, NO_DIR,      4, NO_DIR],
  [NO_DIR,      2,      3, NO_DIR, NO_DIR, NO_DIR,      5,      6],
  [     6, NO_DIR,      4, NO_DIR, NO_DIR, NO_DIR, NO_DIR, NO_DIR],
  [     7,      0, NO_DIR,      4,      5, NO_DIR, NO_DIR, NO_DIR],
  [NO_DIR, NO_DIR,      0, NO_DIR,      6, NO_DIR, NO_DIR, NO_DIR]
]
/**
 * All available directions
 */
export const U  = 0 // up
export const UR = 1 // up-right
export const R  = 2 // right
export const RD = 3 // right-down
export const D  = 4 // down
export const DL = 5 // ...
export const L  = 6
export const LU = 7
/**
 * Human readable directions
 */
export const DIRS = {
  [U]: 'U',
  [UR]: 'UR',
  [R]: 'R',
  [RD]: 'RD',
  [D]: 'D',
  [DL]: 'DL',
  [L]: 'L',
  [LU]: 'LU'
}
/**
 * It affects rnd() function. If you want to use your own seed
 * you can set it here. If you want to use default seed, just run rnd() function
 * and it will use CFG.ATOM.seed value.
 * @param {Number} rndSeed - New seed value
 */
export function setRndSeed(rndSeed) {
  seed = rndSeed
}
/**
 * Random numbers generator with seed
 * @returns {Function} rnd function
 */
export function rnd() {
  let t = seed += 0x6D2B79F5
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
/**
 * Wrapper for Uint32Array type with an ability to create, resize, add,
 * remove elements. The difference between this version and original is 
 * in using index (i) as a length property. So if user needs to resize 
 * an array to lesser size we don't do resize() we only change i prop
 */
export class UInt32Array extends Uint32Array {
  static create(size) {
    const a = new UInt32Array(size)
    a.i = size > 0 ? 0 : -1
    return a
  }

  resize(size) {
    const idx = this.length
    const a = new UInt32Array(this.buffer.transfer((size || 1) * UInt32Array.BYTES_PER_ELEMENT))
    a.i = size < idx ? size : idx
    return a
  }

  has(val) {
    for (let i = 0; i < this.i; i++) if (this[i] === val) return true
    return false
  }

  index(val) {
    for (let i = 0; i < this.i; i++) if (this[i] === val) return i
    return -1
  }

  double() { return this.resize(this.length * 2) }
  end() { return this.i >= this.length || this.i < 0 }
  add(val) { this[this.i++] = val }
  del(i) { this[i] = this[--this.i] }
}
/**
 * Wrapper for BigUint64Array type with an ability to create, resize, add,
 * remove elements. The difference between this version and original is 
 * in using index (i) as a length property. So if user needs to resize 
 * an array to lesser size we don't do resize() we only change i prop
 */
export class UInt64Array extends BigUint64Array {
  static create(size) {
    const a = new UInt64Array(size)
    a.i = size > 0 ? 0 : -1
    return a
  }

  resize(size) {
    const idx = this.length
    const a = new UInt64Array(this.buffer.transfer((size || 1) * UInt64Array.BYTES_PER_ELEMENT))
    a.i = size < idx ? size : idx
    return a
  }

  has(val) {
    for (let i = 0; i < this.i; i++) if (this[i] === val) return true
    return false
  }

  index(val) {
    for (let i = 0; i < this.i; i++) if (this[i] === val) return i
    return -1
  }

  double() { return this.resize(this.length * 2) }
  end() { return this.i >= this.length || this.i < 0 }
  add(val) { this[this.i++] = val }
  del(i) { this[i] = this[--this.i] }
}