import './styles.css'
import World from './world'
import VM, { setVMOffs, tick } from './vm'
import Title, { update } from './title'

function run() {
  tick(vm)
  update(title)
  window.postMessage(0, '*');
}

const w = World()
const title = Title(w)
// TODO:
const vmOffs = new BigUint64Array(10)
const vm = VM(w)

// this is how we create infinite fast loop in JS
window.addEventListener('message', e => e.data === 0 && (e.stopPropagation() || run()), true)
setVMOffs(vm, vmOffs)
run()