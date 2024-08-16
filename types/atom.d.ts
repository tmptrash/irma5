declare function type(a: number): number;
declare function b1Dir(a: number): number;
declare function b2Dir(a: number): number;
declare function b3Dir(a: number): number;
declare function ifDir(a: number): number;
declare function thenDir(a: number): number;
declare function setThenDir(a: number, d: number): number;
declare function elseDir(a: number): number;
declare function setElseDir(a: number, d: number): number;
declare function vmDir(a: number): number;
declare function setVmDir(a: number, d: number): number;
/**
 * Returns 32bit offset for direction. The world is cyclical
 */
declare function offs(offs: number, dir: number): number;
/**
 * Returns 32bit offset obtained from vmsOffs 64 bit array
 * @param offs 64bit Offset
 * @returns 32bit offset
 */
declare function toOffs(offs: number): number;
