import CFG from './cfg'
import Panzoom from 'panzoom'

export default function World() {
  const $ = document.querySelector.bind(document)
  const ctx = $(CFG.HTML.canvasQuery).getContext('2d')
  const imgData = ctx.getImageData(0, 0, CFG.WORLD.width, CFG.WORLD.height)

  const w = {
    canvas: $(CFG.HTML.canvasQuery),

    ctx,
    imgData,
    data: imgData.data,
    zoom: null,
    zoomObserver: null,
    animateFn: null,

    x: 0,
    y: 0,
    w: CFG.WORLD.width,
    h: CFG.WORLD.height
  }

  initDom(w)
  initHandlers(w)
  initZoom(w)
  initTransparency(w)
  onAnimate(w)

  return w
}

export function destroy(w) {
  w.zoom.dispose()
  w.zoomObserver.disconnect()
  w.canvas = w.ctx = null
  w.imgData = w.data = w.zoom = w.zoomObserver = w.animateFn = null
}

/**
 * Returns atom or 0, if no atom
 */
export function get(w, offs) {
  const d = w.data
  offs <<= 2
  let a = d[offs] << 16
  a |= d[offs + 1] << 8
  a |= d[offs + 2]
  return a
}

export function put(w, offs, atom) {
  const d = w.data
  offs <<= 2
  d[offs    ] = (atom >>> 16) & 0xff
  d[offs + 1] = (atom >>> 8)  & 0xff
  d[offs + 2] = atom & 0xff
}

export function isAtom(w, offs) {
  const dotOffs = offs << 2
  return w.data[dotOffs] !== 0 || w.data[dotOffs + 1] !== 0 || w.data[dotOffs + 2] !== 0
}

export function move(w, offs1, offs2) {
  put(w, offs2, get(w, offs1))
  put(w, offs2, 0)
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
}

function initZoom(w) {
  w.zoom = Panzoom(w.canvas, {
    zoomSpeed   : CFG.WORLD.zoom,
    smoothScroll: false,
    minZoom     : 1
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

function onAnimate(w) {
  updateCanvas(w)
  // TODO: remove these lines
  // w.ctx.beginPath()
  // w.ctx.lineWidth = 10
  // w.ctx.strokeStyle = '#ff0000'
  // w.ctx.moveTo(30, 50)
  // w.ctx.lineTo(150, 100)
  // w.ctx.stroke()

  w.animateFn && window.requestAnimationFrame(w.animateFn)
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
  const xCoef         = CFG.WORLD.width  / windowWidth;
  const yCoef         = CFG.WORLD.height / windowHeight;

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