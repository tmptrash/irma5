import './styles.css'
import World from './world.js'
import VMs, { tick } from './vms.js'
import Title from './plugins/title.js'
import Buttons from './plugins/buttons.js'
/**
 * This function will be run every few millisecond
 * (depending on browser)
 */
function run() {
  tick(vms)
  for (let p of plugins) p.update?.(p)
  postMessage(0)
}

const w = World()                                 // 2D world
const plugins = [Title(w), Buttons(w)]            // plugins of the world
// TODO: here shoulf be a loader of vm positions & energies
const vmOffs = BigUint64Array.new(10)             // array of virtual machines
const vms = VMs(w, vmOffs)                        // VMs instance
addEventListener('message', e => e.data === 0 && (e.stopPropagation() || run()), true)
run()                                             // run the emulator