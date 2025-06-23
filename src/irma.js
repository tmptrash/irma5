/**
 * This is entry point of irma5 simulator. It creates global instances of the world, atoms, VMs and 
 * other objects and runs the simulator.
 */
import './styles.css'
import CFG from './cfg'
import World, { put } from './world.js'
import { rnd, ATOM_MOV, ATOM_FIX, ATOM_SPL, ATOM_CON, ATOM_JOB, ATOM_REP, ATOM_MUT, UInt64Array,
  NO_DIR, L } from './shared'
import { rndType, rndMov, rndFix, rndSpl, rndCon, rndRep, rndJob, rndMut, mov } from './atom'
import VMs, { ticks, vm, set } from './vms.js'
import Title from './plugins/title.js'
import Buttons from './plugins/buttons.js'
/**
 * Map of atom types and their random value generators
 */
const ATOM_GENERATORS = {
  [ATOM_MOV]: rndMov,
  [ATOM_FIX]: rndFix,
  [ATOM_SPL]: rndSpl,
  [ATOM_CON]: rndCon,
  [ATOM_JOB]: rndJob,
  [ATOM_REP]: rndRep,
  [ATOM_MUT]: rndMut
}
/**
 * Creates and returns an array of atoms in a format: [{x, y, a}, ...]
 * @param {World} w World instance
 * @returns {[{x, y, a}]} Array of atoms with x, y 
 */
function createAtoms(w) {
  const atoms = []
  const percent = CFG.ATOM.percent                // how many atoms will be in a world in percents
  for (let x = 0; x < w.w; x++)
    for (let y = 0; y < w.h; y++)
      if (rnd() <= percent) {                     // current random atom should exist in a world
        const typ = rndType()
        const a = ATOM_GENERATORS[typ]?.() || 0
        typ && atoms.push({x, y, a})
      }
  return atoms
}
/**
 * Creates and returns an array of virtual machines in a packed format
 * @param {World} w World instance
 * @param {Array} atoms Array of atoms in format {x, y, a}
 * @returns {UInt64Array} Array of VMs
 */
function createVMs(w, atoms) {
  const coef = 5                                  // divider for amount of atoms
  const vmsAmount = Math.round(atoms.length / coef)
  if (vmsAmount <= 0) throw new Error(`Invalid VM amount. Current amount: ${vmsAmount}`)
  const vms = UInt64Array.create(vmsAmount)
  for (let i = 0; i < atoms.length; i += coef) {
    const a = atoms[i]
    vms.add(vm(a.y * w.w + a.x, 1))               // energy === 1
  }
  return vms
}
/**
 * Adds atoms to the canvas/simulator
 * @parma {World} w World instance
 * @param {Array} atoms Array of atoms [{x, y, a}, ...]
 */
function addAtoms(w, atoms) {
  const width = w.w
  atoms.forEach(a => put(w, a.y * width + a.x, a.a))
}
/**
 * Adds virtual machines to the simulator/canvas
 * @param {VMs} vms VMs instance 
 * @param {UInt64Array} vmOffs Array of virtual machines packed into vm()
 */
function addVMs(vms, vmOffs) {
  set(vms, vmOffs)
}
/**
 * This function will be run every few millisecond (depending on browser). It emulates infinite loop
 * and runs all VMs in a system and updates all plugins
 */
function run() {
  ticks(vms)
  for (let p of plugins) p.update?.(p)
  //postMessage(0)
}
//
// Create instances of the world, plugins, atoms & VMs
//
const w       = World()                           // 2D world
const plugins = [Title(w), Buttons(w)]            // plugins of the world
let atoms     = createAtoms(w)                    // array of atoms [{x, y, a},...]
let vmOffs    = createVMs(w, atoms)               // array of virtual machines by coordinates + energies
//let atoms = [{x: 3, y: 3, a: 0x21bf}]
//let vmOffs =  UInt64Array.create(1)
//vmOffs.add(vm(3 * w.w + 3, 1))
const vms     = VMs(w)                            // VMs instance
//
// Adds atoms and VMs into the canvas and the memory
//
addAtoms(w, atoms)
addVMs(vms, vmOffs)
atoms = vmOffs = undefined                        // we have to remove global vars manually
//
// Run infinite loop of the simulator
//
//addEventListener('message', e => e.data === 0 && (e.stopPropagation() || run()), true)
setInterval(run, 1000)                                             // runs the emulator