declare module 'CFG' {
  type CFG = {
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
    ATOM: {
      stackBufSize: number
      NRG: {
        mov: number
        fix: number
        spl: number
        con: number
        job: number
        rep: number
        onFix: number
        onSpl: number
      }
    },
    rpi: number;
  }
  export default CFG
}