declare module 'Atom' {
  export function type(a: number): number;
  export function b1Dir(a: number): number;
  export function b2Dir(a: number): number;
  export function b3Dir(a: number): number;
  export function ifDir(a: number): number;
  export function thenDir(a: number): number;
  export function setThenDir(a: number, d: number): number;
  export function elseDir(a: number): number;
  export function setElseDir(a: number, d: number): number;
  export function vmDir(a: number): number;
  export function setVmDir(a: number, d: number): number;
  /**
   * Returns 32bit offset for direction. The world is cyclical
   */
  export function offs(offs: number, dir: number): number;
  /**
   * Returns 32bit offset obtained from vmsOffs 64 bit array
   * @param offs 64bit Offset
   * @returns 32bit offset
   */
  export function toOffs(offs: number): number;
}
