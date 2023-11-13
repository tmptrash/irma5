import './styles.css'
import World from './world'
import VM, { setVMs, tick } from './vm'
import Title from './plugins/title'
import Buttons from './plugins/buttons'

function run() {
  tick(vm)
  for (let p = 0; p < plugins.length; p++) {
    const plugin = plugins[p]
    plugin.update && plugin.update(plugin)
  }
  window.postMessage(0, '*');
}

const w = World()
const plugins = [Title(w), Buttons(w)]
// TODO:
const vmOffs = new BigUint64Array(10)
const vm = VM(w)

// this is how we create infinite fast loop in JS
window.addEventListener('message', e => e.data === 0 && (e.stopPropagation() || run()), true)
setVMs(vm, vmOffs)
run()