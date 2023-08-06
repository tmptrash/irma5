import { title } from './world'

export default function Title(w) {
  return {
    w,
    title: '',
    t: performance.now(),
    ticks: 0
  }
}

export function update(t) {
  const now = performance.now()
  t.ticks++
  if (now - t.t > 1000) {
    t.t = now
    title(t.w, t.ticks)
    t.ticks = 0
  }
}