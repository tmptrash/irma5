import CFG from '../cfg'
import { ATOM_TYPE_SHIFT } from '../shared'
import { CMDS } from '../vm'
import World, { destroy, get, put } from '../world'
import { toOffs } from '../atom'
import { mov } from './atoms'

describe('vm module tests', () => {
  let vmsOffs = null
  let w = null
  let vms = null
  beforeEach(() => {
    const canvas = document.createElement("canvas")
    CFG.WORLD.width = CFG.WORLD.height = 10
    canvas.setAttribute('width', CFG.WORLD.width)
    canvas.setAttribute('height', CFG.WORLD.height)
    canvas.getContext = () => { return {getImageData: (x,y,w,h) => { return {data: new Uint8ClampedArray(w*h)}}, putImageData: () => {}}}
    document.body.appendChild(canvas)
    vmsOffs = new BigInt64Array(1)
    w = World()
  })
  afterEach(() => {
    destroy(w)
    document.querySelector(CFG.HTML.canvasQuery).remove()
    vms = vmsOffs = w = null
  })

  test('CMDS array', () => {
    // amount of commands should be <= 2**3, because we use 3 bits for type
    expect(CMDS.length <= 2 ** (16 - ATOM_TYPE_SHIFT)).toBe(true)
  })

  describe('nop atom tests', () => {
    test('nop atom should do nothing', () => {
      vmsOffs[0] = 0n
      const a = get(w, toOffs(vmsOffs[0]))
      CMDS[0](vms, a, 0)
      expect(get(w, toOffs(vmsOffs[0]))).toBe(a)
    })
  })

  describe('mov atom tests', () => {
    test('mov atom should move itself', () => {
      vmsOffs[0] = 1n
      const movAtom = mov(2, 2)
      put(w, 0, movAtom)
      const offs = toOffs(vmsOffs[0])
      const a = get(w, offs)
      expect(a).toBe(movAtom)
      CMDS[1](vms, a, 0)
      expect(get(w, offs + 1)).toBe(a)
    })
  })
})