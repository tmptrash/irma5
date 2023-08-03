import CFG from './cfg'
import Panzoom from 'panzoom'

const $ = document.querySelector.bind(document)

export default function World() {
  const ctx = $('canvas').getContext('2d')
  const imgData = ctx.getImageData(0, 0, CFG.width, CFG.height)

  const w = {
    doc: document,
    canvas: $('canvas'),
    title: $('.title'),
    ctx,
    imgData,
    visualize: $('.visualize'),
    data: imgData.data,
    animateFn: null,
    visualizeOn: true,
    panZoom: null,
    zoomObserver: null,
    xDataOffs: 0,
    yDataOffs: 0,
    visibleWidth: CFG.width,
    visibleHeight: CFG.height
  }

  initDom(w)
  initHandlers(w)
  initPanZoom(w)
  setTransparency(w)
  onFullscreen(w)
  onAnimate(w)

  return w
}

export function atom(w, offs) {}

export function typeByOffs(w, offs) {}

export function destroy(w) {
  w.panZoom.dispose()
  w.ctx     = null
  w.imgData = null
  w.data    = null
  w.panZoom = null
}

export function visualize(w, visualize = true) {
  w.visualizeOn = visualize
  onVisualize(w, visualize)
  onAnimate(w)
}

export function dot(w, offs, color) {
  const d = w.data
  offs <<= 2

  d[offs    ] = (color >>> 16) & 0xff
  d[offs + 1] = (color >>> 8)  & 0xff
  d[offs + 2] = color & 0xff
}

export function clear(w, offs) {
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
  w.ctx.style.imageRendering = 'pixelated'
}

function initHandlers(w) {
  w.zoomObserver = new MutationObserver(onZoom.bind(w))
  w.zoomObserver.observe(w.canvas, {
    attributes     : true,
    childList      : false,
    attributeFilter: ['style']
  })
  w.animateFn = onAnimate.bind(w)
  w.doc.onkeydown = onKeyDown.bind(w)
  w.visualize.onclick = onVisualize.bind(w)
  $('.fullscreen > div').onclick = $('.fullscreen').onclick = onFullscreen.bind(w)
}

function initPanZoom(w) {
  w.panZoom = Panzoom(w.ctx, {
    zoomSpeed   : CFG.zoomSpeed,
    smoothScroll: false,
    minZoom     : 1,
    // TODO: check if we need this
    //filterKey   : this._options.scroll
  })
  w.panZoom.zoomAbs(0, 0, 1.0)
}

function setTransparency(w) {
  const d = w.data
  for (let i = 0, l = d.length * 4; i < l; i += 4) d[i + 3] = 0xff
}

function updateCanvas(w) {
  w.ctx.putImageData(w.imgData, 0, 0, w.xDataOffs, w.yDataOffs, w.visibleWidth, w.visibleHeight)
}

function onFullscreen(w) {
  w.panZoom.zoomAbs(0, 0, 1.0)
  w.panZoom.moveTo(0, 0)
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

  w.xDataOffs = (dx < 0 ? (coef > 1 ? -dx / coef : -dx * coef) : 0) * xCoef;
  w.yDataOffs = (dy < 0 ? (coef > 1 ? -dy / coef : -dy * coef) : 0) * yCoef;

  w.visibleWidth  = (viewWidth  + dx > windowWidth  ? (coef > 1 ? (windowWidth  - (dx > 0 ? dx : 0)) / coef : (windowWidth  - (dx > 0 ? dx : 0)) * coef) : windowWidth ) * xCoef;
  w.visibleHeight = (viewHeight + dy > windowHeight ? (coef > 1 ? (windowHeight - (dy > 0 ? dy : 0)) / coef : (windowHeight - (dy > 0 ? dy : 0)) * coef) : windowHeight) * yCoef;
}

function getZoomMatrix(w) {
  const transform = window.getComputedStyle(w.ctx, null).getPropertyValue('transform');
  if (!transform || transform === 'none') {return null}
  return (transform.split('(')[1].split(')')[0].split(',')).map((e) => +e);
}