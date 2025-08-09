<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

type SourceImage = {
  file: File
  url: string
  name: string
  type: string
  size: number
}

const sourceImage = ref<SourceImage | null>(null)
const outputBlob = ref<Blob | null>(null)
const outputUrl = ref<string | null>(null)
const outputInfo = ref<{ width: number; height: number; size: number; type: string } | null>(null)
const quality = ref(0.8)
const targetFormat = ref<'png' | 'jpeg' | 'webp' | 'jpg' | 'gif' | 'ico'>('jpeg')
const formatOptions = ['jpeg', 'jpg', 'png', 'webp', 'gif', 'ico'] as const
const icoSizes = ref<number[]>([16, 32, 48, 64, 128, 256])
const icoAllowedSizes = [16, 24, 32, 48, 64, 128, 256]
// 转换参数
const maxWidth = ref<number | null>(null)
const maxHeight = ref<number | null>(null)
const jpegBg = ref('#ffffff')
const gifColors = ref(256)
const gifDelay = ref(0)
const isProcessing = ref(false)
const dragOver = ref(false)

const readableSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

const outputName = computed(() => {
  if (!sourceImage.value) return 'output'
  const base = sourceImage.value.name.replace(/\.(png|jpg|jpeg|webp|gif|ico)$/i, '')
  const ext = targetFormat.value === 'jpg' ? 'jpg' : targetFormat.value
  return `${base}.${ext}`
})

function revokeUrl() {
  if (outputUrl.value) URL.revokeObjectURL(outputUrl.value)
}

async function loadFile(file: File) {
  const accept = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
  if (!accept.includes(file.type)) {
    alert('仅支持 PNG / JPEG / WEBP 图片')
    return
  }
  const url = URL.createObjectURL(file)
  sourceImage.value = { file, url, name: file.name, type: file.type, size: file.size }
  outputBlob.value = null
  revokeUrl()
  outputUrl.value = null
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) loadFile(file)
}

function onDrop(e: DragEvent) {
  dragOver.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) loadFile(file)
}

