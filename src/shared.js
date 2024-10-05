import CFG from './cfg.js'

export const VM_OFFS_MASK         = 0xFFFFFFFF00000000n
export const VM_OFFS_SHIFT        = 32n
export const VM_ENERGY_MASK       = 0x00000000FFFFFFFFn
export const MOV_BREAK_MASK       = 0b10000000000000000000000000000000
export const MOV_BREAK_UNMASK     = 0b01111111111111111111111111111111

export const NO_DIR               = -1
export const ATOM_NOP             = 0
export const ATOM_MOV             = 1
export const ATOM_FIX             = 2
export const ATOM_SPL             = 3
export const ATOM_CON             = 4
export const ATOM_JOB             = 5
export const ATOM_REP             = 6

export const ATOM_TYPE_MASK       = 0b1110000000000000
export const ATOM_TYPE_UNMASK     = 0b0001111111111111
export const ATOM_TYPE_SHIFT      = 13
export const ATOM_VM_DIR_MASK     = 0b0001111000000000
export const ATOM_VM_DIR_MASK1    = 0b1110000111111111
export const ATOM_VM_DIR_SHIFT    = 9
export const ATOM_BOND1_MASK      = 0b0000000111000000
export const ATOM_BOND1_MASK1     = 0b1111111000111111
export const ATOM_BOND1_SHIFT     = 6
export const ATOM_BOND2_MASK      = 0b0000000000111000
export const ATOM_BOND2_MASK1     = 0b1111111111000111
export const ATOM_BOND2_SHIFT     = 3
export const ATOM_BOND3_MASK      = 0b0000000000001111
export const ATOM_BOND3_MASK1     = 0b1111111111110000
export const ATOM_IF_BOND_MASK    = 0b0001110000000000
export const ATOM_IF_BOND_MASK1   = 0b1110001111111111
export const ATOM_IF_BOND_SHIFT   = 10
export const ATOM_THEN_BOND_MASK  = 0b0000001110000000
export const ATOM_THEN_BOND_MASK1 = 0b1111110001111111
export const ATOM_THEN_BOND_SHIFT = 7
export const ATOM_ELSE_BOND_MASK  = 0b0000000001110000
export const ATOM_ELSE_BOND_MASK1 = 0b1111111110001111
export const ATOM_ELSE_BOND_SHIFT = 4

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
 * Wrapper for Uint32Array type with an ability to create, resize, add,
 * remove elements. The difference between this version and original is 
 * in using index (i) as a length property. So if user needs to resize 
 * an array to lesser size we don't do resize() we only change i prop
 */
Uint32Array.new = function create(size) {
  const a = new Uint32Array(size)
  a.i = size > 0 ? 0 : -1
  return a
}
Uint32Array.prototype.resize = function resize(size) {
  const idx = this.length
  const a = new Uint32Array(this.buffer.transfer(size * Uint32Array.BYTES_PER_ELEMENT))
  a.i = idx
  return a
}
Uint32Array.prototype.double = function double() {
  return this.resize(this.length * 2)
}
Uint32Array.prototype.end = function end() {
  return this.i >= this.length
}
Uint32Array.prototype.has = function has(val) {
  for (let i = 0; i <= this.i; i++) {
    if (this[i] === val) return true
  }
  return false
}
Uint32Array.prototype.index = function index(val) {
  for (let i = 0; i <= this.i; i++) {
    if (this[i] === val) return i
  }
  return -1
}
Uint32Array.prototype.add = function add(val) {
  this[this.i++] = val
}
Uint32Array.prototype.del = function del(i) {
  this[i] = this[--this.i]
}
/**
 * Wrapper for BigUint64Array type with an ability to create, resize, add,
 * remove elements. The difference between this version and original is 
 * in using index (i) as a length property. So if user needs to resize 
 * an array to lesser size we don't do resize() we only change i prop
 */
BigUint64Array.new = function create(size) {
  const a = new BigUint64Array(size)
  a.i = size > 0 ? 0 : -1
  return a
}
BigUint64Array.prototype.resize = function resize(size) {
  const idx = this.length
  const a = new BigUint64Array(this.buffer.transfer(size * BigUint64Array.BYTES_PER_ELEMENT))
  a.i = idx
  return a
}
BigUint64Array.prototype.double = function double() {
  return this.resize(this.length * 2)
}
BigUint64Array.prototype.end = function end() {
  return this.i >= this.length
}
BigUint64Array.prototype.has = function has(val) {
  for (let i = 0; i <= this.i; i++) {
    if (this[i] === val) return true
  }
  return false
}
BigUint64Array.prototype.index = function index(val) {
  for (let i = 0; i <= this.i; i++) {
    if (this[i] === val) return i
  }
  return -1
}
BigUint64Array.prototype.add = function add(val) {
  this[this.i++] = val
}
BigUint64Array.prototype.del = function del(i) {
  this[i] = this[this.i--]
}