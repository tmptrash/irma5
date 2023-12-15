import CFG from './cfg.js'
import { VM_VMS_MASK,  NO_DIR, ATOM_CON, MOV_BREAK_MASK, MOV_BREAK_UNMASK,
  DMA, DNA, DMD, DIR_REV } from './shared.js'
import { get, move, put } from './world.js'
import { vmDir, b1Dir, b2Dir, b3Dir, ifDir, thenDir, elseDir,
  setVmDir, setThenDir, setElseDir, offs, toOffs, type } from './atom.js'

//
// Left bit of every number is a flag, which means - "possible to break". It means
// that we may break mov command running and continue next time. Break is only possible,
// if all previous flags are equal to 1
//
const STACK = new Uint32Array(CFG.ATOM.stackBufSize)
let stackIdx = 0
let MOVED = {}

export const CMDS = [nop, mov, fix, spl, con, job, rep]

export default function VMs(w, vmOffs, last = null) {
  const vms = {
    offs: [],
    last: 0,
    map: {},
    w
  }
  set(vms, vmOffs, last)
  return vms
}

export function set(vms, offs, last) {
  vms.offs = offs
  const l = vms.last = last || offs.length
  const map = vms.map
  for (let i = 0; i < l; i++) map[toOffs(offs[i])] = i
}

export function vm(offs, amount) {
  return (BigInt(offs) << 32n) | BigInt(amount)
}

export function tick(vm) {
  for (let round = 0, roundl = CFG.rpi; round < roundl; round++)
    for (let vmIdx = 0, l = vm.offs.length; vmIdx < l; vmIdx++) {
      const a = get(vm.w, toOffs(vm.offs[vmIdx]))
      CMDS[type(a)](vm, a, vmIdx)
    }
}

function nop() {}

function mov(vms, a, vmIdx) {
  STACK[stackIdx++] = toOffs(vms.offs[vmIdx])           // put mov atom offs into the stack
  const atomOffs = fromStack()                          // offset of moved atom
  const movDir = b1Dir(a)                               // mov direction
  const w = vms.w
  while (stackIdx > 0) {                                // go for all items in stack
    const aOffs = fromStack()                           // last offs in stack (not pop)
    if (MOVED[aOffs] || !get(w, aOffs)) { stackIdx--; continue } // this offs was already moved or no atom
    const dstOffs = offs(aOffs, movDir)                 // dest offset we are goint to move
    if (get(w, dstOffs)) {                              // dest place is not free
      STACK[stackIdx++] = dstOffs | MOV_BREAK_MASK      // MOV_BREAK_MASK means "we may interrupt mov here"
      continue
    }
    const oldA = a
    stackIdx--                                          // pop atom offs from stack
    move(w, aOffs, dstOffs)                             // dest place is free, move atom
    MOVED[dstOffs] = true                               // add moved atom to moved store
    if (type(a) === ATOM_CON) {                         // update bonds of if atom. we don't neet to update spl, fix
      a = rebond(w, a, aOffs, movDir, thenDir, setThenDir) // update then bond of moved atom
      a = rebond(w, a, aOffs, movDir, elseDir, setElseDir) // update else bond of moved atom
    }
    a = rebond(w, a, aOffs, movDir, vmDir, setVmDir)    // update vm bond of moved atom
    rebond2(w, aOffs, movDir)                           // update near atoms bonds
    oldA !== a && put(w, dstOffs, a)                    // put updated atom back to the world
  }
  vmIdx = moveVm(vms, a, vmIdx, atomOffs, movDir)       // update VM pos after mov atom was moved
  const dstOffs = offs(atomOffs, movDir)
  vmIdx !== undefined && moveVm(vms, a, vmIdx, dstOffs) // move VM to the next atom
  MOVED = {}                                            // reset moved and stack sets
  stackIdx = 0
}