async function convert() {
  if (!sourceImage.value) return
  isProcessing.value = true
  try {
    const imageBitmap = await createImageBitmap(sourceImage.value.file)
    const canvas = document.createElement('canvas')
    const targetW = maxWidth.value ? Math.min(maxWidth.value, imageBitmap.width) : imageBitmap.width
    const targetH = maxHeight.value ? Math.min(maxHeight.value, imageBitmap.height) : imageBitmap.height
    canvas.width = targetW
    canvas.height = targetH
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!
    // JPEG 背景（避免透明变黑）
    if (targetFormat.value === 'jpeg' || targetFormat.value === 'jpg') {
      ctx.fillStyle = jpegBg.value
      ctx.fillRect(0, 0, targetW, targetH)
    }
    ctx.drawImage(imageBitmap, 0, 0, targetW, targetH)

    let mime = 'image/jpeg'
    if (targetFormat.value === 'png') mime = 'image/png'
    else if (targetFormat.value === 'webp') mime = 'image/webp'

    // 目标为 ICO：构建包含多尺寸 PNG 的 ICO（PNG inside ICO）
    if (targetFormat.value === 'ico') {
      const sizes = icoSizes.value.filter((s) => icoAllowedSizes.includes(s)).sort((a,b)=>a-b)
      if (sizes.length === 0) throw new Error('请选择至少一个 ICO 尺寸')

      const pngBuffers: ArrayBuffer[] = []
      for (const size of sizes) {
        const canvasIco = document.createElement('canvas')
        canvasIco.width = size
        canvasIco.height = size
        const c = canvasIco.getContext('2d', { willReadFrequently: true })!
        // contain 居中
        const scale = Math.min(size / imageBitmap.width, size / imageBitmap.height)
        const dw = Math.round(imageBitmap.width * scale)
        const dh = Math.round(imageBitmap.height * scale)
        const dx = Math.floor((size - dw) / 2)
        const dy = Math.floor((size - dh) / 2)
        c.clearRect(0, 0, size, size)
        c.drawImage(imageBitmap, dx, dy, dw, dh)

        // 导出 PNG buffer
        // eslint-disable-next-line no-await-in-loop
        const pngBuf = await new Promise<ArrayBuffer>((resolve, reject) => {
          canvasIco.toBlob(async (b) => {
            if (!b) return reject(new Error('PNG 导出失败'))
            resolve(await b.arrayBuffer())
          }, 'image/png')
        })
        pngBuffers.push(pngBuf)
      }

      // 组装 ICO
      const icoBuf = buildIcoFromPngBuffers(pngBuffers, sizes)
      const blob = new Blob([icoBuf], { type: 'image/x-icon' })
      outputBlob.value = blob
      revokeUrl()
      outputUrl.value = URL.createObjectURL(blob)
      await probeOutputInfo()
      return
    }

    // 目标为 GIF：
    if (targetFormat.value === 'gif') {
      // 若源就是 GIF，使用 gifenc 保留动画并优化质量
      if (sourceImage.value.type === 'image/gif') {
        try {
          const [{ parseGIF, decompressFrames }, { GIFEncoder, quantize, applyPalette }] = await Promise.all([
            import('gifuct-js') as any,
            import('gifenc') as any,
          ])
          
          const arrayBuffer = await sourceImage.value.file.arrayBuffer()
          const gif = parseGIF(arrayBuffer)
          const frames = decompressFrames(gif, true) as Array<any>
          if (!frames || frames.length === 0) throw new Error('解析 GIF 失败')

          // 使用 gifenc 创建高质量编码器
          const gifEncoder = new GIFEncoder()
          gifEncoder.width = targetW
          gifEncoder.height = targetH

          const canvas2 = document.createElement('canvas')
          const ctx2 = canvas2.getContext('2d', { willReadFrequently: true })!
          const originalW = frames[0].dims.width
          const originalH = frames[0].dims.height
          canvas2.width = originalW
          canvas2.height = originalH

          const resizeCanvas = document.createElement('canvas')
          const resizeCtx = resizeCanvas.getContext('2d', { willReadFrequently: true })!
          resizeCanvas.width = targetW
          resizeCanvas.height = targetH

          let previousCanvasSnapshot: ImageData | null = null
          const maxFrames = Math.min(frames.length, 300) // 限制帧数

          for (let i = 0; i < maxFrames; i++) {
            const f = frames[i]
            
            if (f.disposalType === 3) {
              previousCanvasSnapshot = ctx2.getImageData(0, 0, originalW, originalH)
            }
            
            const imageData = new ImageData(new Uint8ClampedArray(f.patch), f.dims.width, f.dims.height)
            ctx2.putImageData(imageData, f.dims.left, f.dims.top)

            // 缩放到目标尺寸
            resizeCtx.clearRect(0, 0, targetW, targetH)
            resizeCtx.drawImage(canvas2, 0, 0, targetW, targetH)

            // 获取帧数据并使用 gifenc 高质量量化
            const frameData = resizeCtx.getImageData(0, 0, targetW, targetH)
            
            // 使用高质量量化
            const palette = quantize(frameData.data, Math.max(2, Math.min(256, gifColors.value)))
            const indexedPixels = applyPalette(frameData.data, palette)
            
            const delay = Math.max(gifDelay.value, f.delay || 100)
            gifEncoder.writeFrame(indexedPixels, targetW, targetH, {
              palette,
              delay,
              disposal: f.disposalType || 0
            })

            if (f.disposalType === 2) {
              ctx2.clearRect(f.dims.left, f.dims.top, f.dims.width, f.dims.height)
            } else if (f.disposalType === 3 && previousCanvasSnapshot) {
              ctx2.putImageData(previousCanvasSnapshot, 0, 0)
            }
          }

          // 完成编码
          gifEncoder.finish()
          const gifBuffer = gifEncoder.bytes()
          const blob = new Blob([gifBuffer], { type: 'image/gif' })
          
          outputBlob.value = blob
          revokeUrl()
          outputUrl.value = URL.createObjectURL(blob)
          await probeOutputInfo()
          return
        } catch (e) {
          console.error('GIF 转换失败:', e)
          // 退化为单帧
        }
      }
      // 非 GIF 或保留动画失败：单帧重编码
      const { GIFEncoder, quantize, applyPalette } = await import('gifenc') as any
      const ctx2d = canvas.getContext('2d', { willReadFrequently: true })!
      const { data, width, height } = ctx2d.getImageData(0, 0, canvas.width, canvas.height)
      const palette = quantize(data, Math.max(2, Math.min(256, gifColors.value)))
      const index = applyPalette(data, palette)
      const gif = new GIFEncoder()
      gif.width = width
      gif.height = height
      gif.writeFrame(index, width, height, { palette, delay: Math.max(0, gifDelay.value) })
      gif.finish()
      const u8 = gif.bytes()
      const blob = new Blob([u8], { type: 'image/gif' })
      outputBlob.value = blob
      revokeUrl()
      outputUrl.value = URL.createObjectURL(blob)
      await probeOutputInfo()
      return
    }

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(
        (b) => resolve(b),
        mime,
        mime === 'image/png' ? undefined : quality.value
      )
    )

    if (!blob) throw new Error('转换失败')
    outputBlob.value = blob
    revokeUrl()
    outputUrl.value = URL.createObjectURL(blob)
    await probeOutputInfo()
  } catch (err) {
    console.error(err)
    alert('处理失败，请更换图片或降低质量系数')
  } finally {
    isProcessing.value = false
  }
}

