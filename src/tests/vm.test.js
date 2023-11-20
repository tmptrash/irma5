import { ATOM_TYPE_SHIFT } from '../shared'
import { CMDS } from '../vm'

describe('vm module tests', () => {
  let vms = null
  let w = null
//   beforeEach(() => {
//     vms = []
//     w = World()
//   })
//   afterEach(() => {
//     vms = w = null
//   })

  test('CMDS', function() {
    // amount of commands should be <= 2**3, because we use 3 bits for type
    expect(CMDS.length <= 2 ** (16 - ATOM_TYPE_SHIFT)).toBe(true)
  })
})