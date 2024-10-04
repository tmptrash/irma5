declare module 'World' {
  export default function World(w?: number, h?: number): number;
  export function destroy(w: World): void;
  /**
   * Returns atom or 0, if no atom
   */
  export function get(w: World, offs: number): number;
  export function put(w: World, offs: number, atom: number): void;
  export function move(w: World, offs1: number, offs2: number): void;
}
