import CFG from '../cfg'

export default function Title(w) {
  return {
    w,
    title: '',
    titleEl: $(CFG.HTML.titleQuery),
    t: performance.now(),
    ticks: 0,
    update
  }
}

export function destroy(t) {
  t.w.title = null
}

function update(t) {
  const now = performance.now()
  t.ticks++
  if (now - t.t > 1000) {
    t.t = now
    t.w.title.textContent = t.ticks
    t.ticks = 0
  }
}