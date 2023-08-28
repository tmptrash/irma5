import CFG from './cfg'
import Panzoom from 'panzoom'
import { VM_OFFS_MASK, ATOM_TYPE_MASK, ATOM_TYPE_SHIFT } from './shared'

const DIR_2_OFFS = [-CFG.width, -CFG.width + 1, 1, CFG.width + 1, CFG.width, CFG.width - 1, -1, -CFG.width - 1]

export default function World() {
  const $ = document.querySelector.bind(document)
  const ctx = $('canvas').getContext('2d')
  const imgData = ctx.getImageData(0, 0, CFG.width, CFG.height)

  const w = {
    doc: document,
    canvas: $('canvas'),
    title: $('.title'),
    visualize: $('.visualize'),
    fullscreen: $('.fullscreen'),

    ctx,
    imgData,
    data: imgData.data,
    zoom: null,
    zoomObserver: null,
    visualizeOn: true,
    animateFn: null,

    x: 0,
    y: 0,
    w: CFG.width,
    h: CFG.height
  }

  initDom(w)
  initHandlers(w)
  initZoom(w)
  initTransparency(w)
  onFullscreen(w)
  onAnimate(w)

  return w
}

export function destroy(w) {
  w.zoom.dispose()
  w.zoomObserver.disconnect()
  w.ctx = w.imgData = w.data = w.zoom = w.zoomObserver = w.animateFn = null
}

export function atom(w, offs) {
  return w.data[offs && VM_OFFS_MASK]
}

export function offs(offs, dir) {
  return offs + DIR_2_OFFS[dir]
}

// export function visualize(w, visualize = true) {
//   w.visualizeOn = visualize
//   onVisualize(w, visualize)
//   onAnimate(w)
// }

export function isAtom(w, offs) {
  const dotOffs = offs << 2
  return w.data[dotOffs] !== 0 || w.data[dotOffs + 1] !== 0 || w.data[dotOffs + 2] !== 0
}

export function dot(w, offs, color) {
  const d = w.data
  offs <<= 2

  d[offs    ] = (color >>> 16) & 0xff
  d[offs + 1] = (color >>> 8)  & 0xff
  d[offs + 2] = color & 0xff
}

export function undot(w, offs) {
  const d = w.data
  offs <<= 2
  d[offs] = d[offs + 1] = d[offs + 2] = 0
}

export function title(w, t) {
  w.title.textContent = t
}

function initDom(w) {
  w.ctx.font = "18px Consolas"
  w.ctx.fillStyle = "white"
  w.canvas.style.imageRendering = 'pixelated'
}

function initHandlers(w) {
  w.zoomObserver = new MutationObserver(onZoom.bind(w))
  w.zoomObserver.observe(w.canvas, {
    attributes     : true,
    childList      : false,
    attributeFilter: ['style']
  })
  w.animateFn = () => onAnimate(w)
  w.doc.onkeydown = e => onKeyDown(w, e)
  w.visualize.onclick = () => onVisualize(w)
  w.fullscreen.onclick = w.fullscreen.firstChild.onclick = () => onFullscreen(w)
}

function initZoom(w) {
  w.zoom = Panzoom(w.canvas, {
    zoomSpeed   : CFG.zoomSpeed,
    smoothScroll: false,
    minZoom     : 1,
    // TODO: check if we need this
    //filterKey   : this._options.scroll
  })
}

function initTransparency(w) {
  const d = w.data
  for (let i = 0, l = d.length * 4; i < l; i += 4) d[i + 3] = 0xff
}

function updateCanvas(w) {
  w.ctx.putImageData(w.imgData, 0, 0, w.x, w.y, w.w, w.h)
}

function onFullscreen(w) {
  w.zoom.zoomAbs(0, 0, 1.0)
  w.zoom.moveTo(0, 0)
  w.canvas.style.width  = '100%'
  w.canvas.style.height = '100%'
}

function onVisualize(w, visualize) {
  w.visualizeOn = typeof(visualize) === 'boolean' ? visualize : !w.visualizeOn;
  w.visualize.style.backgroundColor = w.visualizeOn ? '#FFEB3B' : '#000';
  onAnimate(w)
}

function onAnimate(w) {
  updateCanvas(w)
  // TODO: remove these lines
  w.ctx.beginPath()
  w.ctx.lineWidth = 10
  w.ctx.strokeStyle = '#ff0000'
  w.ctx.moveTo(30, 50)
  w.ctx.lineTo(150, 100)
  w.ctx.stroke()

  w.visualizeOn && window.requestAnimationFrame(w.animateFn)
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

function onZoom(w) {
  if (!w.ctx) {return}
  const matrix        = getZoomMatrix(w)
  if (!matrix) {return}
  const dx            = +matrix[4];
  const dy            = +matrix[5];
  const coef          = +matrix[0];
  const windowWidth   = window.innerWidth;
  const windowHeight  = window.innerHeight;
  const viewWidth     = windowWidth  * coef;
  const viewHeight    = windowHeight * coef;
  const xCoef         = CFG.width  / windowWidth;
  const yCoef         = CFG.height / windowHeight;

  w.x = (dx < 0 ? (coef > 1 ? -dx / coef : -dx * coef) : 0) * xCoef;
  w.y = (dy < 0 ? (coef > 1 ? -dy / coef : -dy * coef) : 0) * yCoef;

  w.w = (viewWidth  + dx > windowWidth  ? (coef > 1 ? (windowWidth  - (dx > 0 ? dx : 0)) / coef : (windowWidth  - (dx > 0 ? dx : 0)) * coef) : windowWidth ) * xCoef;
  w.h = (viewHeight + dy > windowHeight ? (coef > 1 ? (windowHeight - (dy > 0 ? dy : 0)) / coef : (windowHeight - (dy > 0 ? dy : 0)) * coef) : windowHeight) * yCoef;
}

function getZoomMatrix(w) {
  const transform = window.getComputedStyle(w.ctx, null).getPropertyValue('transform');
  if (!transform || transform === 'none') {return null}
  return (transform.split('(')[1].split(')')[0].split(',')).map((e) => +e);
}