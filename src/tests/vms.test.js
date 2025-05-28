import CFG from '../cfg'
import { ATOM_TYPE_SHIFT, NO_DIR, UInt64Array, R, L, U, UR, D, DL, LU, RD, ATOM_FIX } from '../shared'
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
    canvas.getContext = () => { return {getImageData: (x,y,w,h) => { return {data: new Uint8ClampedArray(w*h*4)}}, putImageData: () => {}}}
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
      const energy = 3 * CFG.ATOM.NRG.mov;
      testRun([[1, mov(L, R)], [0, fix(U, U, U)]], [[1, energy]], [[1, fix(U, U, U)], [2, mov(L, R)]], [[1, energy - 2 * CFG.ATOM.NRG.mov]]);
    });
    it('mov atom can move outside of the world at the bottom', () => {
      const energy = 3 * CFG.ATOM.NRG.mov;
      const offs = W * W - W
      testRun([[offs, mov(NO_DIR, D)]], [[offs, energy]], [[0, mov(NO_DIR, D)]], [[0, energy - CFG.ATOM.NRG.mov]]);
    });
    it('mov atom can move outside of the world at the right', () => {
      const energy = 3 * CFG.ATOM.NRG.mov;
      const offs = W - 1
      testRun([[offs, mov(NO_DIR, R)]], [[offs, energy]], [[W, mov(NO_DIR, R)]], [[W, energy - CFG.ATOM.NRG.mov]]);
    });
    it('mov atom can move outside of the world at the left', () => {
      const energy = 3 * CFG.ATOM.NRG.mov;
      testRun([[0, mov(NO_DIR, L)]], [[0, energy]], [[W * W - 1, mov(NO_DIR, L)]], [[W * W - 1, energy - CFG.ATOM.NRG.mov]]);
    });
    it('mov atom can move outside of the world at the right-bottom', () => {
      const nrg = 3 * CFG.ATOM.NRG.mov;
      testRun([[W * W - 1, mov(NO_DIR, RD)]], [[W * W - 1, nrg]], [[W, mov(NO_DIR, RD)]], [[W, nrg - CFG.ATOM.NRG.mov]]);
    });
    it('mov atom should move near atom outside of the world at the right-bottom', () => {
      const nrg = 3 * CFG.ATOM.NRG.mov;
      const m = mov(NO_DIR, RD)
      const s = spl(NO_DIR, U, U)
      testRun([[W * W - W - 2, m], [W * W - 1, s]], [[W * W - W - 2, nrg]], [[W * W - 1, m], [W, s]], [[W * W - 1, nrg - CFG.ATOM.NRG.mov * 2]]);
    });
    it('mov atom should move itself and neighbour atom behind and one more', () => {
      const nrg = 4 * CFG.ATOM.NRG.mov;
      const m = mov(R, R)
      const f1 = fix(U, U, U)
      const f2 = fix(U, D, D)
      testRun([[0, m], [1, f1], [W, f2]], [[0, nrg]], [[1, m], [2, f1], [W, fix(UR, D, D)]], [[2, nrg - CFG.ATOM.NRG.mov * 2]]);
    });
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
      testRun([[0, fix(NO_DIR, R, L)], [1, mov(U, U)]], [[0, nrg]], [[0, fix(R, R, L)], [1, mov(U, U)]], [[1, nrg - CFG.ATOM.NRG.onFix - CFG.ATOM.NRG.fix]])
    })
    it('fix atom should not work if second atom does not exist', () => {
      const nrg = 10 * CFG.ATOM.NRG.fix
      const f = fix(R, R, R)
      const m = mov(NO_DIR, U)
      testRun([[0, f], [1, m]], [[0, nrg]], [[0, f], [1, m]], [[1, nrg - CFG.ATOM.NRG.fix]])
    })
    it('fix atom should not work if no atoms around', () => {
      const nrg = 10 * CFG.ATOM.NRG.fix
      const f = fix(R, R, R)
      testRun([[0, f]], [[0, nrg]], [[0, f]], [[0, nrg - CFG.ATOM.NRG.fix]])
    })
    it('fix atom should move VM correctly', () => {
      const nrg = 4 * CFG.ATOM.NRG.fix
      const f = fix(R, R, LU)
      const m = mov(NO_DIR, R)
      testRun([[W, f], [W + 1, m]], [[W, nrg]], [[W, f], [W + 1, m]], [[W + 1, nrg - CFG.ATOM.NRG.fix]])
    })
  })

  describe('spl atom tests', () => {
    it('spl atom should split near first atoms', () => {
      const energy = 10;
      testRun(
        [[W, spl(2, 2, 7)], [0, mov(4, 2)], [W + 1, mov(6, 2)]],
        [[W, energy]],
        [[W, spl(2, 2, 7)], [0, mov(4, 2)], [W + 1, mov(6, 2)]],
        [[W + 1, energy - CFG.ATOM.NRG.spl]]
      )
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
      const energy = 10;
      testRun([[W, spl(2, 2, 6)], [W + 1, mov(NO_DIR, 2)]], [[W, energy]], [[W, spl(NO_DIR, 2, 6)], [W + 1, mov(NO_DIR, 2)]], [[W, energy + CFG.ATOM.NRG.onSpl]])
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
      const nrg = 10;
      const c = con(R, D, R, NO_DIR);
      const s = spl(NO_DIR, R, U);
      testRun([[0, c], [W, s]], [[0, nrg]], [[0, c], [W, s]], [[0, nrg - CFG.ATOM.NRG.con]])
    })
    it('con atom should direct VM to then atom if then and else dirs are the same', () => {
      const nrg = 10;
      const c = con(R, R, R, NO_DIR);
      const s = spl(NO_DIR, R, U);
      testRun([[0, c], [1, s]], [[0, nrg]], [[0, c], [1, s]], [[1, nrg - CFG.ATOM.NRG.con]])
    })
    it('con atom should not direct VM to then atom if then atom does not exist', () => {
      const nrg = 10;
      const c = con(R, R, R, NO_DIR);
      testRun([[0, c]], [[0, nrg]], [[0, c]], [[0, nrg - CFG.ATOM.NRG.con]])
    })
    it('con atom should not direct VM to else dir if else atom does not exist', () => {
      const nrg = 10;
      const c = con(LU, D, R, D);
      const s = spl(NO_DIR, UR, U);
      testRun([[0, c], [W, s]], [[0, nrg]], [[0, c], [W, s]], [[0, nrg]])
    })
    it('con atom should direct VM to else dir if we compare different atoms', () => {
      const nrg = 10
      const c = con(R, R, D, D);
      const s = spl(NO_DIR, R, U);
      const f = fix(NO_DIR, UR, U);
      testRun([[0, c], [1, s], [W, f]], [[0, nrg]], [[0, c], [1, s], [W, f]], [[W, nrg - CFG.ATOM.NRG.con]])
    })
    it('con atom should not direct VM to else dir if no atom in VM dir', () => {
      const nrg = 10
      const c = con(R, R, DL, D)
      const s = spl(NO_DIR, R, U)
      const f = fix(NO_DIR, UR, U)
      testRun([[0, c], [1, s], [W, f]], [[0, nrg]], [[0, c], [1, s], [W, f]], [[0, nrg]])
    })
    it('con atom should not move VM to else or if dir if no atoms around', () => {
      const nrg = 10
      const c = con(R, R, DL, D)
      testRun([[0, c]], [[0, nrg]], [[0, c]], [[0, nrg]])
    })
  })

  describe('job atom tests', () => {
    it('job atom should create new VM and put it on near atom', () => {
      const nrg = 10
      const s = spl(NO_DIR, R, U)
      const j = job(R, R)
      testRun([[0, j], [1, s]], [[0, nrg]], [[0, j], [1, s]], [[1, nrg - Math.floor(nrg / 2) - CFG.ATOM.NRG.job], [1, nrg - Math.floor(nrg / 2)]])
    })
    it('job atom should create new VM, but not move current vm to the next atom if not exist', () => {
      const nrg = 10 * CFG.ATOM.NRG.job
      const j = job(U, R)
      const s = spl(NO_DIR, R, U)
      testRun([[0, j], [1, s]], [[0, nrg]], [[0, j], [1, s]], [[0, nrg / 2 - CFG.ATOM.NRG.job], [1, nrg / 2]])
    })
    it('job atom should not create new VM, because there is no near atom', () => {
      const nrg = 10 * CFG.ATOM.NRG.job
      testRun([[0, job(R, R)]], [[0, nrg]], [[0, job(R, R)]], [[0, nrg - CFG.ATOM.NRG.job]])
    })
  })

  describe('rep atom tests', () => {
    it('rep atom should replicate bonds of near atom', () => {
      const r = rep(R, R, R)
      const s = spl(RD, D, DL)
      testRun([[0, r], [1, s], [2, spl(D, DL, L)]], [[0, 10]], [[0, r], [1, s], [2, s]], [[1, 10 - CFG.ATOM.NRG.rep]])
    });
    it('rep atom should not replicate bonds if no near atoms', () => {
      testRun([[0, rep(R, R, R)]], [[0, 10]], [[0, rep(R, R, R)], [1, 0], [2, 0]], [[0, 10]]);
    });
    it('rep atom should replicate bonds of itself', () => {
      const nrg = 10
      const r = rep(RD, D, DL)
      testRun([[0, rep(R, R, L)], [1, r]], [[0, nrg]], [[0, r], [1, r]], [[1, nrg - CFG.ATOM.NRG.rep]])
    })
  })
})