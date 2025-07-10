/**
 * Module of the atom. Describes all atom related stuff. Uses config & shared modules
 * as dependencies. Uses 2bytes atom as a data for almost all functions. We use shrortcuts
 * a - 2bytes atom, d - 3 or 4 bits direction. Has no additional checks of inner arguments.
 * It mean that a - should always be a number, same as direction.
 */
import CFG from './cfg'
import { ATOM_TYPE_MASK, ATOM_TYPE_SHIFT, ATOM_VM_DIR_SHIFT, ATOM_VM_DIR_MASK,
  ATOM_VM_DIR_MASK1, ATOM_BOND1_MASK, ATOM_BOND1_MASK1, ATOM_BOND1_SHIFT, ATOM_BOND2_MASK,
  ATOM_BOND2_MASK1, ATOM_BOND2_SHIFT, ATOM_BOND3_MASK, ATOM_BOND3_MASK1, ATOM_IF_BOND_MASK,
  ATOM_IF_BOND_MASK1, ATOM_IF_BOND_SHIFT, ATOM_THEN_BOND_MASK, ATOM_THEN_BOND_MASK1,
  ATOM_THEN_BOND_SHIFT, ATOM_ELSE_BOND_MASK, ATOM_ELSE_BOND_MASK1, ATOM_ELSE_BOND_SHIFT,
  MASK_4BITS, MASK_3BITS, MASK_2BITS, ATOM_SECTION_MASK, ATOM_SECTION_MASK1,
  ATOM_SECTION_SHIFT, ATOM_SECTION_VAL_MASK, ATOMS_SECTIONS, ATOM_CON, ATOM_MOV, ATOM_FIX, ATOM_SPL,
  ATOM_JOB, ATOM_REP, ATOM_MUT, rnd } from './shared.js'
/**
 * Returns a 3bit atom type. Atom is a two bytes number, where 0 - is no atom, 1 - mov,...
 * @param {Number} a 2 bytes of Atom value
 * @returns 0 - no atom, 1 - mov, ...
 */
export function type(a) {
  return (a & ATOM_TYPE_MASK) >> ATOM_TYPE_SHIFT
}
/**
 * Returns 4bits VM direction. Works for all atoms.
 * @param {Number} a 2bytes atom
 * @returns {Number} 4bits VM direction
 */
export function vmDir(a) {
  return ((a & ATOM_VM_DIR_MASK) >> ATOM_VM_DIR_SHIFT) - 1
}
/**
 * Sets VM 4bits direction for all atoms.
 * @param {Number} a 2bytes atom
 * @param {Number} d 4bits direction
 * @returns {Number} 2bytes atom
 */
