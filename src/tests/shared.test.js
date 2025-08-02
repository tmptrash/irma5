import { rnd, setRndSeed, UInt32Array } from "../shared";

describe('Shared functions', () => {
  describe('rnd() function logic', () => {
    it('Resetting seed to the same value should get us the same rnd() result', () => {
      setRndSeed(1)
      const v0 = rnd()
      setRndSeed(1)
      const v1 = rnd()
      expect(v0).toBe(v1)
    })
  })

  describe('UInt32Array class', () => {
    it('should create a UInt32Array with 1 slot', () => {
      const a = UInt32Array.create(1)
      expect(a.i).toBe(0)
      expect(a.end()).toBe(false)
      a.add(42)
      expect(a[0]).toBe(42)
      expect(a.end()).toBe(true)
    })
    it('should create a UInt32Array with 0 size', () => {
      const a = UInt32Array.create(0)
      expect(a.end()).toBe(true)
      expect(a.i < 0).toBe(true)
    })
    it('should create a UInt32Array with size 2 and add two values without errors', () => {
      const a = UInt32Array.create(2)
      expect(a.end()).toBe(false)
      a.add(42)
      a.add(43)
      expect(a.i).toBe(2)
      expect(a[0]).toBe(42)
      expect(a[1]).toBe(43)
      expect(a.end()).toBe(true)
    })
  })
});