function fix(vms, a, vmIdx) {
  const w       = vms.w
  const vmOffs  = toOffs(vms.offs[vmIdx])
  const o1      = offs(vmOffs, b1Dir(a))
  let a1        = get(w, o1)
  if (a1 === 0) { moveVm(vms, a, vmIdx, vmOffs); return }
  const b2d     = b2Dir(a)
  const o2      = offs(o1, b2d)
  let a2        = get(w, o2)
  if (a2 === 0) { moveVm(vms, a, vmIdx, vmOffs); return }
  if (vmDir(a1) === NO_DIR && type(a1) !== ATOM_CON) {
    a1 = setVmDir(a1, b2d)
    put(w, o1, a1)
  } else if (vmDir(a2) === NO_DIR && type(a2) !== ATOM_CON) {
    a2 = setVmDir(a2, DIR_REV[b2d])
    put(w, o2, a2)
  }
  // move vm to the next atom offset
  moveVm(vms, a, vmIdx, vmOffs)
}

function spl(vms, a, vmIdx) {
  const w       = vms.w
  const vmOffs  = toOffs(vms.offs[vmIdx])
  const o1      = offs(vmOffs, b1Dir(a))
  let a1        = get(w, o1)
  if (a1 === 0) { moveVm(vms, a, vmIdx, vmOffs); return }
  const o2      = offs(o1, b2Dir(a))
  let a2        = get(w, o2)
  if (a2 === 0) { moveVm(vms, a, vmIdx, vmOffs); return }
  if (vmDir(a1) !== NO_DIR && type(a1) !== ATOM_CON) {
    a1 = setVmDir(a1, NO_DIR)
    put(w, o1, a1)
  } else if (vmDir(a2) !== NO_DIR && type(a2) !== ATOM_CON) {
    a2 = setVmDir(a2, NO_DIR)
    put(w, o2, a2)
  }
  // move vm to the next atom offset
  moveVm(vms, a, vmIdx, vmOffs)
}

function con(vms, a, vmIdx) {
  const dir3 = b3Dir(a)
  const vmOffs = toOffs(vms.offs[vmIdx])
  const ifOffs = offs(vmOffs, ifDir(a))
  // if then else mode
  if (dir3 == NO_DIR) {
    const atom = get(vms.w, ifOffs)
    moveVm(vms, a, vmIdx, vmOffs, atom ? thenDir(a) : elseDir(a))
    return
  }
  // atoms compare mode
  const similar = type(get(vms.w, ifOffs)) === type(get(vms.w, offs(vmOffs, dir3)))
  moveVm(vms, a, vmIdx, vmOffs, similar ? thenDir(a) : elseDir(a))
}

function job(vms, a, vmIdx) {
  const vmOffs    = toOffs(vms.offs[vmIdx])
  const newVmOffs = offs(vmOffs, b1Dir(a))
  if (get(vms.w, newVmOffs)) {
    const offsIdx = findIdx(vms, newVmOffs)
    offsIdx !== -1 && addVm(vms, offsIdx, 1)
  }

  // move vm to the next atom offset
  moveVm(vms, a, vmIdx, vmOffs)
}

function rep(vms, a, vmIdx) {
  const vmOffs = toOffs(vms.offs[vmIdx])
  const a1     = get(vms.w, offs(vmOffs, b1Dir(a)))
  const a2Offs = offs(vmOffs, b2Dir(a))
  const a2     = get(vms.w, a2Offs)
  // TODO: we should check same types before replicate
  a1 && a2 && put(vms.w, a2Offs, (a2 & ATOM_TYPE_MASK) | (a1 & ATOM_TYPE_UNMASK))
  // move vm to the next atom offset
  moveVm(vms, a, vmIdx, vmOffs)
}

/**
 * Moves VM from one atom to another if possible and updates
 * related vm.offs array
 */
