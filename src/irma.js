import './styles.css'
import World from './world.js'
import VMs, { vms, tick } from './vm.js'
import Title from './plugins/title.js'
import Buttons from './plugins/buttons.js'
/**
 * This function will be run every few millisecond
 * (depending on browser)
 */
function run() {
  tick(vm)
  for (let p = 0; p < plugins.length; p++) {
    const plugin = plugins[p]
    plugin.update && plugin.update(plugin)
  }
  window.postMessage(0, '*');
}

const w = World()                         // 2D world
const plugins = [Title(w), Buttons(w)]    // olugins of the world
const vmOffs = new BigUint64Array(10)     // array of virtual machines
const vm = VMs(w, vmOffs)                 // VMs instance
window.addEventListener('message', e => { // create fastest infinite loop in JS
  e.data === 0 && (e.stopPropagation() || run())
}, true)
run()                                     //  run the emulator