import CFG from '../cfg'
import { ATOM_TYPE_SHIFT, NO_DIR, UInt64Array, R, L, U, D, DL, LU, RD, ATOM_FIX } from '../shared'
import VMs, { CMDS, vm, addVm } from '../vms'
import World, { destroy, get, put } from '../world'
import { mov, fix, spl, con, job, rep, checkVm, testAtoms } from './utils'

beforeAll(() => {
  //
  // This code is used for Node.js environment for the tests
  //
  if (!ArrayBuffer.prototype.transfer) {
    ArrayBuffer.prototype.transfer = function transfer(len) {
      if (!(this instanceof ArrayBuffer)) throw new TypeError('Source must be an instance of ArrayBuffer')
      if (len <= this.byteLength) return this.slice(0, len)
      const sourceView = new Uint8Array(this)
      const destView = new Uint8Array(new ArrayBuffer(len))
      destView.set(sourceView)
      return destView.buffer
    }
  }
})

describe('vms module tests', () => {
  let w = null
  let vms = null
  let W = 0
  beforeEach(() => {
    const canvas = document.createElement("canvas")
    canvas.id = 'irma5'
    W = CFG.WORLD.width = CFG.WORLD.height = 10
    CFG.rpi = 1
    canvas.setAttribute('width', CFG.WORLD.width)
    canvas.setAttribute('height', CFG.WORLD.height)
    canvas.getContext = () => { return {getImageData: (x,y,w,h) => { return {data: new Uint8ClampedArray(w*h)}}, putImageData: () => {}}}
    document.body.appendChild(canvas)
    w = World()
    vms = VMs(w, UInt64Array.create(0))
  })
  afterEach(() => {
    destroy(w)
    document.querySelector(CFG.HTML.canvasQuery).remove()
    vms = w = null
  })

 /**
  * Tests atoms and VMs in a world. It works like this: we put all atoms from
  * "atomsFrom" array into the world, put all VMs from "vmsFrom" array into the
  * world as well. Runs all VMs one by one. Check if atoms "atomsTo" and VMs 
  * "vmsTo" are on the right places and with right amount of energy.
  * @param {Array} atomsFrom Atoms data to put before run: [[offs, atom],...]
  * @param {Array} vmsFrom VMs data to put before run: [[offs, energy],...]
  * @param {Array} atomsTo Atoms data to check after run: [[offs, atom],...]
  * @param {Array} vmsTo VMs data to check after run: [[offs, energy],...]
  */
  function testRun(atomsFrom = [], vmsFrom = [], atomsTo = [], vmsTo = []) {
    testAtoms(vms, w, atomsFrom, vmsFrom, atomsTo, vmsTo)
  }

  it('CMDS array', () => {
    // amount of commands should be <= 2**3, because we use 3 bits for type
    expect(CMDS.length <= 2 ** (16 - ATOM_TYPE_SHIFT)).toBe(true)
  })

  describe('nop atom tests', () => {
    it('nop atom should do nothing', () => {
      const offs = 0
      const vmIdx = addVm(vms, offs, 1)
      const a = get(w, offs)
      CMDS[0](vms, a, vms.offs.i - 1)
      expect(get(w, offs)).toBe(a)
      expect(vms.offs[vmIdx]).toBe(vm(offs, 1))
    })
  })

  describe('mov atom tests', () => {
    it('mov atom should not move without energy', () => {
      const offs = 0
      const m = mov(R, R)
      testRun([[offs, m]], [], [[offs, m]])
    })
    it('mov atom with 2 VMs on it should move twice longer', () => {
      const offs = 0
      const m = mov(R, R)
      const nrg = CFG.ATOM.NRG.mov
      testRun([[offs, m]], [[0, nrg], [0, nrg]], [[offs + 2, m]])
    })
    it('mov atom should move itself', () => {
      const offs = 0
      const nrg = CFG.ATOM.NRG.mov
      const m = mov(R, R)
      testRun([[offs, m]], [[offs, nrg * 2]], [[offs + 1, m]], [[offs + 1, nrg]])
    })
    it('mov atom should move itself and vm should be removed without energy', () => {
      const offs = 0
      const m = mov(2, 2)
      testRun([[offs, m]], [[offs, CFG.ATOM.NRG.mov]], [[offs + 1, m]])
    })
    it('mov atom should move itself and the atom on the way', () => {
      const offs = 0
      const nrg = CFG.ATOM.NRG.mov
      const m = mov(2, 2)
      const f = fix(2, 0, 2)
      testRun([[offs, m], [offs + 1, f]], [[offs, nrg * 3]], [[offs + 1, m], [offs + 2, f]], [[offs + 2, nrg]])
    })
    it('mov atom should move itself and update its vm bond and near atom vm bond', () => {
      const offs = W
      const nrg = CFG.ATOM.NRG.mov
      testRun([[offs, mov(0, 2)], [offs - W, fix(4, 0, 2)]], [[offs, nrg * 2]], [[offs - W, fix(3, 0, 2)], [offs + 1, mov(7, 2)]], [[offs - W, nrg]])
    })
    it('mov atom should move itself and neighbour atom behind', () => {
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
    it('mov atom should move itself and neighbour atom behind and one more', () => {
      const offs = 0
      const energy = 4 * CFG.ATOM.NRG.mov
      const vmIdx = addVm(vms, offs, energy)
      put(w, offs, mov(2, 2))
      put(w, offs + 1, fix(0, 0, 0))
      put(w, offs + W, fix(0, 4, 4))
      CMDS[1](vms, get(w, offs), vmIdx)
      expect(get(w, offs + 1)).toBe(mov(2, 2))
      expect(get(w, offs + 2)).toBe(fix(0, 0, 0))
      expect(get(w, offs + W)).toBe(fix(1, 4, 4))
      expect(checkVm(vms, offs + 2, vmIdx, energy - 2 * CFG.ATOM.NRG.mov)).toBe(true)
    })
    it('move two mov atoms', () => {
      const offs = W + 1
      const energy = 4 * CFG.ATOM.NRG.mov
      const vmIdx = addVm(vms, offs, energy)
      put(w, offs, mov(7, 3))
      put(w, 0, mov(3, 4))
      CMDS[1](vms, get(w, offs), vmIdx)
      CMDS[1](vms, get(w, offs), vmIdx)
      expect(get(w, offs + W + 1)).toBe(mov(6, 3))
      expect(get(w, offs + W)).toBe(mov(2, 4))
      expect(checkVm(vms, offs + W + 1, vmIdx, energy - 3 * CFG.ATOM.NRG.mov)).toBe(true)
    })
    it('move three atoms together', () => {
      const offs = W + 1
      const energy = 4 * CFG.ATOM.NRG.mov
      const vmIdx = addVm(vms, offs, energy)
      put(w, offs, mov(4, 4))
      put(w, 0, fix(3, 6, 6))
      put(w, 2, fix(5, 6, 6))
      CMDS[1](vms, get(w, offs), vmIdx)
      expect(get(w, offs + W)).toBe(mov(4, 4))
      expect(get(w, offs - 1)).toBe(fix(3, 6, 6))
      expect(get(w, offs + 1)).toBe(fix(5, 6, 6))
      expect(checkVm(vms, offs + W, vmIdx, energy - 3 * CFG.ATOM.NRG.mov)).toBe(true)
    })
    it('mov atom should update if atom bonds correctly', () => {
      const offs = W
      const energy = 3 * CFG.ATOM.NRG.mov
      const vmIdx = addVm(vms, offs, energy)
      put(w, offs, mov(0, 2))
      put(w, 0, con(4, 4, 4, NO_DIR))
      CMDS[1](vms, get(w, offs), vmIdx)
      expect(get(w, 0)).toBe(con(4, 3, 3, NO_DIR))
      expect(get(w, offs + 1)).toBe(mov(7, 2))
      expect(checkVm(vms, 0, vmIdx, energy - CFG.ATOM.NRG.mov)).toBe(true)
    })
    it('mov atom should move VM correctly', () => {
      const offs = 0
      const energy = 4 * CFG.ATOM.NRG.mov
      const vmIdx = addVm(vms, offs, energy)
      put(w, offs, mov(2, 2))
      put(w, offs + 1, fix(2, 0, 2))
      CMDS[1](vms, get(w, offs), vmIdx)
      expect(checkVm(vms, offs + 2, vmIdx, energy - 2 * CFG.ATOM.NRG.mov)).toBe(true)
    })
    it('two near mov atoms should move on the same place after two ticks', () => {
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
    it('after move mov atom should keep all near and it\'s own bonds consistent', () => {
      const nrg = 5 * CFG.ATOM.NRG.mov
      testRun([[W, fix(NO_DIR, U, U)], [W + 1, mov(DL, U)], [2 * W, mov(LU, U)]], [[W + 1, nrg]], [[0, fix(NO_DIR, U, U)], [1, mov(DL, U)], [W, mov(LU, U)]], [[W, nrg - CFG.ATOM.NRG.mov * 3]])
    })
  })

  describe('fix atom tests', () => {
    it('fix atom should fix near atoms together if they have no bonds', () => {
      const offs = W
      const energy = 10 * CFG.ATOM.NRG.fix
      const vmIdx = addVm(vms, offs, energy)
      put(w, offs, fix(4, 2, 7))
      put(w, 0, mov(NO_DIR, 0))
      put(w, offs + 1, mov(NO_DIR, 2))
      CMDS[ATOM_FIX](vms, get(w, offs), 0)
      expect(get(w, offs)).toBe(fix(4, 2, 7))
      expect(get(w, offs + 1)).toBe(mov(7, 2))
      expect(get(w, 0)).toBe(mov(NO_DIR, 0))
      expect(checkVm(vms, offs, vmIdx, energy - CFG.ATOM.NRG.onFix)).toBe(true)
    })
    it('fix atom should fix near atoms together, but should not if they already joined', () => {
      const nrg = 6 * CFG.ATOM.NRG.onFix
      const f = fix(D, R, LU)
      const m = mov(R, R)
      testRun([[W, f], [0, mov(NO_DIR, U)], [W + 1, m]], [[W, nrg]], [[W, f], [W + 1, m], [0, mov(RD, U)]], [[W, nrg - CFG.ATOM.NRG.onFix]])
    })
    it('fix atom should fix near atoms together if they have only 1 bond', () => {
      const nrg = 6 * CFG.ATOM.NRG.onFix
      const f = fix(D, R, LU)
      const m = mov(R, R)
      testRun([[W, f], [0, mov(NO_DIR, U)], [W + 1, m]], [[W, nrg]], [[W, f], [W + 1, m], [0, mov(RD, U)]], [[W, nrg - CFG.ATOM.NRG.onFix]])
    })
    it('fix atom should not fix near atoms if they already have bonds', () => {
      const nrg = 4 * CFG.ATOM.NRG.fix
      const f = fix(D, R, LU)
      const m1 = mov(U, U)
      const m2 = mov(R, R)
      testRun([[W, f], [0, m1], [W + 1, m2]], [[W, nrg]], [[W, f], [0, m1], [W + 1, m2]], [[W, nrg]])
    })
    it('fix atom should fix itself and near atom', () => {
      const f = fix(NO_DIR, R, L)
      const nrg = CFG.ATOM.NRG.onFix
      testRun([[0, f], [1, mov(NO_DIR, U)]], [[0, 5 * nrg]], [[0, f], [1, mov(L, U)]], [[0, 4 * nrg]])
    })
    it('fix atom should skip fix itself and near atom if near atom already have a vm bond', () => {
      const nrg = 5 * CFG.ATOM.NRG.onFix
      testRun([[0, fix(NO_DIR, R, L)], [1, mov(U, U)]], [[0, nrg]], [[0, fix(R, R, L)], [1, mov(U, U)]], [[0, nrg - CFG.ATOM.NRG.onFix]])
    })
    it('fix atom should not work if second atom does not exist', () => {
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
    it('fix atom should not work if no atoms around', () => {
      const offs = 0
      const energy = 10 * CFG.ATOM.NRG.fix
      const vmIdx = addVm(vms, offs, energy)
      put(w, offs, fix(2, 2, 2))
      CMDS[2](vms, get(w, offs), vmIdx)
      expect(get(w, offs)).toBe(fix(2, 2, 2))
      expect(get(w, offs + 1)).toBe(0)
      expect(checkVm(vms, offs, vmIdx, energy)).toBe(true)
    })
    it('fix atom should move VM correctly', () => {
      const offs = W
      const energy = 4 * CFG.ATOM.NRG.fix
      const vmIdx = addVm(vms, offs, energy)
      put(w, offs, fix(2, 2, 7))
      put(w, offs + 1, mov(NO_DIR, 2))
      CMDS[2](vms, get(w, offs), vmIdx)
      expect(checkVm(vms, offs + 1, vmIdx, energy - CFG.ATOM.NRG.fix)).toBe(true)
    })
  })

  describe('spl atom tests', () => {
    it('spl atom should split near first atoms', () => {
      const offs = W
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
    it('spl atom should split near second atom', () => {
      const offs = W
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
    it('spl atom should split itself and near atom', () => {
      const offs = W
      const energy = 10
      const vmIdx = addVm(vms, offs, energy)
      put(w, offs, spl(2, 2, 6))
      put(w, offs + 1, mov(NO_DIR, 2))
      CMDS[3](vms, get(w, offs), vmIdx)
      expect(get(w, offs)).toBe(spl(NO_DIR, 2, 6))
      expect(get(w, offs + 1)).toBe(mov(NO_DIR, 2))
      expect(checkVm(vms, offs + 1, vmIdx, energy + CFG.ATOM.NRG.onSpl - CFG.ATOM.NRG.spl)).toBe(true)
    })
    it('spl atom should split itself and near atom if only near atom has bond', () => {
      const offs = W
      const energy = 10
      const vmIdx = addVm(vms, offs, energy)
      put(w, offs, spl(NO_DIR, 2, 6))
      put(w, offs + 1, mov(6, 2))
      CMDS[3](vms, get(w, offs), vmIdx)
      expect(get(w, offs)).toBe(spl(NO_DIR, 2, 6))
      expect(get(w, offs + 1)).toBe(mov(NO_DIR, 2))
      expect(checkVm(vms, offs, vmIdx, energy + CFG.ATOM.NRG.onSpl)).toBe(true)
    })
    it('spl atom should not split near atoms if they have no bonds', () => {
      const offs = W
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
    it('spl atom should not split if no second atom', () => {
      const offs = W
      const energy = 10
      const vmIdx = addVm(vms, offs, energy)
      put(w, offs, spl(2, 2, 7))
      put(w, offs + 1, mov(6, 2))
      CMDS[3](vms, get(w, offs), vmIdx)
      expect(get(w, offs)).toBe(spl(2, 2, 7))
      expect(get(w, offs + 1)).toBe(mov(6, 2))
      expect(checkVm(vms, offs + 1, vmIdx, energy - CFG.ATOM.NRG.spl)).toBe(true)
    })
    it('spl atom should not split if no near atoms', () => {
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
    it('con atom should direct VM to then dir if near atom exists', () => {
      const offs = 0
      const energy = 10
      const vmIdx = addVm(vms, offs, energy)
      put(w, offs, con(2, 4, 2, NO_DIR))
      put(w, offs + 1, mov(NO_DIR, 2))
      put(w, W, spl(NO_DIR, 2, 0))
      CMDS[4](vms, get(w, offs), vmIdx)
      expect(get(w, offs)).toBe(con(2, 4, 2, NO_DIR))
      expect(get(w, offs + 1)).toBe(mov(NO_DIR, 2))
      expect(get(w, W)).toBe(spl(NO_DIR, 2, 0))
      expect(checkVm(vms, offs + W, vmIdx, energy - CFG.ATOM.NRG.con)).toBe(true)
    })
    it('con atom should direct VM to else dir if near atom is not exist', () => {
      const offs = 0
      const energy = 10
      const vmIdx = addVm(vms, offs, energy)
      put(w, offs, con(0, 4, 2, NO_DIR))
      put(w, offs + 1, mov(NO_DIR, 2))
      put(w, W, spl(NO_DIR, 2, 0))
      CMDS[4](vms, get(w, offs), vmIdx)
      expect(get(w, offs)).toBe(con(0, 4, 2, NO_DIR))
      expect(get(w, offs + 1)).toBe(mov(NO_DIR, 2))
      expect(get(w, W)).toBe(spl(NO_DIR, 2, 0))
      expect(checkVm(vms, offs + 1, vmIdx, energy - CFG.ATOM.NRG.con)).toBe(true)
    })
    it('con atom should not direct VM to else dir if else atom is not exist', () => {
      const offs = 0
      const energy = 10
      const vmIdx = addVm(vms, offs, energy)
      put(w, offs, con(2, 4, 2, NO_DIR))
      put(w, W, spl(NO_DIR, 2, 0))
      CMDS[4](vms, get(w, offs), vmIdx)
      expect(get(w, offs)).toBe(con(2, 4, 2, NO_DIR))
      expect(get(w, W)).toBe(spl(NO_DIR, 2, 0))
      expect(checkVm(vms, offs, vmIdx, energy)).toBe(true)
    })
    it('con atom should direct VM to then atom if then and else dirs are the same', () => {
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
    it('con atom should not direct VM to then atom if then atom does not exist', () => {
      const offs = 0
      const energy = 10
      const vmIdx = addVm(vms, offs, energy)
      put(w, offs, con(2, 2, 2, NO_DIR))
      CMDS[4](vms, get(w, offs), vmIdx)
      expect(get(w, offs)).toBe(con(2, 2, 2, NO_DIR))
      expect(get(w, offs + 1)).toBe(0)
      expect(checkVm(vms, offs, vmIdx, energy - CFG.ATOM.NRG.con)).toBe(true)
    })
    it('con atom should not direct VM to else dir if else atom is not exist', () => {
      const offs = 0
      const energy = 10
      const vmIdx = addVm(vms, offs, energy)
      put(w, offs, con(7, 4, 2, 4))
      put(w, offs + W, spl(NO_DIR, 1, 0))
      CMDS[4](vms, get(w, offs), vmIdx)
      expect(get(w, offs)).toBe(con(7, 4, 2, 4))
      expect(get(w, offs + W)).toBe(spl(NO_DIR, 1, 0))
      expect(checkVm(vms, offs, vmIdx, energy)).toBe(true)
    })
    it('con atom should direct VM to else dir if we compare different atoms', () => {
      const offs = 0
      const energy = 10
      const vmIdx = addVm(vms, offs, energy)
      put(w, offs, con(2, 2, 4, 4))
      put(w, offs + 1, spl(NO_DIR, 2, 0))
      put(w, W, fix(NO_DIR, 1, 0))
      CMDS[4](vms, get(w, offs), vmIdx)
      expect(get(w, offs)).toBe(con(2, 2, 4, 4))
      expect(get(w, offs + 1)).toBe(spl(NO_DIR, 2, 0))
      expect(get(w, offs + W)).toBe(fix(NO_DIR, 1, 0))
      expect(checkVm(vms, offs + W, vmIdx, energy - CFG.ATOM.NRG.con)).toBe(true)
    })
    it('con atom should not direct VM to else dir if no atom in VM dir', () => {
      const offs = 0
      const energy = 10
      const vmIdx = addVm(vms, offs, energy)
      put(w, offs, con(2, 2, 5, 4))
      put(w, offs + 1, spl(NO_DIR, 2, 0))
      put(w, offs + W, fix(NO_DIR, 1, 0))
      CMDS[4](vms, get(w, offs), vmIdx)
      expect(get(w, offs)).toBe(con(2, 2, 5, 4))
      expect(get(w, offs + 1)).toBe(spl(NO_DIR, 2, 0))
      expect(get(w, offs + W)).toBe(fix(NO_DIR, 1, 0))
      expect(checkVm(vms, offs, vmIdx, energy)).toBe(true)
    })
    it('con atom should not move VM to else or if dir if no atoms around', () => {
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
    it('job atom should create new VM and put it on near atom', () => {
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
    it('job atom should create new VM, but not move current vm to the next atom if not exist', () => {
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
    it('job atom should not create new VM, because there is no near atom', () => {
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
    it('rep atom should replicate bonds of near atom', () => {
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
    it('rep atom should not replicate bonds if no near atoms', () => {
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
    it('rep atom should replicate bonds of itself', () => {
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