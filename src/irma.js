import './styles.css'
import World from './world.js'
import VMs, { ticks } from './vms.js'
import { UInt64Array } from './shared'
import Title from './plugins/title.js'
import Buttons from './plugins/buttons.js'
/**
 * This function will be run every few millisecond
 * (depending on browser)
 */
function run() {
  ticks(vms)
  for (let p of plugins) p.update?.(p)
  postMessage(0)
}

const w = World()                                 // 2D world
const plugins = [Title(w), Buttons(w)]            // plugins of the world
// TODO: here shoulf be a loader of vm positions & energies
const vmOffs = UInt64Array.create(10)             // array of virtual machines
const vms = VMs(w, vmOffs)                        // VMs instance
addEventListener('message', e => e.data === 0 && (e.stopPropagation() || run()), true)
run()                                             // run the emulator