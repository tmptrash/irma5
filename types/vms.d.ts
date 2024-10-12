import { type WorldType } from './world'

declare module 'VM' {
  export type VMType = {
    offs: BigUint64Array,
    map: Map<number, Uint32Array>
    w: WorldType
  }
  export default function VMs(w: WorldType, vmOffs: BigUint64Array): VMType
}