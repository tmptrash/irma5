import CFG from '../cfg'
import { ATOM_TYPE_SHIFT } from '../shared'
import { CMDS } from '../vm'
import World, { destroy } from '../world'

describe('vm module tests', () => {
  let vms = null
  let w = null
  beforeEach(() => {
    const canvas = document.createElement("canvas")
    CFG.WORLD.width = CFG.WORLD.height = 10
    canvas.setAttribute('width', CFG.WORLD.width)
    canvas.setAttribute('height', CFG.WORLD.height)
    canvas.getContext = jest.fn(() => { return {getImageData: (x,y,w,h) => { return {data: new Uint8ClampedArray(w*h)}}, putImageData: () => {}}})
    document.body.appendChild(canvas)
    vms = []
    w = World()
  })
  afterEach(() => {
    destroy(w)
    const canvas = document.querySelector(CFG.HTML.canvasQuery)
    canvas.remove()
    vms = w = null
  })

  test('CMDS', function() {
    // amount of commands should be <= 2**3, because we use 3 bits for type
    expect(CMDS.length <= 2 ** (16 - ATOM_TYPE_SHIFT)).toBe(true)
  })
})