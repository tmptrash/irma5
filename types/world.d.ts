declare module 'irma5/src/world' {
  export type WorldType = {
    canvas: any
    ctx: any
    imgData: ImageData
    data: Uint8ClampedArray
    zoom: any
    zoomObserver: MutationObserver
    animateFn: (w: WorldType) => void
    x: number
    y: number
    w: number
    h: number
  }
  export default function World(hidden: boolean): WorldType;
  export function destroy(w: WorldType): void;
  /**
   * Returns atom or 0, if no atom
   */
  export function get(w: WorldType, offs: number): number;
  export function put(w: WorldType, offs: number, atom: number): void;
  export function move(w: WorldType, offs1: number, offs2: number): void;
}
