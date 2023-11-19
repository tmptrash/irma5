import { ATOM_TYPE_SHIFT } from '../src/shared.js'
import { CMDS } from '../src/vm.js'

describe('vm module tests', function() { 
  it('CMDS', function() {
    // amount of commands should be <= 2**3, because we use 3 bits for type
    expect(CMDS.length <= 2 ** (16 - ATOM_TYPE_SHIFT)).toBe(true)
  })
})