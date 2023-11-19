import { type } from '../src/atom.js'

describe('atom module tests', function() { 
  it('type()', function() {
    expect(type(0b0000000000000000)).toBe(0b000)
    expect(type(0b0010000000000000)).toBe(0b001)
    expect(type(0b0100000000000000)).toBe(0b010)
    expect(type(0b1110000000000000)).toBe(0b111)
    expect(type(0b0001111111111111)).toBe(0b000)
    expect(type(0b0101111111111111)).toBe(0b010)
  })
})