export default {
  WORLD: {                                // section, where the world config leaves
    width: 1024,                          // world width in pixels
    height: 768,                          // world height in pixels
    zoom: 0.1                             // zoom speed coefficient
  },
  HTML: {                                 // DOM related config
    canvasQuery: 'canvas#irma5',
    titleQuery: '.title',
    visualizeBtnQuery: '.visualize',
    fullscreenBtnQuery: '.fullscreen'
  },
  ATOM: {
    seed: 1,                              // seed for all random numbers in a system
    stackBufSize: 128,                    // stack size for mov atom (amount of moved atoms)
    percent: .333,                        // affects to amount of atoms in the world
    NRG: {
      mov: 0,
      fix: 0,
      spl: 0,
      con: 0,
      job: 0,
      rep: 0,
      mut: 0,
      onFix: 0,
      onSpl: 0
    },
    PROB: [                               // probability of appearing of the concrete atom sum() === 1
      .4,
      .1,
      .1,
      .1,
      .1,
      .1,
      .1
    ]
  },
  rpi: 1                                  // rounds per iteration
}