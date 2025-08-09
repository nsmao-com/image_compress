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
const isProcessing = ref(false)
const dragOver = ref(false)

// 通用与 GIF 专用参数
const maxWidth = ref<number | null>(null)
const maxHeight = ref<number | null>(null)
const gifOptimizeLevel = ref(3) // 优化级别 1-3
const gifLossyLevel = ref(0) // 有损压缩级别 0(关闭)-200
const gifDither = ref(false) // 抖动
const gifCareful = ref(true) // 谨慎模式，保持更好质量
const gifMinDelay = ref(10) // ms，避免 0 导致过快
const preserveOriginalColors = ref(true) // 保持原始颜色数量
const customColors = ref(128) // 自定义颜色数量 2-256
const colorMethod = ref('diversity') // 颜色选择方法
const removeComments = ref(true) // 移除注释减小文件
const removeExtensions = ref(false) // 移除扩展数据
const interlace = ref(false) // 交错模式
const noBackground = ref(false) // 移除背景颜色
const frameDelay = ref(0) // 帧延迟时间（0=不修改）
const loopCount = ref(-1) // 循环次数（-1=不修改，0=无限循环）

const readableSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

const outputName = computed(() => {
  if (!sourceImage.value) return 'compressed'
  const base = sourceImage.value.name.replace(/\.(png|jpg|jpeg|webp|gif)$/i, '')
  const ext = (sourceImage.value.type.match(/image\/(png|jpeg|webp|gif)/)?.[1] || 'jpeg').replace('jpeg', 'jpg')
  return `${base}-min.${ext}`
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

async function compress() {
  if (!sourceImage.value) return
  isProcessing.value = true
  try {
    const imageBitmap = await createImageBitmap(sourceImage.value.file)
    const canvas = document.createElement('canvas')
    // 可选缩放
    const targetW = maxWidth.value ? Math.min(maxWidth.value, imageBitmap.width) : imageBitmap.width
    const targetH = maxHeight.value ? Math.min(maxHeight.value, imageBitmap.height) : imageBitmap.height
    canvas.width = targetW
    canvas.height = targetH
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!
    ctx.drawImage(imageBitmap, 0, 0, targetW, targetH)

    // GIF 压缩：使用 gifsicle-wasm 进行简单可靠的压缩
    if (sourceImage.value.type === 'image/gif') {
      try {
        // 方法1：使用 gifsicle-wasm (修复导入问题)
        try {
          const gifsicleModule = await import('gifsicle-wasm-browser') as any
          const gifsicle = gifsicleModule.default || gifsicleModule
          const inputBuffer = await sourceImage.value.file.arrayBuffer()
          
          // 检查API是否可用
          if (typeof gifsicle.run !== 'function') {
            throw new Error('Gifsicle API 不可用')
          }
          
          // 构建 gifsicle 命令（根据官方文档优化）
          let command = `--optimize=${gifOptimizeLevel.value}` // 优化级别 1-3
          
          // 谨慎模式：保持更好的质量和兼容性
          if (gifCareful.value) {
            command += ' --careful'
          }
          
          // 移除元数据以减小文件大小
          if (removeComments.value) {
            command += ' --no-comments'
          }
          if (removeExtensions.value) {
            command += ' --no-extensions --no-names'
          }
          
          // 有损压缩：基于质量滑块和专门的有损级别
          if (gifLossyLevel.value > 0) {
            command += ` --lossy=${gifLossyLevel.value}`
          } else if (quality.value < 1) {
            // 根据质量滑块自动设置有损级别
            const autoLossy = Math.round((1 - quality.value) * 80) // 0-80 range
            if (autoLossy > 0) {
              command += ` --lossy=${autoLossy}`
            }
          }
          
          // 颜色控制
          if (!preserveOriginalColors.value) {
            // 使用自定义颜色数量，确保在2-256范围内
            const targetColors = Math.max(2, Math.min(256, customColors.value))
            command += ` --colors=${targetColors}`
            
            // 颜色选择方法
            command += ` --color-method=${colorMethod.value}`
            
            // 抖动设置
            if (gifDither.value) {
              command += ' --dither'
            } else {
              command += ' --no-dither'
            }
          }
          
          // 其他优化选项
          if (interlace.value) {
            command += ' --interlace'
          }
          
          if (noBackground.value) {
            command += ' --no-background'
          }
          
          // 动画控制
          if (frameDelay.value > 0) {
            command += ` --delay=${frameDelay.value}`
          }
          
          if (loopCount.value >= 0) {
            command += ` --loopcount=${loopCount.value}`
          }
          
          // 尺寸调整
          if (maxWidth.value || maxHeight.value) {
            if (maxWidth.value && maxHeight.value) {
              command += ` --resize-fit ${maxWidth.value}x${maxHeight.value}`
            } else if (maxWidth.value) {
              command += ` --resize-fit ${maxWidth.value}x_`
            } else if (maxHeight.value) {
              command += ` --resize-fit _x${maxHeight.value}`
            }
          }
          
          // 完整命令：输入文件 + 参数 + 输出文件
          const fullCommand = `${command} input.gif -o /out/output.gif`
          
          // 尝试不同的输入格式
          let result
          try {
            // 方式1：使用 ArrayBuffer
            result = await gifsicle.run({
              input: [{
                file: inputBuffer,
                name: 'input.gif'
              }],
              command: [fullCommand]
            })
          } catch (bufferErr) {
            // ArrayBuffer 格式失败，尝试 File 对象
            // 方式2：直接使用原始 File 对象
            result = await gifsicle.run({
              input: [{
                file: sourceImage.value.file,
                name: 'input.gif'
              }],
              command: [fullCommand]
            })
          }
          
          // gifsicle 处理成功
          
          if (result && result.length > 0) {
            // gifsicle返回的是File对象数组，直接使用第一个
            const outputFile = result[0]
            if (outputFile) {
              // 如果是File对象，直接使用；如果有file属性，则使用file属性
              const fileData = outputFile.file || outputFile
              const blob = fileData instanceof File ? fileData : new Blob([fileData], { type: 'image/gif' })
              
              outputBlob.value = blob
              revokeUrl()
              outputUrl.value = URL.createObjectURL(blob)
              await probeOutputInfo()
              return
            }
          }
        } catch (gifsicleErr) {
          // gifsicle-wasm 失败，使用备用方法
        }
        
        // 方法2：备用方案 - 简单的 Canvas 基础压缩
        const img = new Image()
        img.src = URL.createObjectURL(sourceImage.value.file)
        await new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = reject
        })

        // 计算目标尺寸
        let finalW = img.naturalWidth
        let finalH = img.naturalHeight
        
        if (maxWidth.value && finalW > maxWidth.value) {
          finalH = Math.round((finalH * maxWidth.value) / finalW)
          finalW = maxWidth.value
        }
        if (maxHeight.value && finalH > maxHeight.value) {
          finalW = Math.round((finalW * maxHeight.value) / finalH)
          finalH = maxHeight.value
        }

        // 如果无需缩放且所有参数都是默认的，直接返回原文件
        const isLossless = gifLossyLevel.value === 0 && quality.value === 1 && preserveOriginalColors.value
        if (isLossless && finalW === img.naturalWidth && finalH === img.naturalHeight) {
          outputBlob.value = sourceImage.value.file
          revokeUrl()
          outputUrl.value = URL.createObjectURL(sourceImage.value.file)
          await probeOutputInfo()
          return
        }
        
        // 基础 Canvas 处理（仅适用于简单情况）
        const canvas = document.createElement('canvas')
        canvas.width = finalW
        canvas.height = finalH
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, finalW, finalH)
        
        const blob: Blob | null = await new Promise((resolve) =>
          canvas.toBlob(resolve, 'image/gif', quality.value)
        )
        
        if (!blob) throw new Error('Canvas 压缩失败')
        
        outputBlob.value = blob
        revokeUrl()
        outputUrl.value = URL.createObjectURL(blob)
        await probeOutputInfo()
        return
        
      } catch (err) {
        alert('GIF 压缩失败，请尝试调整压缩参数或使用其他图片。')
        isProcessing.value = false
        return
      }
    }

    // 非 GIF：保持原格式压缩（PNG 无损，大小变化有限）
    let mime = sourceImage.value.type
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(mime)) {
      alert('暂不支持此格式的压缩')
      isProcessing.value = false
      return
    }

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(
        (b) => resolve(b),
        mime,
        mime === 'image/png' ? undefined : quality.value
      )
    )

    if (!blob) throw new Error('压缩失败')
    outputBlob.value = blob
    revokeUrl()
    outputUrl.value = URL.createObjectURL(blob)
    await probeOutputInfo()
  } catch (err) {
    alert('处理失败，请检查图片格式或调整压缩参数')
  } finally {
    isProcessing.value = false
  }
}