function moveVm(vms, a, idx, o, dir = NO_DIR) {
  const d = dir !== NO_DIR ? dir : vmDir(a)
  const dstOffs = offs(o, d)
  if (d === NO_DIR || !get(vms.w, dstOffs)) return
  const vmAmount = amount(vms.offs, idx)
  let idx1 = findIdx(vms, dstOffs)
  if (idx1 === -1) return
  vmAmount && addVm(vms, idx, -1)
  idx1 = findIdx(vms, dstOffs)
  if (idx1 === -1) return
  if (vmAmount) return addVm(vms, idx1, 1)
}

/**
 * Adds a number n to amount of vms in offs[idx]
 */
function addVm(vms, idx, n) {
  const offs = vms.offs
  const vmAmount = amount(offs, idx) + n
  if (vmAmount < 1) {                       // no vms on current atom
    delete vms.map[toOffs(offs[idx])]
    vms.map[toOffs(offs[vms.last - 1])] = idx
    offs[idx] = offs[--vms.last]
    return
  }
  const dstOffs = toOffs(offs[idx])
  offs[idx] = vm(dstOffs, vmAmount)
  vmAmount === n && (vms.map[dstOffs] = idx)
  return idx
}

function amount(offs, idx) {
  return Number(offs[idx] & VM_VMS_MASK)
}

/**
 * Finds an index in offs array of specified VM offset. If there is no
 * such offset it adds new empty cell to offs array
 */
function findIdx(vms, offs) {
  const idx = vms.map[offs]
  if (idx !== undefined) return idx
  if (vms.last >= vms.offs.length || !get(vms.w, offs)) return -1
  vms.offs[vms.last++] = vm(offs, 0)
  return vms.last - 1
}

/**
 * Updates moved atom bonds
 */
function rebond(w, a, o, mdir, dirFn, setDirFn) {
  const dir = dirFn(a)                    // gets direction of near atom
  if (mdir === dir) return a              // direction the same. skip dir change
  const dstOffs = offs(o, dir)            // near atom offset
  if (get(w, dstOffs)) {                  // atom, where the bond points exists
    const newDir = DMA[dir][mdir]         // updated direction for near atom bond to moved
    if (newDir === NO_DIR) {              // if distance between moved atom and the bond atom is > 1
      STACK[stackIdx++] = dstOffs         // handle this atom later
    } else a = setDirFn(a, newDir)        // update moved atom's bond
  }
  return a
}

/**
 * Updates near atoms bonds
 */
function rebond2(w, o, mdir) {
  const dirs = DMD[mdir]                  // array of all near atoms directions
  for (let i = 0; i < 8; i++) {           // go through all near atoms
    const d = dirs[i]                     // current direction of near atom
    if (i === mdir) continue              // exclude direction of moved atom
    const dstOffs = offs(o, i)            // near atom affset
    let a = get(w, dstOffs)               // near atom
    if (a) {                              // near atom doesn't exist
    const revDir = vmDir(a)               // vm bond of near atom
    const rDir = DIR_REV[i]               // opposite direction of near atom
      if (d === NO_DIR) {                 // distance between moved and near atom still == 1
        const oldA = a
        if (revDir === rDir) a = setVmDir(a, DNA[revDir][mdir])
        else if (type(a) === ATOM_CON) {  // for "if" atom update then, else bonds
          const thend = thenDir(a)
          const elsed = elseDir(a)
          if (thend === rDir) a = setThenDir(a, DNA[thend][mdir])
          if (elsed === rDir) a = setElseDir(a, DNA[elsed][mdir])
        }
        oldA !== a && put(w, dstOffs, a)  // update near atom's bond
      } else {                            // distance between moved atom and near > 1
        if (revDir == rDir || type(a) === ATOM_CON && (thenDir(a) === rDir || elseDir(a) === rDir)) {
          STACK[stackIdx++] = dstOffs
        }
      }
    }
  }
}

function fromStack() {
  return STACK[stackIdx - 1] & MOV_BREAK_UNMASK
}