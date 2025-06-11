/**
 * Module of the atom. Describes all atom related stuff. Uses config & shared modules
 * as dependencies. Uses 2bytes atom as a data for almost all functions. We use shrortcuts
 * a - 2bytes atom, d - 3 or 4 bits direction. Has no additional checks of inner arguments.
 * It mean that a - should always be a number, same as direction.
 */
declare module 'irma5/src/atom' {
  /**
   * Returns a 3bit atom type. Atom is a two bytes number, where 0 - is no atom, 1 - mov,...
   * @param {Number} a 2 bytes of Atom value
   * @returns 0 - nopor no atom, 1 - mov, ...
   */
  export function type(a: number): number;
  /**
   * Returns 3bit bond 1 value. For different atoms it means different. For example
   * b1Dir() for "mov" atom returns move direction (0..7); For the "fix/spl" it's bond 1;
   * For "job" it's new VM direction; For "rep" it's atom 1 direction.
   * @param {Number} a 2 bytes of atom value
   * @returns 3bits direction (0..7)
   */
  export function b1Dir(a: number): number;
  /**
   * Sets new 3bits direction for the bond 1 and returns changed atom
   * @param {Number} a 2bytes Atom value
   * @param {Number} d 3bits new direction
   * @returns Updated 2bytes atom
   */
  export function setB1Dir(a: number, d: number): number;
  /**
   * Returns section index value for the mut atom. Bits: 10..11, values 0..3
   * @param {Number} a mut atom 
   * @returns {Number} Index from 0..3
   */
  export function secIdx(a: number): number;
  /**
   * Returns the offset of first bit, where mutation value should be inserted
   * @param {Number} typ Atom's type
   * @param {Number} secIdx Index of the atom section 0..3
   * @returns {Number} first bit offset or -1 if error
   */
  export function getBitIdx(typ: number, secIdx: number): number;
  /**
   * Returns bond 2 3bits direction (0..7). For different atoms it means different.
   * For example: "fix/spl" - it's a second bond; "rep" - atom 2 direction
   * @param {Number} a 2bytes Atom value
   * @returns 3bits direction (0..7)
   */
  export function b2Dir(a: number): number;
  /**
   * Sets 3bits bond 2 direction into the 2bytes atom and returns it back
   * @param {Number} a 2bytes atom value 
   * @param {Number} d 3bits direction
   * @returns Changed 2bytes atom
   */
  export function setB2Dir(a: number, d: number): number;
  /**
   * Returns 4bits bond 3 direction value. Only for "con" atom it means second atom "if"
   * direction in comparison mode. Stores these vbalues: 0 - no dir, 1 - up, ...
   * @param {Number} a 2bytes atom
   * @returns {Number} 4bits direction: -1 - no dir, 0 - up, 1 - up-right,...
   */
  export function b3Dir(a: number): number;
  /**
   * Returns 4bits value for current section index in a mut atom
   * @param {Number} a 2bytes atom
   * @returns {Number} 4bits value
   */
  export function secVal(a: number): number;
  /**
   * Sets 4bits bond 3 direction. It make sense only for "con" atom. It means
   * second atom "if" direction in comparison mode.
   * @param {Number} a 2bytes Atom
   * @param {Number} d 3bits new direction
   * @returns {Number} 2bytes changed atom
   */
  export function setB3Dir(a: number, d: number): number;
  /**
   * Returns "con" atom 3bits "if" direction. Has no sense for other atoms.
   * @param {Number} a 2bytes atom 
   * @returns {Number} 3bits Direction
   */
  export function ifDir(a: number): number;
  /**
   * Sets 3bits "if" direction for "con" atom. Has no sense for other atoms.
   * @param {Number} a 2bytes Atom
   * @param {Number} d 3bits "if" direction of "con" atom
   * @returns {Number} 2bytes updated atom
   */
  export function setIfDir(a: number, d: number): number;
  /**
   * Returns 3bits "then" direction for "con" atom. Has no sense for other atoms.
   * @param {Number} a 2bytes atom
   * @returns {Number} 3bits direction
   */
  export function thenDir(a: number): number;
  /**
   * Sets "con" atom 3bits "then" direction. Has no sense for other atoms.
   * @param {Number} a 2bytes Atom
   * @param {Number} d 3bits new direction
   * @returns {Number} updated 2bytes atom
   */
  export function setThenDir(a: number, d: number): number;
  /**
   * Returns "else" direction for the "con" atom. Has no sense for other atoms.
   * @param {Number} a 2bytes "con" atom 
   * @returns {Number} 3bits "else" direction
   */
  export function elseDir(a: number): number;
  /**
   * Sets "con" atom 3bits "else" direction. Has no sense for other atoms.
   * @param {Number} a Atom to change
   * @param {Number} d 3bits direction
   * @returns {Number} Updated atom
   */
  export function setElseDir(a: number, d: number): number;
  /**
   * Returns 4bits VM direction. Works for all atoms.
   * @param {Number} a 2bytes atom
   * @returns {Number} 4bits VM direction
   */
  export function vmDir(a: number): number;
  /**
   * Sets VM 4bits direction for all atoms.
   * @param {Number} a 2bytes atom
   * @param {Number} d 4bits direction
   * @returns {Number} 2bytes atom
   */
  export function setVmDir(a: number, d: number): number;
}
