import { type } from './atom.js'

describe("atom module tests", function() { 
    it("type()", function() {
      expect(type(0b0000000000000000)).toBe(0)
      expect(type(0b0010000000000000)).toBe(1)
    })
  })