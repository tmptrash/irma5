import { type, b1Dir, b2Dir, b3Dir, ifDir, setB1Dir, setB2Dir, setB3Dir } 
  from './../atom'
import { ATOM_MOV, ATOM_NOP, ATOM_FIX, ATOM_SPL, ATOM_CON, ATOM_JOB,
  ATOM_REP, NO_DIR } from './../shared'

describe('Atom tests', () => {
  it('type()', () => {
    expect(type(0b0000000000000000)).toBe(ATOM_NOP)
    expect(type(0b0010000000000000)).toBe(ATOM_MOV)
    expect(type(0b0100000000000000)).toBe(ATOM_FIX)
    expect(type(0b0110000000000000)).toBe(ATOM_SPL)
    expect(type(0b1000000000000000)).toBe(ATOM_CON)
    expect(type(0b1010000000000000)).toBe(ATOM_JOB)
    expect(type(0b1100000000000000)).toBe(ATOM_REP)
    expect(type(0b1110000000000000)).toBe(0b111)
    expect(type(0b0001111111111111)).toBe(0b000)
    expect(type(0b0101111111111111)).toBe(0b010)
  })

  it('b1Dir()', () => {
    expect(b1Dir(0b0000000000000000)).toBe(0b000)
    expect(b1Dir(0b0000000001000000)).toBe(0b001)
    expect(b1Dir(0b0000000010000000)).toBe(0b010)
    expect(b1Dir(0b0000000011000000)).toBe(0b011)
    expect(b1Dir(0b0000000100000000)).toBe(0b100)
    expect(b1Dir(0b0000000101000000)).toBe(0b101)
    expect(b1Dir(0b0000000110000000)).toBe(0b110)
    expect(b1Dir(0b0000000111000000)).toBe(0b111)
    expect(b1Dir(0b1111111000000000)).toBe(0b000)
    expect(b1Dir(0b0000000000111111)).toBe(0b000)
    expect(b1Dir(0b1111111010111111)).toBe(0b010)
  })

  it('setB1Dir()', () => {
    expect(b1Dir(setB1Dir(0b0000000000000000, 0b000))).toBe(0b000)
    expect(b1Dir(setB1Dir(0b0000000000000000, 0b001))).toBe(0b001)
    expect(b1Dir(setB1Dir(0b0000000000000000, 0b010))).toBe(0b010)
    expect(b1Dir(setB1Dir(0b0000000000000000, 0b011))).toBe(0b011)
    expect(b1Dir(setB1Dir(0b0000000000000000, 0b100))).toBe(0b100)
    expect(b1Dir(setB1Dir(0b0000000000000000, 0b101))).toBe(0b101)
    expect(b1Dir(setB1Dir(0b0000000000000000, 0b110))).toBe(0b110)
    expect(b1Dir(setB1Dir(0b0000000000000000, 0b111))).toBe(0b111)
    expect(b1Dir(setB1Dir(0b1111111000111111, 0b111))).toBe(0b111)
    expect(b1Dir(setB1Dir(0b1111111010111111, 0b010))).toBe(0b010)
  })

  it('b2Dir()', () => {
    expect(b2Dir(0b0000000000000000)).toBe(0b000)
    expect(b2Dir(0b0000000000001000)).toBe(0b001)
    expect(b2Dir(0b0000000000010000)).toBe(0b010)
    expect(b2Dir(0b0000000000011000)).toBe(0b011)
    expect(b2Dir(0b0000000000100000)).toBe(0b100)
    expect(b2Dir(0b0000000000101000)).toBe(0b101)
    expect(b2Dir(0b0000000000110000)).toBe(0b110)
    expect(b2Dir(0b0000000000111000)).toBe(0b111)
    expect(b2Dir(0b1111111111000111)).toBe(0b000)
    expect(b2Dir(0b1111111111010111)).toBe(0b010)
    expect(b2Dir(0b1111111111011111)).toBe(0b011)
    expect(b2Dir(0b1111111111101111)).toBe(0b101)
  })

  it('setB2Dir()', () => {
    expect(b2Dir(setB2Dir(0b0000000000000000, 0b000))).toBe(0b000)
    expect(b2Dir(setB2Dir(0b0000000000000000, 0b001))).toBe(0b001)
    expect(b2Dir(setB2Dir(0b0000000000000000, 0b010))).toBe(0b010)
    expect(b2Dir(setB2Dir(0b0000000000000000, 0b011))).toBe(0b011)
    expect(b2Dir(setB2Dir(0b0000000000000000, 0b100))).toBe(0b100)
    expect(b2Dir(setB2Dir(0b0000000000000000, 0b101))).toBe(0b101)
    expect(b2Dir(setB2Dir(0b0000000000000000, 0b110))).toBe(0b110)
    expect(b2Dir(setB2Dir(0b0000000000000000, 0b111))).toBe(0b111)
    expect(b2Dir(setB2Dir(0b1111111111111111, 0b111))).toBe(0b111)
    expect(b2Dir(setB2Dir(0b1111111111111111, 0b010))).toBe(0b010)
  })

  it('b3Dir()', () => {
    expect(b3Dir(0b0000000000000000)).toBe(NO_DIR)
    expect(b3Dir(0b0000000000000001)).toBe(0b0000)
    expect(b3Dir(0b0000000000000010)).toBe(0b0001)
    expect(b3Dir(0b0000000000000011)).toBe(0b0010)
    expect(b3Dir(0b0000000000000100)).toBe(0b0011)
    expect(b3Dir(0b0000000000000101)).toBe(0b0100)
    expect(b3Dir(0b0000000000000110)).toBe(0b0101)
    expect(b3Dir(0b0000000000000111)).toBe(0b0110)
    expect(b3Dir(0b0000000000001000)).toBe(0b0111)
    expect(b3Dir(0b0000000000001001)).toBe(0b1000)
    expect(b3Dir(0b1111111111110011)).toBe(0b0010)
    expect(b3Dir(0b1111111111110010)).toBe(0b0001)
  })

  it('setB3Dir()', () => {
    expect(b3Dir(setB3Dir(0b0000000000000000, 0b000))).toBe(0b000)
    expect(b3Dir(setB3Dir(0b0000000000000000, 0b001))).toBe(0b001)
    expect(b3Dir(setB3Dir(0b0000000000000000, 0b010))).toBe(0b010)
    expect(b3Dir(setB3Dir(0b0000000000000000, 0b011))).toBe(0b011)
    expect(b3Dir(setB3Dir(0b0000000000000000, 0b100))).toBe(0b100)
    expect(b3Dir(setB3Dir(0b0000000000000000, 0b101))).toBe(0b101)
    expect(b3Dir(setB3Dir(0b0000000000000000, 0b110))).toBe(0b110)
    expect(b3Dir(setB3Dir(0b0000000000000000, 0b111))).toBe(0b111)
    expect(b3Dir(setB3Dir(0b1111111111111111, 0b111))).toBe(0b111)
    expect(b3Dir(setB3Dir(0b1111111111111111, 0b010))).toBe(0b010)
  })

  it('ifDir()', () => {
    expect(ifDir(0b0000000000000000)).toBe(0b000)
    expect(ifDir(0b0000010000000000)).toBe(0b001)
    expect(ifDir(0b0000100000000010)).toBe(0b010)
    expect(ifDir(0b0000110000000011)).toBe(0b011)
    expect(ifDir(0b0001000000000100)).toBe(0b100)
    expect(ifDir(0b0001010000000101)).toBe(0b101)
    expect(ifDir(0b0001100000000110)).toBe(0b110)
    expect(ifDir(0b0001110000000011)).toBe(0b111)
    expect(ifDir(0b1110001111111111)).toBe(0b000)
    expect(ifDir(0b1110101111111111)).toBe(0b010)
    expect(ifDir(0b1111111111110011)).toBe(0b111)
    expect(ifDir(0b1110111111110010)).toBe(0b011)
  })
})