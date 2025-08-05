declare module 'irma5/src/cfg' {
  export type CFGType = {
    WORLD: {
      width: number
      height: number
      zoom: number
    },
    HTML: {
      canvasQuery: string
      titleQuery: string
      visualizeBtnQuery: string
      fullscreenBtnQuery: string
    },
    VM: {
      percent: number
      nrg: number
    },
    ATOM: {
      seed: number
      stackBufSize: number
      percent: number
      moveTries: number
      NRG: {
        mov: number
        fix: number
        spl: number
        con: number
        job: number
        rep: number
        mut: number
        onFix: number
        onSpl: number
      },
      PROB: [
        number,
        number,
        number,
        number,
        number,
        number,
        number
      ]
    },
    rpi: number;
  }
  export default {} as CFGType
}