async function probeOutputInfo() {
  if (!outputBlob.value || !outputUrl.value) {
    outputInfo.value = null
    return
  }
  const img = new Image()
  const url = outputUrl.value
  await new Promise<void>((resolve) => {
    img.onload = () => resolve()
    img.onerror = () => resolve()
    img.src = url
  })
  outputInfo.value = {
    width: img.naturalWidth || 0,
    height: img.naturalHeight || 0,
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
        <h1 class="text-2xl md:text-3xl font-700">图片压缩优化</h1>
        <p class="mt-2 text-sm op-70">保持原格式，智能压缩，支持多种参数调节</p>
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
            :class="dragOver ? 'border-[#f472b6] bg-[#f472b6]/5' : 'border-black/20'"
            @dragenter.prevent="dragOver = true"
            @dragleave.prevent="dragOver = false"
            @drop.prevent="onDrop">
            <div class="flex flex-col items-center gap-4">
              <div class="i-lucide-image text-5xl text-black/40"></div>
              <p class="text-center text-sm op-80">
                拖拽图片到此处，或
                <label class="cursor-pointer text-[#f472b6] underline decoration-dotted">
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
              <span class="i-lucide-scissors text-lg"></span>
              压缩设置
            </div>
          </template>
          <a-form layout="vertical">
            <a-form-item>
              <template #label>
                <div class="flex items-center justify-between w-full">
                  <span>压缩质量 (仅 JPEG/WEBP)</span>
                  <span class="text-xs op-70">{{ Math.round(quality * 100) }}%</span>
                </div>
              </template>
              <a-slider v-model:value="quality" :min="0.1" :max="1" :step="0.05" />
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

            <template v-if="sourceImage?.type === 'image/gif'">
              <a-divider class="my-4">
                <span class="flex items-center gap-2">
                  <span class="i-lucide-sparkles text-purple-500"></span>
                  GIF 高级参数 (Gifsicle 引擎)
                </span>
              </a-divider>
              <a-row :gutter="16">
                <a-col :span="12">
                  <a-form-item>
                    <template #label>
                      <div class="flex items-center justify-between w-full">
                        <span>优化级别</span>
                        <span class="text-xs op-70">{{ gifOptimizeLevel }}</span>
                      </div>
                    </template>
                    <a-slider v-model:value="gifOptimizeLevel" :min="1" :max="3" :step="1" :marks="{1: '基础', 2: '标准', 3: '最佳'}" />
                  </a-form-item>
                </a-col>
                <a-col :span="12">
                  <a-form-item>
                    <template #label>
                      <div class="flex items-center justify-between w-full">
                        <span>有损压缩级别</span>
                        <span class="text-xs op-70">{{ gifLossyLevel === 0 ? '关闭' : gifLossyLevel }}</span>
                      </div>
                    </template>
                    <a-slider v-model:value="gifLossyLevel" :min="0" :max="100" :step="5" />
                  </a-form-item>
                </a-col>
              </a-row>

              <a-row :gutter="16">
                <a-col :span="12">
                  <a-form-item label="保持原始颜色数">
                    <a-switch v-model:checked="preserveOriginalColors" />
                  </a-form-item>
                </a-col>
                <a-col :span="12">
                  <a-form-item label="抖动算法" v-if="!preserveOriginalColors">
                    <a-switch v-model:checked="gifDither" />
                  </a-form-item>
                </a-col>
              </a-row>

              <a-row :gutter="16" v-if="!preserveOriginalColors">
                <a-col :span="24">
                  <a-form-item>
                    <template #label>
                      <div class="flex items-center justify-between w-full">
                        <span>颜色数量 (--colors)</span>
                        <span class="text-xs op-70">{{ customColors }} 色</span>
                      </div>
                    </template>
                    <a-slider 
                      v-model:value="customColors" 
                      :min="2" 
                      :max="256" 
                      :step="1"
                      :marks="{
                        2: '2',
                        16: '16',
                        32: '32', 
                        64: '64',
                        128: '128',
                        256: '256'
                      }"
                    />
                    <div class="text-xs op-60 mt-1">
                      根据官方文档：数值必须在 2-256 之间。可用于缩小GIF文件或消除局部颜色表。
                    </div>
                  </a-form-item>
                </a-col>
              </a-row>

              <a-row :gutter="16" v-if="!preserveOriginalColors">
                <a-col :span="24">
                  <a-form-item label="颜色选择方法">
                    <a-radio-group v-model:value="colorMethod" button-style="solid" size="small" class="w-full">
                      <a-radio-button value="diversity" class="flex-1 text-center">
                        Diversity
                        <div class="text-xs op-70">默认算法</div>
                      </a-radio-button>
                      <a-radio-button value="blend-diversity" class="flex-1 text-center">
                        Blend-Diversity  
                        <div class="text-xs op-70">颜色混合</div>
                      </a-radio-button>
                      <a-radio-button value="median-cut" class="flex-1 text-center">
                        Median-Cut
                        <div class="text-xs op-70">中位数切割</div>
                      </a-radio-button>
                    </a-radio-group>
                  </a-form-item>
                </a-col>
              </a-row>

              <a-row :gutter="16">
                <a-col :span="12">
                  <a-form-item label="谨慎模式 (更好质量)">
                    <a-switch v-model:checked="gifCareful" />
                  </a-form-item>
                </a-col>
                <a-col :span="12">
                  <a-form-item label="移除注释数据">
                    <a-switch v-model:checked="removeComments" />
                  </a-form-item>
                </a-col>
              </a-row>

              <a-row :gutter="16">
                <a-col :span="12">
                  <a-form-item label="移除扩展数据">
                    <a-switch v-model:checked="removeExtensions" />
                  </a-form-item>
                </a-col>
                <a-col :span="12">
                  <!-- 移到下面动画控制区域 -->
                </a-col>
              </a-row>

              <a-row :gutter="16">
                <a-col :span="12">
                  <a-form-item label="移除背景颜色">
                    <a-switch v-model:checked="noBackground" />
                  </a-form-item>
                </a-col>
                <a-col :span="12">
                  <a-form-item label="交错模式">
                    <a-switch v-model:checked="interlace" />
                  </a-form-item>
                </a-col>
              </a-row>

              <a-divider class="my-4">动画控制</a-divider>
              
              <a-row :gutter="16">
                <a-col :span="12">
                  <a-form-item label="帧延迟 (--delay)">
                    <a-input-number 
                      v-model:value="frameDelay" 
                      :min="0" 
                      :max="6553" 
                      placeholder="0=不修改"
                      addon-after="× 1/100秒"
                      class="w-full" 
                    />
                    <div class="text-xs op-60 mt-1">设置所有帧的延迟时间，0表示不修改</div>
                  </a-form-item>
                </a-col>
                <a-col :span="12">
                  <a-form-item label="循环次数 (--loopcount)">
                    <a-input-number 
                      v-model:value="loopCount" 
                      :min="-1" 
                      :max="65535"
                      placeholder="-1=不修改"
                      class="w-full" 
                    />
                    <div class="text-xs op-60 mt-1">-1=不修改，0=无限循环，>0=指定次数</div>
                  </a-form-item>
                </a-col>
              </a-row>

              <a-row :gutter="16">
                <a-col :span="12">
                  <a-form-item label="最小帧延迟保护(ms)">
                    <a-input-number v-model:value="gifMinDelay" :min="0" class="w-full" />
                    <div class="text-xs op-60 mt-1">防止动画播放过快的保护机制</div>
                  </a-form-item>
                </a-col>
                <a-col :span="12">
                  <!-- 预留位置 -->
                </a-col>
              </a-row>
              <a-alert type="info" show-icon class="mt-2 mb-2">
                <template #message>Gifsicle 专业压缩引擎</template>
                <template #description>
                  • <strong>工业级标准</strong>：使用 <a href="https://www.lcdf.org/gifsicle/" target="_blank" class="text-blue-500 underline">Gifsicle</a>（Linux/Web 标准GIF优化工具）<br/>
                  • <strong>优化级别</strong>：1=基础优化，2=标准压缩，3=最佳效果<br/>
                  • <strong>有损压缩</strong>：0-100级别，数值越高压缩越强<br/>
                  • <strong>颜色控制</strong>：--colors 参数精确控制颜色数量（2-256），配合颜色算法使用<br/>
                  • <strong>颜色算法</strong>：Diversity（默认），Blend-Diversity（混合），Median-Cut（精确）<br/>
                  • <strong>动画控制</strong>：--delay 帧延迟、--loopcount 循环次数等专业动画参数<br/>
                  • <strong>专业选项</strong>：交错模式、背景优化、元数据处理等
                </template>
              </a-alert>
            </template>

            <a-form-item>
              <div class="flex gap-3">
                <a-button
                  type="primary"
                  class="flex-1"
                  :loading="isProcessing"
                  :disabled="!sourceImage"
                  @click="compress">
                  <span class="i-lucide-scissors mr-2"></span>
                  压缩
                </a-button>
                <a-button :disabled="!outputBlob" @click="download">
                  <span class="i-lucide-arrow-down mr-2"></span>
                  下载
                </a-button>
              </div>
            </a-form-item>

            <div v-if="outputBlob" class="mt-4">
              <a-alert type="success" show-icon>
                <template #message>压缩完成</template>
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


