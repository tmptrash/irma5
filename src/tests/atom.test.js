import { type, b1Dir } from '../atom.js'

describe('Atom tests', () => {
  test('type()', () => {
    expect(type(0b0000000000000000)).toBe(0b000)
    expect(type(0b0010000000000000)).toBe(0b001)
    expect(type(0b0100000000000000)).toBe(0b010)
    expect(type(0b0110000000000000)).toBe(0b011)
    expect(type(0b1000000000000000)).toBe(0b100)
    expect(type(0b1010000000000000)).toBe(0b101)
    expect(type(0b1100000000000000)).toBe(0b110)
    expect(type(0b1110000000000000)).toBe(0b111)
    expect(type(0b0001111111111111)).toBe(0b000)
    expect(type(0b0101111111111111)).toBe(0b010)
  })

  test('b1Dir()', () => {
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
})