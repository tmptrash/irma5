/// <reference types="../node_modules/irma5/types/shared.d.ts"/>

declare module 'irma5/src/vms' {
  export type VMType = {
    offs: UInt64Array,
    map: Map<number, UInt32Array>
    w: WorldType
  }
  export default function VMs(w: WorldType, vmOffs: UInt64Array): VMType;
  export function vm(offs: number, energy: number = 0): BigInt
  export function nrg(offs: BigInt): number
  export function tick(vms: VMType, vmIdx: number): number
}