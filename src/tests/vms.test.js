import CFG from '../cfg'
import './../global'
import { ATOM_TYPE_SHIFT, NO_DIR, UInt64Array, R, L, U, UR, D, DL, LU, RD, ATOM_MOV_DONE_MASK,
  ATOM_MOV_MOVING_MASK, ATOM_MOV_UNMASK } from '../shared'
import VMs, { CMDS, addVm } from '../vms'
import World, { destroy, get } from '../world'
import { mov, fix, spl, con, job, rep, mut } from './../atom'
import { testAtoms } from './utils'

// TODO: add mov-fix atoms moving horizontally and fix two or more atoms above
// TODO: add complex atoms tests. like more than 3,5,...

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
  const RPI = 1
  const DONE = ATOM_MOV_DONE_MASK
  const MOVING = ATOM_MOV_MOVING_MASK
  const UNMOVED = ATOM_MOV_UNMASK
  //
  // Set default config values
  //
  CFG.ATOM.seed = 1
  CFG.ATOM.stackBufSize = 128
  CFG.ATOM.percent = .15
  CFG.ATOM.moveTries = 5

  CFG.ATOM.NRG.mov = 1
  CFG.ATOM.NRG.fix = 1
  CFG.ATOM.NRG.spl = 1
  CFG.ATOM.NRG.con = 1
  CFG.ATOM.NRG.job = 1
  CFG.ATOM.NRG.rep = 1
  CFG.ATOM.NRG.mut = 1
  CFG.ATOM.NRG.onFix = 2
  CFG.ATOM.NRG.onSpl = 2
  W = CFG.WORLD.width = CFG.WORLD.height = 10
  CFG.rpi = RPI

  beforeEach(() => {
    const canvas = document.createElement("canvas")
    canvas.id = 'irma5'
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
    CFG.rpi = RPI
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
      expect(vmIdx).toBe(undefined)
    })
  })

  describe('mov atom tests', () => {
    const movNrg = CFG.ATOM.NRG.mov
    it('mov atom should not move without energy', () => {
      const offs = 0
      const m = mov(R, R)
      testRun([[offs, m]], [], [[offs, m]])
    })
    it('mov atom with 2 VMs on it should move twice longer', () => {
      const m = mov(R, R)
      const nrg = movNrg
      CFG.rpi = 2
      testRun([[0, m]], [[0, nrg], [0, nrg]], [[2, mov(R, R, DONE)]])
    })
    it('mov atom with 2 VMs on it should move twice longer & one VM should be removed if no energy', () => {
      const offs = 0
      const m = mov(R, R)
      const nrg = movNrg
      CFG.rpi = 2
      testRun([[offs, m]], [[0, nrg * 2], [0, nrg]], [[offs + 2, mov(R, R, UNMOVED)]], [[offs + 2, nrg]])
    })
    it('mov atom with 2 VMs on it should move twice longer & both VMs should be removed if no energy', () => {
      const offs = 0
      const m = mov(R, R)
      const nrg = movNrg
      CFG.rpi = 2
      testRun([[offs, m]], [[0, nrg], [0, nrg]], [[offs + 2, mov(R, R, DONE)]])
    })
    it('mov atom with 3 VMs on it should move 3 times longer & second VM should be removed if no energy', () => {
      const m = mov(R, D)
      const nrg = movNrg
      CFG.rpi = 2
      testRun([[0, m]], [[0, nrg * 2], [0, nrg], [0, nrg * 2]], [[3 * W, mov(R, D, UNMOVED)]], [[3 * W, nrg], [3 * W, nrg]])
    })
    it('2 mov atoms should stay on the same place if move directions are opposite', () => {
      const m = mov(RD, RD)
      const m1 = mov(LU, LU)
      const nrg = movNrg * 8
      testRun([[0, m], [W + 1, m1]], [[0, nrg], [W + 1, nrg]], [[0, mov(RD, RD, DONE)], [W + 1, mov(LU, LU, DONE)]], [[0, nrg - 2 * movNrg], [W + 1, nrg - 2 * movNrg]])
    })
    it('VM of mov atom should be moved to near atom and back if bonds are cyclic', () => {
      const m = mov(D, D)
      const s = spl(U, D, D)
      const nrg = movNrg * 4
      CFG.rpi = 3
      testRun([[0, m], [W, s]], [[0, nrg]], [[W, mov(D, D)], [2 * W, s]], [[W, nrg - movNrg * 2 - CFG.ATOM.NRG.spl]])
    })
    it('mov atom should move itself', () => {
      const offs = 0
      const nrg = movNrg
      const m = mov(R, R)
      testRun([[offs, m]], [[offs, nrg * 2]], [[offs + 1, mov(R, R, DONE)]], [[offs + 1, nrg]])
    })
    it('mov atom should move itself and vm should be removed if no energy', () => {
      const offs = 0
      const m = mov(R, R)
      testRun([[offs, m]], [[offs, movNrg]], [[offs + 1, mov(R, R, DONE)]])
    })
    it('mov atom should move itself and the atom on the way', () => {
      const offs = 0
      const nrg = movNrg
      const m = mov(R, R)
      const f = fix(R, U, R)
      testRun([[offs, m], [offs + 1, f]], [[offs, nrg * 3]], [[offs + 1, mov(R, R, DONE)], [offs + 2, f]], [[offs + 1, nrg]])
    })
    it('mov atom should move itself and update its vm bond and near atom vm bond', () => {
      const nrg = movNrg
      testRun([[W, mov(U, R)], [0, fix(D, U, R)]], [[W, nrg * 2]], [[0, fix(RD, U, R)], [W + 1, mov(LU, R, DONE)]], [[W + 1, nrg]])
    })
    it('mov atom should move itself and neighbour atom behind', () => {
      const energy = 3 * movNrg;
      const f = fix(U, U, U)
      testRun([[1, mov(L, R)], [0, f]], [[1, energy]], [[1, f], [2, mov(L, R, true)]], [[2, energy - 2 * movNrg]]);
    });
    it('mov atom can move outside of the world at the bottom', () => {
      const energy = 3 * movNrg;
      const offs = W * W - W
      testRun([[offs, mov(NO_DIR, D)]], [[offs, energy]], [[0, mov(NO_DIR, D, true)]], [[0, energy - movNrg]]);
    });
    it('mov atom can move outside of the world at the right', () => {
      const energy = 3 * movNrg;
      const offs = W - 1
      testRun([[offs, mov(NO_DIR, R)]], [[offs, energy]], [[W, mov(NO_DIR, R, true)]], [[W, energy - movNrg]]);
    });
    it('mov atom can move outside of the world at the left', () => {
      const energy = 3 * movNrg;
      testRun([[0, mov(NO_DIR, L)]], [[0, energy]], [[W * W - 1, mov(NO_DIR, L, true)]], [[W * W - 1, energy - movNrg]]);
    });
    it('mov atom can move outside of the world at the right-bottom', () => {
      const nrg = 3 * movNrg;
      testRun([[W * W - 1, mov(NO_DIR, RD)]], [[W * W - 1, nrg]], [[W, mov(NO_DIR, RD, true)]], [[W, nrg - movNrg]]);
    });
    it('mov atom should move near atom outside of the world at the right-bottom', () => {
      const nrg = 3 * movNrg;
      const m = mov(NO_DIR, RD)
      const s = spl(NO_DIR, U, U)
      testRun([[W * W - W - 2, m], [W * W - 1, s]], [[W * W - W - 2, nrg]], [[W * W - 1, mov(NO_DIR, RD, true)], [W, s]], [[W * W - 1, nrg - movNrg * 2]]);
    });
    it('mov atom should move itself and neighbour atom behind and one more', () => {
      const nrg = 4 * movNrg;
      const m = mov(R, R)
      const f1 = fix(U, U, U)
      const f2 = fix(U, D, D)
      testRun([[0, m], [1, f1], [W, f2]], [[0, nrg]], [[1, mov(R, R, true)], [2, f1], [W, fix(UR, D, D)]], [[1, nrg - movNrg * 2]]);
    });
    it('move two mov atoms 2 times', () => {
      const nrg = 4 * movNrg;
      const m = mov(LU, RD)
      const m1 = mov(RD, D)
      CFG.rpi = 3
      testRun([[W + 1, m], [0, m1]], [[W + 1, nrg]], [[2 * W + 2, mov(L, RD)], [2 * W + 1, mov(R, D, true)]], [[2 * W + 1, nrg - movNrg * 3]]);
    });
    it('move three atoms together', () => {
      const nrg = 4 * movNrg;
      const m = mov(D, D)
      const f1 = fix(RD, L, L)
      const f2 = fix(DL, L, L)
      testRun([[W + 1, m], [0, f1], [2, f2]], [[W + 1, nrg]], [[2 * W + 1, mov(D, D, true)], [W, f1], [W + 2, f2]], [[2 * W + 1, nrg - movNrg * 3]]);
    });
    it('move 3 atoms together, before the mov atom', () => {
      const nrg = 4 * movNrg;
      const m = mov(NO_DIR, R)
      const f1 = fix(NO_DIR, R, R)
      const f2 = fix(NO_DIR, R, R)
      const f3 = fix(NO_DIR, R, R)
      CFG.rpi = 2
      testRun([[0, m], [1, f1], [2, f2], [3, f3]], [[0, nrg]], [[1, mov(NO_DIR, R, DONE)], [2, f1], [3, f2], [4, f3]]);
    });
    it('mov atom should update if atom bonds correctly', () => {
      const nrg = 3 * movNrg
      const m = mov(U, R)
      const c = con(D, D, D, NO_DIR)
      testRun([[W, m], [0, c]], [[W, nrg]], [[0, con(D, RD, RD, NO_DIR)], [W + 1, mov(LU, R, DONE)]], [[W + 1, nrg - movNrg]])
    })
    it('mov atom should move VM correctly', () => {
      const nrg = 4 * movNrg
      const m = mov(R, R)
      const f = fix(R, U, R)
      testRun([[0, m], [1, f]], [[0, nrg]], [[1, mov(R, R, DONE)], [2, f]], [[1, nrg - movNrg * 2]])
    })
    it('two near mov atoms should move on the same place after two ticks', () => {
      const nrg = 6 * movNrg
      const m = mov(R, R)
      const m1 = mov(L, L)
      CFG.rpi = 3
      testRun([[0, m], [1, m1]], [[0, nrg]], [[0, m], [1, mov(L, L, DONE)]], [[1, nrg - movNrg * 4]])
    })
    it('after move mov atom should keep all near and it\'s own bonds consistent', () => {
      const nrg = 5 * movNrg
      testRun([[W, fix(NO_DIR, U, U)], [W + 1, mov(DL, U)], [2 * W, mov(LU, U)]], [[W + 1, nrg]], [[0, fix(NO_DIR, U, U)], [1, mov(DL, U, DONE)], [W, mov(LU, U)]], [[1, nrg - movNrg * 3]])
    })
    it('mov atom should move itself and job atom together & new VM should be created', () => {
      const nrg = 8 * movNrg
      const m = mov(R, L)
      const j = job(NO_DIR, L)
      CFG.rpi = 3
      testRun([[3, m], [4, j]], [[3, nrg]], [[1, mov(R, L, DONE)], [2, j]], [[2, movNrg * 2], [1, movNrg]])
    })
    it('mov atom should move itself and spl atom, but spl atom should split them later', () => {
      const nrg = 8 * movNrg
      const m = mov(R, L)
      const s = spl(NO_DIR, L, R)
      const splNrg = CFG.ATOM.NRG.spl
      const onSplNrg = CFG.ATOM.NRG.onSpl
      CFG.rpi = 3
      testRun([[3, m], [4, s]], [[3, nrg]], [[2, mov(NO_DIR, L)], [3, s]], [[3, nrg - movNrg * 2 - splNrg + onSplNrg]])
    })
  })

  describe('fix atom tests', () => {
    const fixNrg = CFG.ATOM.NRG.fix
    const onFixNrg = CFG.ATOM.NRG.onFix
    it('fix atom should fix near atoms together if they have no bonds', () => {
      const nrg = 10 * fixNrg
      const f = fix(D, R, LU)
      const m = mov(NO_DIR, U)
      const m1 = mov(NO_DIR, R)
      testRun([[W, f], [0, m], [W + 1, m1]], [[W, nrg]], [[W, f], [W + 1, mov(LU, R)], [0, m]], [[W, nrg - onFixNrg - fixNrg]])
    })
    it('fix atom should fix near atoms together, but should not if they already joined', () => {
      const nrg = 6 * onFixNrg
      const f = fix(D, R, LU)
      const m = mov(R, R)
      testRun([[W, f], [0, mov(NO_DIR, U)], [W + 1, m]], [[W, nrg]], [[W, f], [W + 1, m], [0, mov(RD, U)]], [[W, nrg - onFixNrg - fixNrg]])
    })
    it('fix atom should fix near atoms together if they have only 1 bond', () => {
      const nrg = 6 * onFixNrg
      const f = fix(D, R, LU)
      const m = mov(R, R)
      testRun([[W, f], [0, mov(NO_DIR, U)], [W + 1, m]], [[W, nrg]], [[W, f], [W + 1, m], [0, mov(RD, U)]], [[W, nrg - onFixNrg - fixNrg]])
    })
    it('fix atom should not fix near atoms if they already have bonds', () => {
      const nrg = 4 * fixNrg
      const f = fix(D, R, LU)
      const m1 = mov(U, U)
      const m2 = mov(R, R)
      testRun([[W, f], [0, m1], [W + 1, m2]], [[W, nrg]], [[W, f], [0, m1], [W + 1, m2]], [[W, nrg - fixNrg]])
    })
    it('fix atom should fix itself and near atom', () => {
      const f = fix(NO_DIR, R, L)
      const nrg = onFixNrg
      testRun([[0, f], [1, mov(NO_DIR, U)]], [[0, 5 * nrg]], [[0, f], [1, mov(L, U)]], [[0, 5 * nrg - nrg - fixNrg]])
    })
    it('fix atom should skip fix itself and near atom if near atom already have a vm bond', () => {
      const nrg = 5 * onFixNrg
      testRun([[0, fix(NO_DIR, R, L)], [1, mov(U, U)]], [[0, nrg]], [[0, fix(R, R, L)], [1, mov(U, U)]], [[1, nrg - onFixNrg - fixNrg]])
    })
    it('fix atom should not work if second atom does not exist', () => {
      const nrg = 10 * fixNrg
      const f = fix(R, R, R)
      const m = mov(NO_DIR, U)
      testRun([[0, f], [1, m]], [[0, nrg]], [[0, f], [1, m]], [[1, nrg - fixNrg]])
    })
    it('fix atom should not work if no atoms around', () => {
      const nrg = 10 * fixNrg
      const f = fix(R, R, R)
      testRun([[0, f]], [[0, nrg]], [[0, f]], [[0, nrg - fixNrg]])
    })
    it('fix atom should move VM correctly', () => {
      const nrg = 4 * fixNrg
      const f = fix(R, R, LU)
      const m = mov(NO_DIR, R)
      testRun([[W, f], [W + 1, m]], [[W, nrg]], [[W, f], [W + 1, m]], [[W + 1, nrg - fixNrg]])
    })
    it('two fix atoms should fix each other', () => {
      const nrg = 13 * fixNrg
      const f1 = fix(NO_DIR, R, L)
      const f2 = fix(NO_DIR, L, R)
      CFG.rpi = 2
      testRun([[0, f1], [1, f2]], [[0, nrg]], [[0, fix(R, R, L)], [1, fix(L, L, R)]], [[1, nrg - fixNrg * 2 - onFixNrg * 2]])
    })
  })

  describe('spl atom tests', () => {
    const splNrg = CFG.ATOM.NRG.spl
    const onSplNrg = CFG.ATOM.NRG.onSpl
    it('spl atom should split near first atoms', () => {
      const energy = 10;
      const s = spl(2, 2, 7)
      const m = mov(4, 2)
      const m1 = mov(6, 2)
      testRun([[W, s], [0, m], [W + 1, m1]], [[W, energy]], [[W, s], [0, m], [W + 1, m1]], [[W + 1, energy - splNrg]])
    })
    it('spl atom should split near second atom', () => {
      const energy = 10;
      const s = spl(R, R, LU)
      const m = mov(RD, R)
      const m1 = mov(NO_DIR, R)
      testRun([[W, s], [0, m], [W + 1, m1]], [[W, energy]], [[W, s], [0, m1], [W + 1, m1]], [[W + 1, energy + onSplNrg - splNrg]])
    })
    it('spl atom should split itself and near atom', () => {
      const energy = 10;
      testRun([[W, spl(2, 2, 6)], [W + 1, mov(NO_DIR, 2)]], [[W, energy]], [[W, spl(NO_DIR, 2, 6)], [W + 1, mov(NO_DIR, 2)]], [[W, energy + onSplNrg - splNrg]])
    })
    it('spl atom should split itself and near atom if only near atom has bond', () => {
      const nrg = 10;
      const s = spl(NO_DIR, R, L)
      const m = mov(L, R)
      testRun([[W, s], [W + 1, m]], [[W, nrg]], [[W, s], [W + 1, mov(NO_DIR, R)]], [[W, nrg + onSplNrg - splNrg]])
    })
    it('spl atom should not split near atoms if they have no bonds', () => {
      const nrg = 10;
      const s = spl(R, R, LU)
      const m = mov(NO_DIR, R)
      testRun([[W, s], [0, m], [W + 1, m]], [[W, nrg]], [[W, s], [0, m], [W + 1, m]], [[W + 1, nrg - splNrg]])
    })
    it('spl atom should not split if no second atom', () => {
      const nrg = 10;
      const s = spl(R, R, LU)
      const m = mov(L, R)
      testRun([[W, s], [W + 1, m]], [[W, nrg]], [[W, s], [W + 1, m]], [[W + 1, nrg - splNrg]])
    })
    it('spl atom should not split if no near atoms', () => {
      const nrg = 10;
      const s = spl(R, R, LU);
      testRun([[0, s]], [[0, nrg]], [[0, s]], [[0, nrg - splNrg]])
    })
  })

  describe('con atom tests', () => {
    const conNrg = CFG.ATOM.NRG.con
    it('con atom should direct VM to else dir if near atom is not exist', () => {
      const nrg = 10;
      const c = con(R, D, R, NO_DIR);
      const m = mov(NO_DIR, R);
      const s = spl(NO_DIR, R, U);
      testRun([[0, c], [1, m], [W, s]], [[0, nrg]], [[0, c], [1, m], [W, s]], [[W, nrg - conNrg]])
    })
    it('con atom should direct VM to else dir if near atom is not exist', () => {
      const nrg = 10;
      const c = con(U, D, R, NO_DIR);
      const m = mov(NO_DIR, R);
      const s = spl(NO_DIR, R, U);
      testRun([[0, c], [1, m], [W, s]], [[0, nrg]], [[0, c], [1, m], [W, s]], [[1, nrg - conNrg]])
    })
    it('con atom should not direct VM to else dir if else atom is not exist', () => {
      const nrg = 10;
      const c = con(R, D, R, NO_DIR);
      const s = spl(NO_DIR, R, U);
      testRun([[0, c], [W, s]], [[0, nrg]], [[0, c], [W, s]], [[0, nrg - conNrg]])
    })
    it('con atom should direct VM to then atom if then and else dirs are the same', () => {
      const nrg = 10;
      const c = con(R, R, R, NO_DIR);
      const s = spl(NO_DIR, R, U);
      testRun([[0, c], [1, s]], [[0, nrg]], [[0, c], [1, s]], [[1, nrg - conNrg]])
    })
    it('con atom should not direct VM to then atom if then atom does not exist', () => {
      const nrg = 10;
      const c = con(R, R, R, NO_DIR);
      testRun([[0, c]], [[0, nrg]], [[0, c]], [[0, nrg - conNrg]])
    })
    it('con atom should not direct VM to else dir if else atom does not exist', () => {
      const nrg = 10;
      const c = con(LU, D, R, D);
      const s = spl(NO_DIR, UR, U);
      testRun([[0, c], [W, s]], [[0, nrg]], [[0, c], [W, s]], [[0, nrg - conNrg]])
    })
    it('con atom should direct VM to else dir if we compare different atoms', () => {
      const nrg = 10
      const c = con(R, R, D, D);
      const s = spl(NO_DIR, R, U);
      const f = fix(NO_DIR, UR, U);
      testRun([[0, c], [1, s], [W, f]], [[0, nrg]], [[0, c], [1, s], [W, f]], [[W, nrg - conNrg]])
    })
    it('con atom should not direct VM to else dir if no atom in VM dir', () => {
      const nrg = 10
      const c = con(R, R, DL, D)
      const s = spl(NO_DIR, R, U)
      const f = fix(NO_DIR, UR, U)
      testRun([[0, c], [1, s], [W, f]], [[0, nrg]], [[0, c], [1, s], [W, f]], [[0, nrg - conNrg]])
    })
    it('con atom should not move VM to else or if dir if no atoms around', () => {
      const nrg = 10
      const c = con(R, R, DL, D)
      testRun([[0, c]], [[0, nrg]], [[0, c]], [[0, nrg - conNrg]])
    })
  })

  describe('job atom tests', () => {
    const jobNrg = CFG.ATOM.NRG.job
    it('job atom should create new VM and put it on near atom', () => {
      const nrg = 10
      const s = spl(NO_DIR, R, U)
      const j = job(R, R)
      testRun([[0, j], [1, s]], [[0, nrg]], [[0, j], [1, s]], [[1, nrg - Math.floor(nrg / 2) - jobNrg], [1, nrg - Math.floor(nrg / 2) - CFG.ATOM.NRG.spl]])
    })
    it('job atom should create new VM, but not move current vm to the next atom if not exist', () => {
      const nrg = 10 * jobNrg
      const j = job(U, R)
      const s = spl(NO_DIR, R, U)
      testRun([[0, j], [1, s]], [[0, nrg]], [[0, j], [1, s]], [[0, nrg / 2 - jobNrg], [1, nrg / 2 - CFG.ATOM.NRG.spl]])
    })
    it('job atom should not create new VM, because there is no near atom', () => {
      const nrg = 10 * jobNrg
      testRun([[0, job(R, R)]], [[0, nrg]], [[0, job(R, R)]], [[0, nrg - jobNrg]])
    })
  })

  describe('rep atom tests', () => {
    const repNrg = CFG.ATOM.NRG.rep
    it('rep atom should replicate bonds of near atom', () => {
      const r = rep(R, R, R)
      const s = spl(RD, D, DL)
      testRun([[0, r], [1, s], [2, spl(D, DL, L)]], [[0, 10]], [[0, r], [1, s], [2, s]], [[1, 10 - repNrg]])
    });
    it('rep atom should not replicate bonds if no near atoms', () => {
      testRun([[0, rep(R, R, R)]], [[0, 10]], [[0, rep(R, R, R)], [1, 0], [2, 0]], [[0, 10 - repNrg]]);
    });
    it('rep atom should replicate bonds of itself', () => {
      const nrg = 10
      const r = rep(RD, D, DL)
      testRun([[0, rep(R, R, L)], [1, r]], [[0, nrg]], [[0, r], [1, r]], [[1, nrg - repNrg]])
    })
  })

  describe('mut atom tests', () => {
    const mutNrg = CFG.ATOM.NRG.mut
    it('mut atom should mutate near spl atom', () => {
      const nrg = 10 * CFG.ATOM.NRG.mut;
      const mu  = mut(R, R, 0, L); // L === 0b110
      const s   = spl(R, R, R);
      testRun([[0, mu], [1, s]], [[0, nrg]], [[0, mu], [1, spl(R, L, R)]], [[1, nrg - mutNrg]])
    })
    it('mut atom should mutate near mov atom', () => {
      const nrg = 10 * CFG.ATOM.NRG.mut;
      const mu  = mut(R, RD, 0, LU); // LU === 0b111
      const m   = mov(R, RD);
      testRun([[0, mu], [W + 1, m]], [[0, nrg]], [[0, mu], [W + 1, mov(R, LU)]], [[0, nrg - mutNrg]])
    })
    it('mut atom should mutate near con atom', () => {
      const nrg = 10 * CFG.ATOM.NRG.mut;
      const mu  = mut(R, D, 3, LU + 1); // LU === 0b111
      const c   = con(U, R, D, L);
      testRun([[0, mu], [W, c]], [[0, nrg]], [[0, mu], [W, con(U, R, D, LU)]], [[0, nrg - mutNrg]])
    })
    it('mut atom should mutate near mut atom', () => {
      const nrg = 10 * CFG.ATOM.NRG.mut;
      const mu  = mut(R, D, 1, 0b11);
      const mu1 = mut(R, R, 0, 0);
      testRun([[0, mu], [W, mu1]], [[0, nrg]], [[0, mu], [W, mut(R, R, 0b11, 0)]], [[0, nrg - mutNrg]])
    })
    it('mut atom should mutate near mut atom in value section', () => {
      const nrg = 10 * CFG.ATOM.NRG.mut;
      const mu  = mut(R, D, 2, 0b1111);
      const mu1 = mut(R, R, 0, 0);
      testRun([[0, mu], [W, mu1]], [[0, nrg]], [[0, mu], [W, mut(R, R, 0, 0b1111)]], [[0, nrg - mutNrg]])
    })
    it('mut atom should mutate near atom by 0 value', () => {
      const nrg = 10 * CFG.ATOM.NRG.mut;
      const mu  = mut(R, R, 1, U); // U === 0b000
      const s   = spl(R, R, R);
      testRun([[0, mu], [1, s]], [[0, nrg]], [[0, mu], [1, spl(R, R, U)]], [[1, nrg - mutNrg]])
    })
    it('mut atom should not mutate near atom if direction is wrong', () => {
      const nrg = 10 * CFG.ATOM.NRG.mut;
      const mu  = mut(R, U, 1, U); // U === 0b000
      const s   = spl(R, R, R);
      testRun([[0, mu], [1, s]], [[0, nrg]], [[0, mu], [1, s]], [[1, nrg]])
    })
    it('mut atom should not mutate if no near atom', () => {
      const nrg = 10 * CFG.ATOM.NRG.mut;
      const mu  = mut(R, U, 1, L); // L === 0b110
      testRun([[0, mu]], [[0, nrg]], [[0, mu]], [[0, nrg]])
    })
  })
})