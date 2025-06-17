import CFG from '../cfg.js'

export default function Buttons(w) {
  const $ = document.querySelector.bind(document)
  const b = {
    w,
    doc: document,
    visualize: $(CFG.HTML.visualizeBtnQuery),
    fullscreen: $(CFG.HTML.fullscreenBtnQuery),
    animateFn: w.animateFn
  }
  b.visualize.onclick = () => visualize(b)
  b.doc.onkeydown = e => onKeyDown(b.w, e)
  b.fullscreen.onclick = b.fullscreen.firstChild.onclick = () => onFullscreen(b)
  onFullscreen(b)
  return b
}

export function destroy(b) {
  w.doc = b.fullscreen = b.visualize = null
}

function visualize(b) {
  b.w.animateFn = b.w.animateFn ? null : b.animateFn
  b.visualize.style.backgroundColor = b.w.animateFn ? '#FFEB3B' : '#000'
  b.w.animateFn?.(b.w)
}

function onKeyDown(b, event) {
  if (event.ctrlKey && (event.key === 'V' || event.key === 'v')) {
    visualize(b)
    event.preventDefault()
    return false
  }
  if (event.ctrlKey && (event.key === 'F' || event.key === 'f')) {
    onFullscreen(b)
    event.preventDefault()
    return false
  }
}

function onFullscreen(b) {
  b.w.zoom.zoomAbs(0, 0, 1.0)
  b.w.zoom.moveTo(0, 0)
  b.w.canvas.style.width  = '100%'
  b.w.canvas.style.height = '100%'
}