export default {
  WORLD: {                                // section, where the world config leaves
    width: 1024,                          // world width in pixels
    height: 768,                          // world height in pixels
    zoom: 0.1                             // zoom speed coefficient
  },
  HTML: {                                 // DOM related config
    canvasQuery: 'canvas',
    titleQuery: '.title',
    visualizeBtnQuery: '.visualize',
    fullscreenBtnQuery: '.fullscreen'
  },
  ATOM: {
    stackBufSize: 1024,                   // stack size for mov atom (amount of moved atoms)
    NRG: {
      mov: 1,
      fix: 1,
      spl: 0,
      con: 0,
      job: 1,
      rep: 0,
      onFix: 4,
      onSpl: 5
    }
  },
  rpi: 1                                  // rounds per iteration
}