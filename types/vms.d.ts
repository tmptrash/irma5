import { UInt32Array } from './shared'
declare module 'irma5/src/vms' {
  export type VMType = {
    offs: BigUint64Array,
    map: Map<number, UInt32Array>
    w: WorldType
  }
  export default function VMs(w: WorldType, vmOffs: BigUint64Array): VMType;
  export function vm(offs: number, energy: number = 0): BigInt
  export function nrg(offs: BigInt): number
  export function tick(vms: VMType, vmIdx: number): number
}