function buildIcoFromPngBuffers(pngBuffers: ArrayBuffer[], sizes: number[]): ArrayBuffer {
  const count = pngBuffers.length
  const dirSize = 6 + 16 * count
  const imageDataSizes = pngBuffers.map((b) => b.byteLength)
  const totalSize = dirSize + imageDataSizes.reduce((a, b) => a + b, 0)
  const buf = new ArrayBuffer(totalSize)
  const view = new DataView(buf)
  let offset = 0
  // ICONDIR
  view.setUint16(offset, 0, true); offset += 2 // Reserved
  view.setUint16(offset, 1, true); offset += 2 // Type: 1=ICON
  view.setUint16(offset, count, true); offset += 2 // Count
  // Compute image offsets start
  let imageOffset = 6 + 16 * count
  // Directory entries
  for (let i = 0; i < count; i += 1) {
    const size = sizes[i]
    const pngSize = imageDataSizes[i]
    // width/height: 0 means 256
    const wh = size === 256 ? 0 : size
    new Uint8Array(buf, offset, 4).set(new Uint8Array([wh, wh, 0, 0])); offset += 4
    view.setUint16(offset, 1, true); offset += 2 // planes
    view.setUint16(offset, 32, true); offset += 2 // bitCount
    view.setUint32(offset, pngSize, true); offset += 4 // bytesInRes
    view.setUint32(offset, imageOffset, true); offset += 4 // imageOffset
    imageOffset += pngSize
  }
  // Image data
  let write = 6 + 16 * count
  for (let i = 0; i < count; i += 1) {
    new Uint8Array(buf, write, imageDataSizes[i]).set(new Uint8Array(pngBuffers[i]))
    write += imageDataSizes[i]
  }
  return buf
}

async function probeOutputInfo() {
  if (!outputBlob.value || !outputUrl.value) {
    outputInfo.value = null
    return
  }
  const img = new Image()
  const url = outputUrl.value
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => resolve() // 即使加载失败也不阻断
    img.src = url
  })
  outputInfo.value = {
    width: (img.naturalWidth || 0),
    height: (img.naturalHeight || 0),
    size: outputBlob.value.size,
    type: outputBlob.value.type,
  }
}

function download() {
  if (!outputBlob.value) return
  const a = document.createElement('a')
  a.href = outputUrl.value as string
  a.download = outputName.value
  a.click()
}

onMounted(() => {
  window.addEventListener('dragover', (e) => e.preventDefault())
  window.addEventListener('drop', (e) => e.preventDefault())
})
</script>