export function setVmDir(a, d) {
  return (a & ATOM_VM_DIR_MASK1) | (((d > 7 ? 7 : (d < -1 ? -1 : d)) + 1) << ATOM_VM_DIR_SHIFT)
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
  return (a & ATOM_BOND1_MASK1) | ((d & MASK_3BITS) << ATOM_BOND1_SHIFT)
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
  return (a & ATOM_BOND2_MASK1) | ((d & MASK_3BITS) << ATOM_BOND2_SHIFT)
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
 * Returns "con" atom 3bits "if" direction. Has no sense for other atoms.
 * @param {Number} a 2bytes atom 
 * @returns {Number} 3bits Direction
 */
export function ifDir(a) {
  return (a & ATOM_IF_BOND_MASK) >> ATOM_IF_BOND_SHIFT
}
/**
 * Sets 3bits "if" direction for "con" atom. Has no sense for other atoms.
 * @param {Number} a 2bytes Atom
 * @param {Number} d 3bits "if" direction of "con" atom
 * @returns {Number} 2bytes updated atom
 */
export function setIfDir(a, d) {
  return (a & ATOM_IF_BOND_MASK1) | ((d & MASK_3BITS) << ATOM_IF_BOND_SHIFT)
}
/**
 * Returns 3bits "then" direction for "con" atom. Has no sense for other atoms.
 * @param {Number} a 2bytes atom
 * @returns {Number} 3bits direction
 */
export function thenDir(a) {
  return (a & ATOM_THEN_BOND_MASK) >> ATOM_THEN_BOND_SHIFT
}
/**
 * Sets "con" atom 3bits "then" direction. Has no sense for other atoms.
 * @param {Number} a 2bytes Atom
 * @param {Number} d 3bits new direction
 * @returns {Number} updated 2bytes atom
 */
export function setThenDir(a, d) {
  return (a & ATOM_THEN_BOND_MASK1) | ((d & MASK_3BITS) << ATOM_THEN_BOND_SHIFT)
}
/**
 * Returns "else" direction for the "con" atom. Has no sense for other atoms.
 * @param {Number} a 2bytes "con" atom 
 * @returns {Number} 3bits "else" direction
 */
export function elseDir(a) {
  return (a & ATOM_ELSE_BOND_MASK) >> ATOM_ELSE_BOND_SHIFT
}
/**
 * Sets "con" atom 3bits "else" direction. Has no sense for other atoms.
 * @param {Number} a Atom to change
 * @param {Number} d 3bits direction
 * @returns {Number} Updated atom
 */
export function setElseDir(a, d) {
  return (a & ATOM_ELSE_BOND_MASK1) | ((d & MASK_3BITS) << ATOM_ELSE_BOND_SHIFT)
}
/**
 * Returns section index value for the mut atom. Bits: 10..11, values 0..3
 * @param {Number} a mut atom 
 * @returns {Number} Index from 0..3
 */
export function secIdx(a) {
  return (a & ATOM_SECTION_MASK) >> ATOM_SECTION_SHIFT
}
/**
 * Sets section index to specified value
 * @param {Number} a mut atom we are changing
 * @param {Number} secIdx 2bits new section index
 * @returns {Number} Updated 2bytes atom
 */
export function setSecIdx(a, secIdx) {
  return (a & ATOM_SECTION_MASK1) | ((secIdx & MASK_2BITS) << ATOM_SECTION_SHIFT)
}
/**
 * Returns the offset of first bit, where mutation value should be inserted.
 * Pay attention on a start bit index. 7 for all atoms except of "con" - 3. 7
 * is used because we should not change atom's type & VM dirrection
 * @param {Number} typ Mutation atom's type
 * @param {Number} secIdx Index of the atom section 0..3
 * @returns {Number} first bit offset or -1 if error
 */
export function getBitIdx(typ, secIdx) {
  if (!typ) return -1
  const indexes = ATOMS_SECTIONS[typ]
  if (secIdx >= indexes.length || secIdx < 0) return -1
  const startIdx = typ === ATOM_CON ? 3 : 7       // start index for "con" or other atom types
  let idx = 0
  for (let i = 0; i < secIdx; i++) idx += indexes[i]
  return startIdx + idx
}
/**
 * Returns 4bits value for current section index in a mut atom
 * @param {Number} a 2bytes atom
 * @returns {Number} 4bits value
 */
export function secVal(a) {
  return a & ATOM_SECTION_VAL_MASK
}
/**
 * Sets value into the "value" section of the mut atom
 * @param {Number} a mut atom
 * @param {Number} val 4bits value
 * @returns {Number} Updated 2bytes atom
 */
export function setSecVal(a, val) {
  return setBits(a, val & MASK_4BITS, 12, 4)
}
/**
 * Inserts "val" into the atom "a" at the position "bitIdx"
 * @param {*} a Atom we are inserting to
 * @param {*} val Value to insert
 * @param {*} bitIdx Index of the first bit in the 2 bytes atom 
 * @param {*} len Length of "val" value
 * @returns {Number} Udated atom
 */
export function setBits(a, val, bitIdx, len) {
  const lshift = 16 - bitIdx - len
  const mask = ((1 << len) - 1) << (lshift)
  const cleared = a & ((~mask) & 0xFFFF)
  const inserted = (val << lshift) & mask
  return cleared | inserted
}
//
// Atom generator functions
//
export function mov(vmDir, movDir) { return parseInt(`001${dir4(vmDir)}${dir(movDir)}000000`, 2) }
export function fix(vmDir, b1Dir, b2Dir) { return parseInt(`010${dir4(vmDir)}${dir(b1Dir)}${dir(b2Dir)}000`, 2) }
export function spl(vmDir, b1Dir, b2Dir) { return parseInt(`011${dir4(vmDir)}${dir(b1Dir)}${dir(b2Dir)}000`, 2) }
export function con(ifDir, thenDir, elseDir, cmpDir) { return parseInt(`100${dir(ifDir)}${dir(thenDir)}${dir(elseDir)}${dir4(cmpDir)}`, 2) }
export function job(vmDir, newVmDir) { return parseInt(`101${dir4(vmDir)}${dir(newVmDir)}000000`, 2) }
export function rep(vmDir, a1Dir, a2Dir) { return parseInt(`110${dir4(vmDir)}${dir(a1Dir)}${dir(a2Dir)}000`, 2) }
export function mut(vmDir, mutDir, secIdx, val) { return parseInt(`111${dir4(vmDir)}${dir(mutDir)}${sec(secIdx)}${pad(val, 4)}`, 2) }
/**
 * Returns random type of the atom according to CFG.ATOM.PROB array
 */
export function rndType() {
  const r = rnd()
  const prob = CFG.ATOM.PROB
  if (Math.round(prob.reduce((p, c) => p + c, 0)) !== 1) throw new Error(`CFG.ATOM.PROB must === 1. Current value: ${JSON.stringify(prob)}`)
  let s = 0
  for (let i = 0; i < 8; i++) {
    if (r >= s && r < s + prob[i]) return i
    s += prob[i]
  }
  return 0                                        // wrong probability array, returns no atom
}
/**
 * Generates random atoms. With random VM direction, random bonds and so on...
 */
export function rndMov() { return mov(rndDir(), rndDir()) }
export function rndFix() { return fix(rndDir(), rndDir(), rndDir()) }
export function rndSpl() { return spl(rndDir(), rndDir(), rndDir()) }
export function rndCon() { return con(rndDir(), rndDir(), rndDir(), rndDir()) }
export function rndJob() { return job(rndDir(), rndDir()) }
export function rndRep() { return rep(rndDir(), rndDir(), rndDir()) }
export function rndMut() { return mut(rndDir(), rndDir(), rndSecIdx(), rndSecVal()) }
/**
 * Helper for debugging. Parses 2bytes atom and returns human-readable string of it
 * @param {Number} a 2bytes atom number
 * @returns {String} Human readable atom representation
 */
export function parseAtom(a) {
  switch (type(a)) {
    case ATOM_MOV: return `mov(vmDir=${vmDir(a)}, movDir=${b1Dir(a)})`
    case ATOM_FIX: return `fix(vmDir=${vmDir(a)}, b1Dir=${b1Dir(a)}, b2Dir=${b2Dir(a)})`
    case ATOM_SPL: return `spl(vmDir=${vmDir(a)}, b1Dir=${b1Dir(a)}, b2Dir=${b2Dir(a)})`
    case ATOM_CON: return `con(ifDir=${ifDir(a)}, thenDir=${thenDir(a)}, elseDir=${elseDir(a)}, if2Dir=${b3Dir(a)})`
    case ATOM_JOB: return `job(vmDir=${vmDir(a)}, newVmDir=${b1Dir(a)})`
    case ATOM_REP: return `rep(vmDir=${vmDir(a)}, a1Dir=${b1Dir(a)}, a2Dir=${b2Dir(a)})`
    case ATOM_MUT: return `mut(vmDir=${vmDir(a)}, mutDir=${b1Dir(a)}, secIdx=${secIdx(a)}, val=${secVal(a)})`
  }
  return `Unknown atom '${a}' with type '${type(a)}'`
}
//
// Module's private functions
//
function pad(n, l) { return n.toString(2).padStart(l, '0') }
function dir(d) { return pad(d, 3) }
function dir4(d) { return pad(d + 1, 4) }
function sec(sec) { return pad(sec, 2) }
//
// Random direction functions
//
function rndDir() { return Math.floor(rnd() * 8) }
function rndSecIdx() { return Math.floor(rnd() * 4) }
function rndSecVal() { return Math.floor(rnd() * 16) }
