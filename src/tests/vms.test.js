import CFG from '../cfg'
import { ATOM_TYPE_SHIFT, NO_DIR } from '../shared'
import VMs, { CMDS, vm, addVm } from '../vms'
import World, { destroy, get, put } from '../world'
import { mov, fix, spl, con, job, rep, checkVm } from './atoms'

describe('vm module tests', () => {
  let w = null
  let vms = null
  let WIDTH = 0
  beforeEach(() => {
    const canvas = document.createElement("canvas")
    canvas.id = 'irma5'
    WIDTH = CFG.WORLD.width = CFG.WORLD.height = 10
    canvas.setAttribute('width', CFG.WORLD.width)
    canvas.setAttribute('height', CFG.WORLD.height)
    canvas.getContext = () => { return {getImageData: (x,y,w,h) => { return {data: new Uint8ClampedArray(w*h)}}, putImageData: () => {}}}
    document.body.appendChild(canvas)
    w = World()
    vms = VMs(w, BigUint64Array.new(0))
  })
  afterEach(() => {
    destroy(w)
    document.querySelector(CFG.HTML.canvasQuery).remove()
    vms = w = null
  })

  test('CMDS array', () => {
    // amount of commands should be <= 2**3, because we use 3 bits for type
    expect(CMDS.length <= 2 ** (16 - ATOM_TYPE_SHIFT)).toBe(true)
  })

  describe('nop atom tests', () => {
    test('nop atom should do nothing', () => {
      const offs = 0
      const vmIdx = addVm(vms, offs, 1)
      const a = get(w, offs)
      CMDS[0](vms, a, vms.offs.i - 1)
      expect(get(w, offs)).toBe(a)
      expect(vms.offs[vmIdx]).toBe(vm(offs, 1))
    })
  })

  describe('mov atom tests', () => {
    test('mov atom should move itself', () => {
      const offs = 0
      const energy = CFG.ATOM.NRG.mov * 2
      const vmIdx = addVm(vms, offs, energy)
      put(w, 0, mov(2, 2))
      const m = get(w, offs)
      CMDS[1](vms, m, vmIdx)
      expect(get(w, offs + 1)).toBe(m)
      expect(vms.map[offs + 1].has(vmIdx)).toBe(true)
      expect(vms.offs[vmIdx]).toBe(vm(offs + 1, energy - CFG.ATOM.NRG.mov))
    })
    test('mov atom should move itself and vm should be removed without energy', () => {
      const offs = 0
      const energy = CFG.ATOM.NRG.mov
      const vmIdx = addVm(vms, offs, energy)
      put(w, 0, mov(2, 2))
      const m = get(w, offs)
      CMDS[1](vms, m, vmIdx)
      expect(get(w, offs + 1)).toBe(m)
      expect(vms.map[offs + 1]).toBe(undefined)
    })
    test('mov atom should move itself and the neighbour on the way', () => {
      const offs = 0
      const energy = 3 * CFG.ATOM.NRG.mov
      const vmIdx = addVm(vms, offs, energy)
      put(w, offs, mov(2, 2))
      put(w, offs + 1, fix(2, 0, 2))
      const m = get(w, offs)
      const f = get(w, offs + 1)
      CMDS[1](vms, m, vmIdx)
      expect(get(w, offs + 1)).toBe(m)
      expect(get(w, offs + 2)).toBe(f)
      expect(vms.map[offs + 1]).toBe(undefined)
      expect(vms.map[offs + 2].has(vmIdx)).toBe(true)
      expect(checkVm(vms, offs + 2, vmIdx, energy - 2 * CFG.ATOM.NRG.mov)).toBe(true)
    })
    test('mov atom should move itself and update its vm bond and near atom vm bond', () => {
      const offs = WIDTH
      const energy = 2 * CFG.ATOM.NRG.mov
      const vmIdx = addVm(vms, offs, energy)
      put(w, offs, mov(0, 2))
      put(w, 0, fix(4, 0, 2))
      CMDS[1](vms, get(w, offs), vmIdx)
      expect(get(w, 0)).toBe(fix(3, 0, 2))
      expect(get(w, offs + 1)).toBe(mov(7, 2))
      expect(vms.offs[vmIdx]).toBe(vm(0, CFG.ATOM.NRG.mov))
      expect(checkVm(vms, 0, vmIdx, energy - CFG.ATOM.NRG.mov)).toBe(true)
    })
    test('mov atom should move itself and neighbour atom behind', () => {
      const offs = 1
      const energy = 3 * CFG.ATOM.NRG.mov
      const vmIdx = addVm(vms, offs, energy)
      put(w, offs, mov(6, 2))
      put(w, offs - 1, fix(0, 0, 0))
      CMDS[1](vms, get(w, offs), vmIdx)
      expect(get(w, offs)).toBe(fix(0, 0, 0))
      expect(get(w, offs + 1)).toBe(mov(6, 2))
      expect(checkVm(vms, offs, vmIdx, energy - 2 * CFG.ATOM.NRG.mov)).toBe(true)
    })
    test('mov atom should move itself and neighbour atom behind and one more', () => {
      const offs = 0
      const energy = 4 * CFG.ATOM.NRG.mov
      const vmIdx = addVm(vms, offs, energy)
      put(w, offs, mov(2, 2))
      put(w, offs + 1, fix(0, 0, 0))
      put(w, offs + WIDTH, fix(0, 4, 4))
      CMDS[1](vms, get(w, offs), vmIdx)
      expect(get(w, offs + 1)).toBe(mov(2, 2))
      expect(get(w, offs + 2)).toBe(fix(0, 0, 0))
      expect(get(w, offs + WIDTH)).toBe(fix(1, 4, 4))
      expect(checkVm(vms, offs + 2, vmIdx, energy - 2 * CFG.ATOM.NRG.mov)).toBe(true)
    })
    test('move two mov atoms', () => {
      const offs = WIDTH + 1
      const energy = 4 * CFG.ATOM.NRG.mov
      const vmIdx = addVm(vms, offs, energy)
      put(w, offs, mov(7, 3))
      put(w, 0, mov(3, 4))
      CMDS[1](vms, get(w, offs), vmIdx)
      CMDS[1](vms, get(w, offs), vmIdx)
      expect(get(w, offs + WIDTH + 1)).toBe(mov(6, 3))
      expect(get(w, offs + WIDTH)).toBe(mov(2, 4))
      expect(checkVm(vms, offs + WIDTH + 1, vmIdx, energy - 3 * CFG.ATOM.NRG.mov)).toBe(true)
    })
    test('move three atoms together', () => {
      const offs = WIDTH + 1
      const energy = 4 * CFG.ATOM.NRG.mov
      const vmIdx = addVm(vms, offs, energy)
      put(w, offs, mov(4, 4))
      put(w, 0, fix(3, 6, 6))
      put(w, 2, fix(5, 6, 6))
      CMDS[1](vms, get(w, offs), vmIdx)
      expect(get(w, offs + WIDTH)).toBe(mov(4, 4))
      expect(get(w, offs - 1)).toBe(fix(3, 6, 6))
      expect(get(w, offs + 1)).toBe(fix(5, 6, 6))
      expect(checkVm(vms, offs + WIDTH, vmIdx, energy - 3 * CFG.ATOM.NRG.mov)).toBe(true)
    })
    test('mov atom should update if atom bonds correctly', () => {
      const offs = WIDTH
      const energy = 3 * CFG.ATOM.NRG.mov
      const vmIdx = addVm(vms, offs, energy)
      put(w, offs, mov(0, 2))
      put(w, 0, con(4, 4, 4, NO_DIR))
      CMDS[1](vms, get(w, offs), vmIdx)
      expect(get(w, 0)).toBe(con(4, 3, 3, NO_DIR))
      expect(get(w, offs + 1)).toBe(mov(7, 2))
      expect(checkVm(vms, 0, vmIdx, energy - CFG.ATOM.NRG.mov)).toBe(true)
    })
    test('mov atom should move VM correctly', () => {
      const offs = 0
      const energy = 4 * CFG.ATOM.NRG.mov
      const vmIdx = addVm(vms, offs, energy)
      put(w, offs, mov(2, 2))
      put(w, offs + 1, fix(2, 0, 2))
      CMDS[1](vms, get(w, offs), vmIdx)
      expect(checkVm(vms, offs + 2, vmIdx, energy - 2 * CFG.ATOM.NRG.mov)).toBe(true)
    })
    test('two near mov atoms should move on the same place after two ticks', () => {
      const offs = 0
      const energy = 6 * CFG.ATOM.NRG.mov
      const vmIdx = addVm(vms, offs, energy)
      put(w, offs, mov(2, 2))
      put(w, offs + 1, mov(6, 6))
      CMDS[1](vms, get(w, offs), vmIdx)
      expect(checkVm(vms, offs + 2, vmIdx, energy - 2 * CFG.ATOM.NRG.mov)).toBe(true)
      CMDS[1](vms, get(w, offs + 2), vmIdx)
      expect(checkVm(vms, offs, vmIdx, energy - 4 * CFG.ATOM.NRG.mov)).toBe(true)
      expect(get(w, offs)).toBe(mov(2, 2))
      expect(get(w, offs + 1)).toBe(mov(6, 6))
    })
  })

  describe('fix atom tests', () => {
    test('fix atom should fix near atoms together if they have no bonds', () => {
      const offs = WIDTH
      const energy = 10 * CFG.ATOM.NRG.fix
      const vmIdx = addVm(vms, offs, energy)
      put(w, offs, fix(4, 2, 7))
      put(w, 0, mov(NO_DIR, 0))
      put(w, offs + 1, mov(NO_DIR, 2))
      CMDS[2](vms, get(w, offs), 0)
      expect(get(w, offs)).toBe(fix(4, 2, 7))
      expect(get(w, offs + 1)).toBe(mov(7, 2))
      expect(get(w, 0)).toBe(mov(NO_DIR, 0))
      expect(checkVm(vms, offs, vmIdx, energy - CFG.ATOM.NRG.onFix)).toBe(true)
    })
    test('fix atom should fix near atoms together, but should not if they already joined', () => {
      const offs = WIDTH
      const energy = 6 * CFG.ATOM.NRG.onFix
      const vmIdx = addVm(vms, offs, energy)
      put(w, offs, fix(4, 2, 7))
      put(w, 0, mov(NO_DIR, 0))
      put(w, offs + 1, mov(2, 2))
      CMDS[2](vms, get(w, offs), vmIdx)
      expect(checkVm(vms, offs, vmIdx, energy - CFG.ATOM.NRG.onFix)).toBe(true)
      CMDS[2](vms, get(w, offs), vmIdx)
      expect(checkVm(vms, offs, vmIdx, energy - CFG.ATOM.NRG.onFix)).toBe(true)
    })
    test('fix atom should fix near atoms together if they have only 1 bond', () => {
      const offs = WIDTH
      const energy = 6 * CFG.ATOM.NRG.onFix
      const vmIdx = addVm(vms, offs, energy)
      put(w, offs, fix(4, 2, 7))
      put(w, 0, mov(NO_DIR, 0))
      put(w, offs + 1, mov(2, 2))
      CMDS[2](vms, get(w, offs), vmIdx)
      expect(get(w, offs)).toBe(fix(4, 2, 7))
      expect(get(w, offs + 1)).toBe(mov(2, 2))
      expect(get(w, 0)).toBe(mov(3, 0))
      expect(checkVm(vms, offs, vmIdx, energy - CFG.ATOM.NRG.onFix)).toBe(true)
    })
    test('fix atom should not fix near atoms if they already have bonds', () => {
      const offs = WIDTH
      const energy = 4 * CFG.ATOM.NRG.fix
      const vmIdx = addVm(vms, offs, energy)
      put(w, offs, fix(4, 2, 7))
      put(w, 0, mov(0, 0))
      put(w, offs + 1, mov(2, 2))
      CMDS[2](vms, get(w, offs), vmIdx)
      expect(get(w, offs)).toBe(fix(4, 2, 7))
      expect(get(w, offs + 1)).toBe(mov(2, 2))
      expect(get(w, 0)).toBe(mov(0, 0))
      expect(checkVm(vms, offs, vmIdx, energy)).toBe(true)
    })
    test('fix atom should fix itself and near atom', () => {
      const offs = 0
      const energy = 5 * CFG.ATOM.NRG.onFix
      const vmIdx = addVm(vms, offs, energy)
      put(w, offs, fix(NO_DIR, 2, 6))
      put(w, offs + 1, mov(0, 0))
      CMDS[2](vms, get(w, offs), vmIdx)
      expect(get(w, offs)).toBe(fix(2, 2, 6))
      expect(get(w, offs + 1)).toBe(mov(0, 0))
      expect(checkVm(vms, offs, vmIdx, energy - CFG.ATOM.NRG.onFix)).toBe(true)
    })
    test('fix atom should not work if second atom is not exist', () => {
      const offs = 0
      const energy = 10 * CFG.ATOM.NRG.fix
      const vmIdx = addVm(vms, offs, energy)
      put(w, offs, fix(2, 2, 2))
      put(w, offs + 1, mov(NO_DIR, 0))
      CMDS[2](vms, get(w, offs), vmIdx)
      expect(get(w, offs)).toBe(fix(2, 2, 2))
      expect(get(w, offs + 1)).toBe(mov(NO_DIR, 0))
      expect(checkVm(vms, offs + 1, vmIdx, energy - CFG.ATOM.NRG.fix)).toBe(true)
    })
    test('fix atom should not work if no atoms around', () => {
      const offs = 0
      const energy = 10 * CFG.ATOM.NRG.fix
      const vmIdx = addVm(vms, offs, energy)
      put(w, offs, fix(2, 2, 2))
      CMDS[2](vms, get(w, offs), vmIdx)
      expect(get(w, offs)).toBe(fix(2, 2, 2))
      expect(get(w, offs + 1)).toBe(0)
      expect(checkVm(vms, offs, vmIdx, energy)).toBe(true)
    })
    test('fix atom should move VM correctly', () => {
      const offs = WIDTH
      const energy = 4 * CFG.ATOM.NRG.fix
      const vmIdx = addVm(vms, offs, energy)
      put(w, offs, fix(2, 2, 7))
      put(w, offs + 1, mov(NO_DIR, 2))
      CMDS[2](vms, get(w, offs), vmIdx)
      expect(checkVm(vms, offs + 1, vmIdx, energy - CFG.ATOM.NRG.fix)).toBe(true)
    })
  })

  describe('spl atom tests', () => {
    test('spl atom should split near first atoms', () => {
      const offs = WIDTH
      const energy = 10
      const vmIdx = addVm(vms, offs, energy)
      put(w, offs, spl(2, 2, 7))
      put(w, 0, mov(4, 2))
      put(w, offs + 1, mov(6, 2))
      CMDS[3](vms, get(w, offs), vmIdx)
      expect(get(w, offs)).toBe(spl(2, 2, 7))
      expect(get(w, 0)).toBe(mov(4, 2))
      expect(get(w, offs + 1)).toBe(mov(NO_DIR, 2))
      expect(checkVm(vms, offs + 1, vmIdx, energy + CFG.ATOM.NRG.onSpl - CFG.ATOM.NRG.spl)).toBe(true)
    })
    test('spl atom should split near second atom', () => {
      const offs = WIDTH
      const energy = 10
      const vmIdx = addVm(vms, offs, energy)
      put(w, offs, spl(2, 2, 7))
      put(w, 0, mov(3, 2))
      put(w, offs + 1, mov(NO_DIR, 2))
      CMDS[3](vms, get(w, offs), vmIdx)
      expect(get(w, offs)).toBe(spl(2, 2, 7))
      expect(get(w, 0)).toBe(mov(NO_DIR, 2))
      expect(get(w, offs + 1)).toBe(mov(NO_DIR, 2))
      expect(checkVm(vms, offs + 1, vmIdx, energy + CFG.ATOM.NRG.onSpl - CFG.ATOM.NRG.spl)).toBe(true)
    })
    test('spl atom should split itself and near atom', () => {
      const offs = WIDTH
      const energy = 10
      const vmIdx = addVm(vms, offs, energy)
      put(w, offs, spl(2, 2, 6))
      put(w, offs + 1, mov(NO_DIR, 2))
      CMDS[3](vms, get(w, offs), vmIdx)
      expect(get(w, offs)).toBe(spl(NO_DIR, 2, 6))
      expect(get(w, offs + 1)).toBe(mov(NO_DIR, 2))
      expect(checkVm(vms, offs + 1, vmIdx, energy + CFG.ATOM.NRG.onSpl - CFG.ATOM.NRG.spl)).toBe(true)
    })
    test('spl atom should split itself and near atom if only near atom has bond', () => {
      const offs = WIDTH
      const energy = 10
      const vmIdx = addVm(vms, offs, energy)
      put(w, offs, spl(NO_DIR, 2, 6))
      put(w, offs + 1, mov(6, 2))
      CMDS[3](vms, get(w, offs), vmIdx)
      expect(get(w, offs)).toBe(spl(NO_DIR, 2, 6))
      expect(get(w, offs + 1)).toBe(mov(NO_DIR, 2))
      expect(checkVm(vms, offs, vmIdx, energy + CFG.ATOM.NRG.onSpl)).toBe(true)
    })
    test('spl atom should not split near atoms if they have no bonds', () => {
      const offs = WIDTH
      const energy = 10
      const vmIdx = addVm(vms, offs, energy)
      put(w, offs, spl(2, 2, 7))
      put(w, 0, mov(NO_DIR, 2))
      put(w, offs + 1, mov(NO_DIR, 2))
      CMDS[3](vms, get(w, offs), vmIdx)
      expect(get(w, offs)).toBe(spl(2, 2, 7))
      expect(get(w, 0)).toBe(mov(NO_DIR, 2))
      expect(get(w, offs + 1)).toBe(mov(NO_DIR, 2))
      expect(checkVm(vms, offs + 1, vmIdx, energy - CFG.ATOM.NRG.spl)).toBe(true)
    })
    test('spl atom should not split if no second atom', () => {
      const offs = WIDTH
      const energy = 10
      const vmIdx = addVm(vms, offs, energy)
      put(w, offs, spl(2, 2, 7))
      put(w, offs + 1, mov(6, 2))
      CMDS[3](vms, get(w, offs), vmIdx)
      expect(get(w, offs)).toBe(spl(2, 2, 7))
      expect(get(w, offs + 1)).toBe(mov(6, 2))
      expect(checkVm(vms, offs + 1, vmIdx, energy - CFG.ATOM.NRG.spl)).toBe(true)
    })
    test('spl atom should not split if no near atoms', () => {
      const offs = 0
      const energy = 10
      const vmIdx = addVm(vms, offs, energy)
      put(w, offs, spl(2, 2, 7))
      CMDS[3](vms, get(w, offs), vmIdx)
      expect(get(w, offs)).toBe(spl(2, 2, 7))
      expect(get(w, offs + 1)).toBe(0)
      expect(checkVm(vms, offs, vmIdx, energy)).toBe(true)
    })
  })

  describe('con atom tests', () => {
    test('con atom should direct VM to then dir if near atom exists', () => {
      const offs = 0
      const energy = 10
      const vmIdx = addVm(vms, offs, energy)
      put(w, offs, con(2, 4, 2, NO_DIR))
      put(w, offs + 1, mov(NO_DIR, 2))
      put(w, WIDTH, spl(NO_DIR, 2, 0))
      CMDS[4](vms, get(w, offs), vmIdx)
      expect(get(w, offs)).toBe(con(2, 4, 2, NO_DIR))
      expect(get(w, offs + 1)).toBe(mov(NO_DIR, 2))
      expect(get(w, WIDTH)).toBe(spl(NO_DIR, 2, 0))
      expect(checkVm(vms, offs + WIDTH, vmIdx, energy - CFG.ATOM.NRG.con)).toBe(true)
    })
    test('con atom should direct VM to else dir if near atom is not exist', () => {
      const offs = 0
      const energy = 10
      const vmIdx = addVm(vms, offs, energy)
      put(w, offs, con(0, 4, 2, NO_DIR))
      put(w, offs + 1, mov(NO_DIR, 2))
      put(w, WIDTH, spl(NO_DIR, 2, 0))
      CMDS[4](vms, get(w, offs), vmIdx)
      expect(get(w, offs)).toBe(con(0, 4, 2, NO_DIR))
      expect(get(w, offs + 1)).toBe(mov(NO_DIR, 2))
      expect(get(w, WIDTH)).toBe(spl(NO_DIR, 2, 0))
      expect(checkVm(vms, offs + 1, vmIdx, energy - CFG.ATOM.NRG.con)).toBe(true)
    })
    test('con atom should not direct VM to else dir if else atom is not exist', () => {
      const offs = 0
      const energy = 10
      const vmIdx = addVm(vms, offs, energy)
      put(w, offs, con(2, 4, 2, NO_DIR))
      put(w, WIDTH, spl(NO_DIR, 2, 0))
      CMDS[4](vms, get(w, offs), vmIdx)
      expect(get(w, offs)).toBe(con(2, 4, 2, NO_DIR))
      expect(get(w, WIDTH)).toBe(spl(NO_DIR, 2, 0))
      expect(checkVm(vms, offs, vmIdx, energy)).toBe(true)
    })
    test('con atom should direct VM to then atom if then and else dirs are the same', () => {
      const offs = 0
      const energy = 10
      const vmIdx = addVm(vms, offs, energy)
      put(w, offs, con(2, 2, 2, NO_DIR))
      put(w, offs + 1, spl(NO_DIR, 2, 0))
      CMDS[4](vms, get(w, offs), vmIdx)
      expect(get(w, offs)).toBe(con(2, 2, 2, NO_DIR))
      expect(get(w, offs + 1)).toBe(spl(NO_DIR, 2, 0))
      expect(checkVm(vms, offs + 1, vmIdx, energy - CFG.ATOM.NRG.con)).toBe(true)
    })
    test('con atom should not direct VM to then atom if then atom does not exist', () => {
      const offs = 0
      const energy = 10
      const vmIdx = addVm(vms, offs, energy)
      put(w, offs, con(2, 2, 2, NO_DIR))
      CMDS[4](vms, get(w, offs), vmIdx)
      expect(get(w, offs)).toBe(con(2, 2, 2, NO_DIR))
      expect(get(w, offs + 1)).toBe(0)
      expect(checkVm(vms, offs, vmIdx, energy - CFG.ATOM.NRG.con)).toBe(true)
    })
    test('con atom should not direct VM to else dir if else atom is not exist', () => {
      const offs = 0
      const energy = 10
      const vmIdx = addVm(vms, offs, energy)
      put(w, offs, con(7, 4, 2, 4))
      put(w, offs + WIDTH, spl(NO_DIR, 1, 0))
      CMDS[4](vms, get(w, offs), vmIdx)
      expect(get(w, offs)).toBe(con(7, 4, 2, 4))
      expect(get(w, offs + WIDTH)).toBe(spl(NO_DIR, 1, 0))
      expect(checkVm(vms, offs, vmIdx, energy)).toBe(true)
    })
    test('con atom should direct VM to else dir if we compare different atoms', () => {
      const offs = 0
      const energy = 10
      const vmIdx = addVm(vms, offs, energy)
      put(w, offs, con(2, 2, 4, 4))
      put(w, offs + 1, spl(NO_DIR, 2, 0))
      put(w, WIDTH, fix(NO_DIR, 1, 0))
      CMDS[4](vms, get(w, offs), vmIdx)
      expect(get(w, offs)).toBe(con(2, 2, 4, 4))
      expect(get(w, offs + 1)).toBe(spl(NO_DIR, 2, 0))
      expect(get(w, offs + WIDTH)).toBe(fix(NO_DIR, 1, 0))
      expect(checkVm(vms, offs + WIDTH, vmIdx, energy - CFG.ATOM.NRG.con)).toBe(true)
    })
    test('con atom should not direct VM to else dir if no atom in VM dir', () => {
      const offs = 0
      const energy = 10
      const vmIdx = addVm(vms, offs, energy)
      put(w, offs, con(2, 2, 5, 4))
      put(w, offs + 1, spl(NO_DIR, 2, 0))
      put(w, offs + WIDTH, fix(NO_DIR, 1, 0))
      CMDS[4](vms, get(w, offs), vmIdx)
      expect(get(w, offs)).toBe(con(2, 2, 5, 4))
      expect(get(w, offs + 1)).toBe(spl(NO_DIR, 2, 0))
      expect(get(w, offs + WIDTH)).toBe(fix(NO_DIR, 1, 0))
      expect(checkVm(vms, offs, vmIdx, energy)).toBe(true)
    })
    test('con atom should not move VM to else or if dir if no atoms around', () => {
      const offs = 0
      const energy = 10
      const vmIdx = addVm(vms, offs, energy)
      put(w, offs, con(2, 2, 5, 4))
      CMDS[4](vms, get(w, offs), vmIdx)
      expect(get(w, offs)).toBe(con(2, 2, 5, 4))
      expect(checkVm(vms, offs, vmIdx, energy)).toBe(true)
    })
  })

  describe('job atom tests', () => {
    test('job atom should create new VM and put it on near atom', () => {
      const offs = 0
      const energy = 10 * CFG.ATOM.NRG.job
      const vmIdx = addVm(vms, offs, energy)
      put(w, offs, job(2, 2))
      put(w, offs + 1, spl(NO_DIR, 2, 0))
      CMDS[5](vms, get(w, offs), vmIdx)
      expect(get(w, offs)).toBe(job(2, 2))
      expect(get(w, offs + 1)).toBe(spl(NO_DIR, 2, 0))
      expect(checkVm(vms, offs + 1, vmIdx, energy - Math.floor(energy / 2) - CFG.ATOM.NRG.job)).toBe(true)
      expect(vms.map[offs + 1].i).toBe(2)
    })
    test('job atom should create new VM, but not move current vm to the next atom if not exist', () => {
      const offs = 0
      const energy = 10 * CFG.ATOM.NRG.job
      const vmIdx = addVm(vms, offs, energy)
      put(w, offs, job(0, 2))
      put(w, offs + 1, spl(NO_DIR, 2, 0))
      CMDS[5](vms, get(w, offs), vmIdx)
      expect(get(w, offs)).toBe(job(0, 2))
      expect(get(w, offs + 1)).toBe(spl(NO_DIR, 2, 0))
      expect(checkVm(vms, offs, vmIdx, energy - Math.floor(energy / 2))).toBe(true)
      expect(vms.map[offs].i).toBe(1)
      expect(vms.map[offs + 1].i).toBe(1)
    })
    test('job atom should not create new VM, because there is no near atom', () => {
      const offs = 0
      const energy = 10 * CFG.ATOM.NRG.job
      const vmIdx = addVm(vms, offs, energy)
      put(w, offs, job(2, 2))
      CMDS[5](vms, get(w, offs), vmIdx)
      expect(get(w, offs)).toBe(job(2, 2))
      expect(checkVm(vms, offs, vmIdx, energy)).toBe(true)
    })
  })

  describe('rep atom tests', () => {
    test('rep atom should replicate bonds of near atom', () => {
      const offs = 0
      const energy = 10
      const vmIdx = addVm(vms, offs, energy)
      put(w, offs, rep(2, 2, 2))
      put(w, offs + 1, spl(3, 4, 5))
      put(w, offs + 2, spl(4, 5, 6))
      CMDS[6](vms, get(w, offs), vmIdx)
      expect(get(w, offs)).toBe(rep(2, 2, 2))
      expect(get(w, offs + 1)).toBe(spl(3, 4, 5))
      expect(get(w, offs + 2)).toBe(spl(3, 4, 5))
      expect(checkVm(vms, offs + 1, vmIdx, energy - CFG.ATOM.NRG.rep)).toBe(true)
    })
    test('rep atom should not replicate bonds if no near atoms', () => {
      const offs = 0
      const energy = 10
      const vmIdx = addVm(vms, offs, energy)
      put(w, offs, rep(2, 2, 2))
      CMDS[6](vms, get(w, offs), vmIdx)
      expect(get(w, offs)).toBe(rep(2, 2, 2))
      expect(get(w, offs + 1)).toBe(0)
      expect(get(w, offs + 2)).toBe(0)
      expect(checkVm(vms, offs, vmIdx, energy)).toBe(true)
    })
    test('rep atom should replicate bonds of itself', () => {
      const offs = 0
      const energy = 10
      const vmIdx = addVm(vms, offs, energy)
      put(w, offs, rep(2, 2, 6))
      put(w, offs + 1, rep(3, 4, 5))
      CMDS[6](vms, get(w, offs), vmIdx)
      expect(get(w, offs)).toBe(rep(3, 4, 5))
      expect(get(w, offs + 1)).toBe(rep(3, 4, 5))
      expect(checkVm(vms, offs + 1, vmIdx, energy - CFG.ATOM.NRG.rep)).toBe(true)
    })
  })
})