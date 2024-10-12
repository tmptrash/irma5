declare module 'irma5/src/vms' {
  export type VMType = {
    offs: BigUint64Array,
    map: Map<number, Uint32Array>
    w: WorldType
  }
  export default function VMs(w: WorldType, vmOffs: BigUint64Array): VMType;
  export function vm(offs: number, energy: number = 0): BigInt
  export function nrg(offs: BigInt): number
}