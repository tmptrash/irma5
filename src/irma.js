import './styles.css'
import World from './world'
import VM, { tick } from './vm'
import Title, { update } from './title'

const w = World()
const title = Title(w)
const vm = VM(w)

// this is how we create infinite fast loop in JS
window.addEventListener('message', e => e.data === 0 && (e.stopPropagation() || run()), true)

function run() {
  tick(vm)
  update(title)
  window.postMessage(0, '*');
}

run()