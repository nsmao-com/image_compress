/// <reference types="vite/client" />

declare module 'gifenc' {
  export const GIFEncoder: any
  export const quantize: any
  export const applyPalette: any
}

declare module 'gifsicle-wasm-browser' {
  const init: () => Promise<any>
  export default init
}

declare module 'gifuct-js' {
  export const parseGIF: any
  export const decompressFrames: any
}

declare module 'gif.js' {
  interface GIFOptions {
    workers?: number
    quality?: number
    width?: number
    height?: number
    workerScript?: string
    background?: string
    repeat?: number
    transparent?: string | null
    dither?: string | boolean
  }

  export default class GIF {
    constructor(options?: GIFOptions)
    addFrame(element: HTMLCanvasElement | ImageData, options?: { delay?: number; copy?: boolean }): void
    render(): void
    on(event: 'finished', callback: (blob: Blob) => void): void
    on(event: 'progress', callback: (progress: number) => void): void
    abort(): void
  }
}

declare module 'omggif' {
  export class GifWriter {
    constructor(buffer: Uint8Array, width: number, height: number, options?: {
      loop?: number
      palette?: number[]
    })
    
    addFrame(
      x: number,
      y: number,
      width: number,
      height: number,
      indexedPixels: Uint8Array,
      options?: {
        palette?: number[]
        delay?: number
        disposal?: number
        transparent?: number
      }
    ): void
  }
  
  export class GifReader {
    constructor(buffer: Uint8Array)
    
    width: number
    height: number
    numFrames(): number
    frameInfo(frameNum: number): {
      x: number
      y: number
      width: number
      height: number
      delay: number
      disposal: number
      transparent: number
    }
    decodeAndBlitFrameRGBA(frameNum: number, pixels: Uint8Array): void
  }
}


