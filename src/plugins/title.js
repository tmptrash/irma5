import CFG from '../cfg.js'

export default function Title(w, vms) {
  const $ = document.querySelector.bind(document)
  return {
    w,
    vms,
    title: '',
    titleEl: $(CFG.HTML.titleQuery),
    t: performance.now(),
    rps: 0,
    ticks: 0,
    update
  }
}

export function destroy(t) {
  t.w.title = null
}

function format(n) {
  if (n >= 1_000_000_000_000) return (n / 1_000_000_000_000).toFixed(1) + 'T';
  if (n >= 1_000_000_000)     return (n / 1_000_000_000).toFixed(1) + 'B';
  if (n >= 1_000_000)         return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)             return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}

function update(t) {
  const now = performance.now()
  t.rps++
  t.ticks += CFG.rpi * t.vms.offs.i
  if (now - t.t > 1000) {
    t.t = now
    t.titleEl.textContent = `rps: ${t.rps}, tks: ${format(t.ticks)}`
    t.rps = 0
  }
}