<template>
  <main class="min-h-[calc(100vh-56px)] flex flex-col items-center px-4 py-8 md:py-14">
    <section class="mx-auto max-w-6xl w-full mt-2">
      <!-- 页面标题 -->
      <div class="text-center mb-8">
        <h1 class="text-2xl md:text-3xl font-700">图片格式转换</h1>
        <p class="mt-2 text-sm op-70">支持 PNG / JPG / JPEG / WEBP / GIF / ICO 互转</p>
      </div>
      <div class="grid md:grid-cols-2 gap-6 md:gap-8">
        <!-- 上传区 -->
        <a-card class="h-full" :bordered="false">
          <template #title>
            <div class="flex items-center gap-2">
              <span class="i-lucide-image-plus text-lg"></span>
              源图片
            </div>
          </template>
          <div
            class="relative border-2 border-dashed rd-4 p-8 transition-all"
            :class="dragOver ? 'border-[#a78bfa] bg-[#a78bfa]/5' : 'border-black/20'"
            @dragenter.prevent="dragOver = true"
            @dragleave.prevent="dragOver = false"
            @drop.prevent="onDrop">
            <div class="flex flex-col items-center gap-4">
              <div class="i-lucide-image text-5xl text-black/40"></div>
              <p class="text-center text-sm op-80">
                拖拽图片到此处，或
                <label class="cursor-pointer text-[#a78bfa] underline decoration-dotted">
                  点击选择
                  <input class="hidden" type="file" accept="image/png, image/jpeg, image/webp, image/gif" @change="onFileChange" />
                </label>
              </p>
              <div v-if="sourceImage" class="w-full mt-2">
                <a-descriptions :column="1" size="small" bordered>
                  <a-descriptions-item label="文件名">{{ sourceImage!.name }}</a-descriptions-item>
                  <a-descriptions-item label="大小">{{ readableSize(sourceImage!.size) }}</a-descriptions-item>
                  <a-descriptions-item label="类型">{{ sourceImage!.type }}</a-descriptions-item>
                </a-descriptions>
                <img :src="sourceImage!.url" alt="preview" class="mt-3 w-full rd-3 shadow-lg" />
              </div>
            </div>
          </div>
        </a-card>

        <!-- 设置与结果 -->
        <a-card class="h-full" :bordered="false">
          <template #title>
            <div class="flex items-center gap-2">
              <span class="i-lucide-palette text-lg"></span>
              转换设置
            </div>
          </template>
          <a-form layout="vertical">
            <a-form-item label="目标格式">
              <a-segmented v-model:value="(targetFormat as any)" :options="formatOptions as unknown as string[]" />
            </a-form-item>

            <a-row :gutter="16">
              <a-col :span="12">
                <a-form-item label="最大宽度">
                  <a-input-number v-model:value="maxWidth" :min="1" :placeholder="'不限制'" class="w-full" />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="最大高度">
                  <a-input-number v-model:value="maxHeight" :min="1" :placeholder="'不限制'" class="w-full" />
                </a-form-item>
              </a-col>
            </a-row>

            <a-form-item v-if="targetFormat === 'jpeg' || targetFormat === 'jpg' || targetFormat === 'webp'">
              <template #label>
                <div class="flex items-center justify-between w-full">
                  <span>质量</span>
                  <span class="text-xs op-70">{{ Math.round(quality * 100) }}%</span>
                </div>
              </template>
              <a-slider v-model:value="quality" :min="0.1" :max="1" :step="0.05" />
            </a-form-item>

            <a-form-item v-if="targetFormat === 'jpeg' || targetFormat === 'jpg'" label="JPEG 背景色">
              <a-input v-model:value="jpegBg" type="color" />
            </a-form-item>

            <template v-if="targetFormat === 'gif'">
              <a-divider class="my-4">GIF 参数</a-divider>
              <a-row :gutter="16">
                <a-col :span="12">
                  <a-form-item label="颜色数">
                    <a-input-number v-model:value="gifColors" :min="2" :max="256" class="w-full" />
                  </a-form-item>
                </a-col>
                <a-col :span="12">
                  <a-form-item label="帧延迟(ms)">
                    <a-input-number v-model:value="gifDelay" :min="0" class="w-full" />
                  </a-form-item>
                </a-col>
              </a-row>
            </template>

            <a-form-item>
              <div class="flex gap-3">
                <a-button
                  type="primary"
                  class="flex-1"
                  :loading="isProcessing"
                  :disabled="!sourceImage"
                  @click="convert">
                  <span class="i-lucide-arrow-left-right mr-2"></span>
                  转换
                </a-button>
                <a-button :disabled="!outputBlob" @click="download">
                  <span class="i-lucide-arrow-down mr-2"></span>
                  下载
                </a-button>
              </div>
            </a-form-item>

            <div v-if="outputBlob" class="mt-4">
              <a-alert type="success" show-icon>
                <template #message>转换完成</template>
                <template #description>
                  <a-descriptions :column="2" size="small" class="mt-2">
                    <a-descriptions-item label="文件名">{{ outputName }}</a-descriptions-item>
                    <a-descriptions-item label="大小">{{ readableSize(outputBlob!.size) }}</a-descriptions-item>
                    <a-descriptions-item v-if="outputInfo" label="尺寸">{{ outputInfo.width }}×{{ outputInfo.height }}</a-descriptions-item>
                    <a-descriptions-item v-if="outputInfo" label="类型">{{ outputInfo.type }}</a-descriptions-item>
                  </a-descriptions>
                </template>
              </a-alert>
              <img v-if="outputUrl" :src="outputUrl" alt="result" class="mt-3 w-full rd-3 shadow-lg" />
            </div>
          </a-form>
        </a-card>
      </div>
    </section>
  </main>
</template>


