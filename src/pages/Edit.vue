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
const isProcessing = ref(false)
const dragOver = ref(false)

// 尺寸控制
const maxWidth = ref<number | null>(null)
const maxHeight = ref<number | null>(null)

// 旋转控制（度）
const rotateDeg = ref(0)
const flipH = ref(false)
const flipV = ref(false)

// 水印控制
const wmText = ref('© Watermark')
const wmFontSize = ref(20)
const wmColor = ref('#000000')
const wmOpacity = ref(0.35)
const wmBold = ref(true)
const wmShadow = ref(true)
const wmPosition = ref<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'>('bottom-right')
const wmMargin = ref(16)

const readableSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function revokeUrl() {
  if (outputUrl.value) URL.revokeObjectURL(outputUrl.value)
}

async function loadFile(file: File) {
  const accept = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
  if (!accept.includes(file.type)) {
    alert('仅支持 PNG / JPEG / WEBP / GIF 图片')
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

function drawWatermark(ctx: CanvasRenderingContext2D, width: number, height: number) {
  if (!wmText.value) return
  ctx.save()
  ctx.globalAlpha = Math.max(0, Math.min(1, wmOpacity.value))
  ctx.fillStyle = wmColor.value
  ctx.font = `${wmBold.value ? '700' : '400'} ${wmFontSize.value}px system-ui, -apple-system, Segoe UI, Roboto, sans-serif`
  if (wmShadow.value) {
    ctx.shadowColor = 'rgba(0,0,0,0.25)'
    ctx.shadowBlur = 4
    ctx.shadowOffsetX = 1
    ctx.shadowOffsetY = 1
  }
  const metrics = ctx.measureText(wmText.value)
  const textWidth = metrics.width
  const textHeight = wmFontSize.value
  let x = wmMargin.value
  let y = wmMargin.value + textHeight
  switch (wmPosition.value) {
    case 'top-left':
      x = wmMargin.value
      y = wmMargin.value + textHeight
      break
    case 'top-right':
      x = width - wmMargin.value - textWidth
      y = wmMargin.value + textHeight
      break
    case 'bottom-left':
      x = wmMargin.value
      y = height - wmMargin.value
      break
    case 'bottom-right':
      x = width - wmMargin.value - textWidth
      y = height - wmMargin.value
      break
    case 'center':
      x = (width - textWidth) / 2
      y = (height + textHeight) / 2
      break
  }
  ctx.fillText(wmText.value, x, y)
  ctx.restore()
}

async function applyEdit() {
  if (!sourceImage.value) return
  isProcessing.value = true
  try {
    const imageBitmap = await createImageBitmap(sourceImage.value.file)
    const srcW = imageBitmap.width
    const srcH = imageBitmap.height
    const targetW = maxWidth.value ? Math.min(maxWidth.value, srcW) : srcW
    const targetH = maxHeight.value ? Math.min(maxHeight.value, srcH) : srcH

    // 考虑旋转后的画布尺寸
    const rad = (rotateDeg.value * Math.PI) / 180
    const cos = Math.abs(Math.cos(rad))
    const sin = Math.abs(Math.sin(rad))
    const outW = Math.round(targetW * cos + targetH * sin)
    const outH = Math.round(targetW * sin + targetH * cos)

    const canvas = document.createElement('canvas')
    canvas.width = outW
    canvas.height = outH
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!

    ctx.translate(outW / 2, outH / 2)
    ctx.rotate(rad)
    ctx.scale(flipH.value ? -1 : 1, flipV.value ? -1 : 1)
    ctx.drawImage(imageBitmap, -targetW / 2, -targetH / 2, targetW, targetH)

    // 画水印
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    drawWatermark(ctx, outW, outH)

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/png')
    )
    if (!blob) throw new Error('导出失败')
    outputBlob.value = blob
    if (outputUrl.value) URL.revokeObjectURL(outputUrl.value)
    outputUrl.value = URL.createObjectURL(blob)
  } catch (e) {
    console.error(e)
    alert('处理失败')
  } finally {
    isProcessing.value = false
  }
}

function download() {
  if (!outputBlob.value) return
  const a = document.createElement('a')
  a.href = outputUrl.value as string
  a.download = (sourceImage.value?.name || 'edited').replace(/\.(png|jpg|jpeg|webp|gif)$/i, '') + '-edited.png'
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
        <h1 class="text-2xl md:text-3xl font-700">图片编辑处理</h1>
        <p class="mt-2 text-sm op-70">加水印 · 旋转翻转 · 尺寸调整</p>
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
            :class="dragOver ? 'border-[#22c55e] bg-[#22c55e]/5' : 'border-black/20'"
            @dragenter.prevent="dragOver = true"
            @dragleave.prevent="dragOver = false"
            @drop.prevent="onDrop">
            <div class="flex flex-col items-center gap-4">
              <div class="i-lucide-image text-5xl text-black/40"></div>
              <p class="text-center text-sm op-80">
                拖拽图片到此处，或
                <label class="cursor-pointer text-[#22c55e] underline decoration-dotted">
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
                <a-alert v-if="sourceImage?.type === 'image/gif'" type="warning" class="mt-2" show-icon>
                  <template #message>提示：编辑暂只处理 GIF 首帧</template>
                </a-alert>
              </div>
            </div>
          </div>
        </a-card>

        <!-- 设置 -->
        <a-card class="h-full" :bordered="false">
          <template #title>
            <div class="flex items-center gap-2">
              <span class="i-lucide-wand-2 text-lg"></span>
              编辑设置
            </div>
          </template>
          <a-form layout="vertical">
            <div class="grid md:grid-cols-2 gap-3">
              <div>
                <div class="text-sm mb-1 op-80">最大宽度</div>
                <a-input-number v-model:value="maxWidth" :min="1" :placeholder="'不限制'" class="w-full" />
              </div>
              <div>
                <div class="text-sm mb-1 op-80">最大高度</div>
                <a-input-number v-model:value="maxHeight" :min="1" :placeholder="'不限制'" class="w-full" />
              </div>
            </div>

            <a-divider class="my-4">旋转与翻转</a-divider>
            <a-row :gutter="16">
              <a-col :span="8">
                <a-form-item label="旋转角度(°)">
                  <a-input-number v-model:value="rotateDeg" :min="-180" :max="180" class="w-full" />
                </a-form-item>
              </a-col>
              <a-col :span="8">
                <a-form-item label="水平翻转">
                  <a-switch v-model:checked="flipH" />
                </a-form-item>
              </a-col>
              <a-col :span="8">
                <a-form-item label="垂直翻转">
                  <a-switch v-model:checked="flipV" />
                </a-form-item>
              </a-col>
            </a-row>

            <a-divider class="my-4">水印设置</a-divider>
            <a-row :gutter="16">
              <a-col :span="12">
                <a-form-item label="水印文字">
                  <a-input v-model:value="wmText" placeholder="输入水印文本" />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="水印颜色">
                  <a-input v-model:value="wmColor" type="color" />
                </a-form-item>
              </a-col>
            </a-row>
            <a-row :gutter="16">
              <a-col :span="8">
                <a-form-item label="字号">
                  <a-input-number v-model:value="wmFontSize" :min="8" :max="200" class="w-full" />
                </a-form-item>
              </a-col>
              <a-col :span="8">
                <a-form-item label="不透明度">
                  <a-input-number v-model:value="wmOpacity" :min="0" :max="1" :step="0.05" class="w-full" />
                </a-form-item>
              </a-col>
              <a-col :span="8">
                <a-form-item label="边距(px)">
                  <a-input-number v-model:value="wmMargin" :min="0" :max="200" class="w-full" />
                </a-form-item>
              </a-col>
            </a-row>
            <a-row :gutter="16">
              <a-col :span="8">
                <a-form-item label="位置">
                  <a-select v-model:value="wmPosition" class="w-full">
                    <a-select-option value="top-left">左上</a-select-option>
                    <a-select-option value="top-right">右上</a-select-option>
                    <a-select-option value="bottom-left">左下</a-select-option>
                    <a-select-option value="bottom-right">右下</a-select-option>
                    <a-select-option value="center">居中</a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
              <a-col :span="8">
                <a-form-item label="字体加粗">
                  <a-switch v-model:checked="wmBold" />
                </a-form-item>
              </a-col>
              <a-col :span="8">
                <a-form-item label="文字阴影">
                  <a-switch v-model:checked="wmShadow" />
                </a-form-item>
              </a-col>
            </a-row>

            <a-form-item>
              <div class="flex gap-3">
                <a-button
                  type="primary"
                  class="flex-1"
                  :loading="isProcessing"
                  :disabled="!sourceImage"
                  @click="applyEdit">
                  <span class="i-lucide-wand-2 mr-2"></span>
                  应用并预览
                </a-button>
                <a-button :disabled="!outputBlob" @click="download">
                  <span class="i-lucide-arrow-down mr-2"></span>
                  下载结果
                </a-button>
              </div>
            </a-form-item>

            <div v-if="outputBlob" class="mt-4">
              <a-alert type="success" show-icon>
                <template #message>编辑完成</template>
                <template #description>
                  <a-descriptions :column="2" size="small" class="mt-2">
                    <a-descriptions-item label="格式">PNG</a-descriptions-item>
                    <a-descriptions-item label="大小">{{ readableSize(outputBlob!.size) }}</a-descriptions-item>
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




