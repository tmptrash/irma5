export default {
  WORLD: {                                // section, where the world config leaves
    width: 2048,                          // world width in pixels
    height: 2000,                         // world height in pixels
    zoom: 0.1                             // zoom speed coefficient
  },
  HTML: {                                 // DOM related config
    canvasQuery: 'canvas#irma5',
    titleQuery: '.title',
    visualizeBtnQuery: '.visualize',
    fullscreenBtnQuery: '.fullscreen'
  },
  VM: {
    percent: .5,                          // amount of VMs from amount of atoms. if atoms.length === 10 & percent === .2 => VMs === 2
  },
  ATOM: {
    seed: 3,                              // seed for all random numbers in a system
    stackBufSize: 128,                    // stack size for mov atom (amount of moved atoms)
    percent: .15,                         // affects to amount of atoms in the world
    moveTries: 5,                         // amount of near atoms "mov" atom will move per one call
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
      .4,                                 // mov
      .1,                                 // fix
      .1,                                 // ...
      .1,
      .1,
      .1,
      .1
    ]
  },
  rpi: 1                                  // rounds per iteration
}