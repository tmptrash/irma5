import './styles.css'
import World from './world'
import VM, { tick } from './vm'

const w = World()
const vm = VM(w)

// this is how we create infinite fast loop in JS
// window.addEventListener('message', e => e.data === 0 && (e.stopPropagation() || run()), true)

// function run() {
//   tick(vm)
//   window.postMessage(0, '*');
// }