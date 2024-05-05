export function type(a: number): number;
export function b1Dir(a: any): number;
export function b2Dir(a: any): number;
export function b3Dir(a: any): number;
export function ifDir(a: any): number;
export function thenDir(a: any): number;
export function setThenDir(a: any, d: any): number;
export function elseDir(a: any): number;
export function setElseDir(a: any, d: any): number;
export function vmDir(a: any): number;
export function setVmDir(a: any, d: any): number;
/**
 * Returns 32bit offset for direction. The world is cyclical
 */
export function offs(offs: any, dir: any): any;
/**
 * Returns 32bit offset obtained from vmsOffs 64 bit array
 * @param offs 64bit Offset
 * @returns 32bit offset
 */
export function toOffs(offs: any): number;
//# sourceMappingURL=atom.d.ts.map