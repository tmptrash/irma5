import CFG from '../cfg'

export default function Title(w) {
  const $ = document.querySelector.bind(document)
  const b = {
    w,
    doc: document,
    visualize: $(CFG.HTML.visualizeBtnQuery),
    fullscreen: $(CFG.HTML.fullscreenBtnQuery),
    animateFn: w.animateFn
  }
  b.visualize.onclick = () => onVisualize(w)
  b.doc.onkeydown = e => onKeyDown(b.w, e)
  b.fullscreen.onclick = b.fullscreen.firstChild.onclick = () => onFullscreen(b.w)
  onFullscreen(b.w)
  return b
}

export function destroy(b) {
  w.doc = b.fullscreen = b.visualize = null
}

function onVisualize(b, visualize) {
  b.animateFn = visualize ? b.w.animateFn : null
  b.visualize.style.backgroundColor = visualize ? '#FFEB3B' : '#000'
  b.animateFn && b.animateFn(b.w)
}

function onKeyDown(w, event) {
  if (event.ctrlKey && (event.key === 'V' || event.key === 'v')) {
    onVisualize(w)
    event.preventDefault()
    return false
  }
  if (event.ctrlKey && (event.key === 'F' || event.key === 'f')) {
    onFullscreen(w)
    event.preventDefault()
    return false
  }
}

function onFullscreen(w) {
  w.zoom.zoomAbs(0, 0, 1.0)
  w.zoom.moveTo(0, 0)
  w.canvas.style.width  = '100%'
  w.canvas.style.height = '100%'
}

// export function visualize(w, visualize = true) {
//   w.visualizeOn = visualize
//   onVisualize(w, visualize)
//   onAnimate(w)
// }