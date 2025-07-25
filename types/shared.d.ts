declare module 'irma5/src/shared' {
  export const VM_OFFS_MASK: 0xFFFFFFFF00000000n;
  export const VM_OFFS_SHIFT: 32n;
  export const VM_ENERGY_MASK: 0x00000000FFFFFFFFn;
  export const MOV_BREAK_MASK: 0b10000000000000000000000000000000;
  export const MOV_BREAK_UNMASK: 0b01111111111111111111111111111111;

  export const NO_DIR: -1;

  export const MASK_4BITS: 0b1111;
  export const MASK_3BITS: 0b111;
  export const MASK_2BITS: 0b11;

  export const ATOM_NOP: 0;
  export const ATOM_MOV: 1;
  export const ATOM_FIX: 2;
  export const ATOM_SPL: 3;
  export const ATOM_CON: 4;
  export const ATOM_JOB: 5;
  export const ATOM_REP: 6;
  export const ATOM_MUT: 7;

  export const ATOM_TYPE_MASK: 57344;
  export const ATOM_TYPE_UNMASK: 8191;
  export const ATOM_TYPE_SHIFT: 13;
  export const ATOM_VM_DIR_MASK: 7680;
  export const ATOM_VM_DIR_MASK1: 57855;
  export const ATOM_VM_DIR_SHIFT: 9;
  export const ATOM_BOND1_MASK: 448;
  export const ATOM_BOND1_MASK1: 65087;
  export const ATOM_BOND1_SHIFT: 6;
  export const ATOM_SECTION_MASK: 0b0000000000110000;
  export const ATOM_SECTION_MASK1: 0b1111111111001111;
  export const ATOM_SECTION_SHIFT: 4;
  export const ATOM_BOND2_MASK: 56;
  export const ATOM_BOND2_MASK1: 65479;
  export const ATOM_BOND2_SHIFT: 3;
  export const ATOM_BOND3_MASK: 15;
  export const ATOM_BOND3_MASK1: 65520;
  export const ATOM_SECTION_VAL_MASK: 0b0000000000001111;
  export const ATOM_IF_BOND_MASK: 7168;
  export const ATOM_IF_BOND_MASK1: 58367;
  export const ATOM_IF_BOND_SHIFT: 10;
  export const ATOM_THEN_BOND_MASK: 896;
  export const ATOM_THEN_BOND_MASK1: 64639;
  export const ATOM_THEN_BOND_SHIFT: 7;
  export const ATOM_ELSE_BOND_MASK: 112;
  export const ATOM_ELSE_BOND_MASK1: 65423;
  export const ATOM_ELSE_BOND_SHIFT: 4;
  /**
   * Bits sections offsets of all supported atoms. For example atom spl has these sections:
   * section 0: 07..09 - bits of bond 1 dir
   * section 1: 10..12 - bits of bond 2 dir (from the perspective of atom 1)
   *
   * All sections start from bit 7. Before that bit we keep atom type and next atom dir. Only
   * con atom has it's ows structure and has 4 sections
   */
  export const ATOMS_SECTIONS = Array<Array<number>>

  export function DIR_2_OFFS(dir: any): any;
  /**
   * Reverted directions. 0 (up) - 4 (down), 6 (left) - 2 (right),...
   */
  export const DIR_REV: number[];
  /**
   * Dir Mov Atom - is used for updating moving atom bonds. Let's imagine
   * we have a mov atom and one more atom on the right side of it: m -> s
   * m atom has a vm bond with a direction 2. If mov atom moves to the top,
   * it should update it's bond to the s atom by setting it to direction 3.
   * To complete this we have to use DMA like this:
   * DMA[m bond dir before move][move direction] === DMA[2][0]. It will
   * return new mov atom bond direction - 3. NO_DIR means that moved atom
   * and near to which moved atom's bond points have distane > 1.
   */
  export const DMA: number[][];
  /**
   * Dir Mov Disconnected - shows which near atoms will have distance
   * > 1 with moved atom. Let's imagine we have a mov atom and it moves
   * up (direction 0). If we get DMD[moving dir] === DMD[0] we see
   * that direction 3,4,5 will have distance > 1 and all other NO_DIR
   * directions will need to update it's bonds and have distance == 1.
   * So number means distance > 1, NO_DIR means distance == 1.
   */
  export const DMD: number[][];
  /**
   * Dir Near Atom - shows new bond direction for near atom after atom
   * move. Let's imagine we have a mov atom and other one on the right:
   * m <- s. If m atom moves to the top, s atom should update it's bond
   * to 7. For this we have to use DNA[near atom dir to moved][move dir]
   * === DNA[6][0] === 7
   */
  export const DNA: number[][];
  /**
   * All available directions
   */
  export const U:  0; // up
  export const UR: 1; // up-right
  export const R:  2; // right
  export const RD: 3; // right-down
  export const D:  4; // down
  export const DL: 5; // ...
  export const L:  6;
  export const LU: 7;
  /**
   * Random numbers generator with seed
   * @returns {Function} rnd function
   */
  export function rnd(): number
  /**
   * Wrapper for Uint32Array type with an ability to create, resize, add,
   * remove elements. The difference between this version and original is 
   * in using index (i) as a length property. So if user needs to resize 
   * an array to lesser size we don't do resize() we only change i prop
   */
  export class UInt32Array extends Uint32Array {
    static create(size: number): UInt32Array
    resize(size: number): UInt32Array
    has(val: number): boolean
    index(val: number): number
    double(): UInt32Array
    end(): boolean
    add(val: number): void
    del(i: number): void
  }
  /**
   * Wrapper for BigUint64Array type with an ability to create, resize, add,
   * remove elements. The difference between this version and original is 
   * in using index (i) as a length property. So if user needs to resize 
   * an array to lesser size we don't do resize() we only change i prop
   */
  export class UInt64Array extends BigUint64Array {
    static create(size: number): UInt64Array
    resize(size: number): UInt64Array
    has(val: BigInt): boolean
    index(val: BigInt): number
    double(): UInt64Array
    end(): boolean
    add(val: BigInt): void
    del(i: number): void
  }
}