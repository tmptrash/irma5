declare module 'irma5/src/atom' {
  /**
   * Returns a 3bit atom type. Atom is a two bytes number, where 0 - is no atom
   * @param {Number} a 2 bytes of Atom value
   * @returns 0 - no atom, 1 - mov, ...
   */
  export function type(a: number): number;
  /**
   * Returns 3bit bond 1 value. For different atoms it means different. For example
   * b1Dir() for mov atom returns move direction (0..7); For the fix/spl it'd bond 1;
   * For job it's new VM direction; For rep it's atom 1 direction.
   * @param {Number} a 2 bytes of atom value
   * @returns Direction (0..7)
   */
  export function b1Dir(a: number): number;
  /**
   * Sets new 3bits direction for the bond 1 and returns changed atom
   * @param {Number} a 2bytes Atom value
   * @param {Number} d 3bits new direction
   * @returns Updated 2bytes atom
   */
  export function setB1Dir(a: number, d: number): number;
  export function b2Dir(a: number): number;
  export function setB2Dir(a: number, d: number): number;
  export function b3Dir(a: number): number;
  export function setB3Dir(a: number, d: number): number;
  export function ifDir(a: number): number;
  export function setIfDir(a: number, d: number): number;
  export function thenDir(a: number): number;
  export function setThenDir(a: number, d: number): number;
  export function elseDir(a: number): number;
  export function setElseDir(a: number, d: number): number;
  export function vmDir(a: number): number;
  export function setVmDir(a: number, d: number): number;
}
