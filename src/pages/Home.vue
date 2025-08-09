<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <main class="min-h-[calc(100vh-56px)] flex flex-col items-center px-4 py-10 md:py-16 relative overflow-hidden">
    <!-- 背景装饰 -->
    <div class="absolute inset-0 pointer-events-none">
      <div class="absolute top-10 left-10 w-20 h-20 bg-gradient-to-br from-[#f472b6]/20 to-[#a78bfa]/20 rd-999 blur-xl"></div>
      <div class="absolute top-32 right-20 w-16 h-16 bg-gradient-to-br from-[#7dd3fc]/20 to-[#22c55e]/20 rd-999 blur-xl"></div>
      <div class="absolute bottom-32 left-32 w-24 h-24 bg-gradient-to-br from-[#fbbf24]/20 to-[#f472b6]/20 rd-999 blur-xl"></div>
    </div>
    
    <section class="mx-auto max-w-6xl w-full relative z-1">
      <!-- 头部区域 -->
      <div class="text-center">
        <div class="inline-flex items-center gap-3 px-5 py-3 rd-999 bg-white/90 backdrop-blur-xl border border-black/10 shadow-lg shadow-black/5 hover:shadow-xl transition-all duration-300">
          <span class="i-lucide-sparkles text-xl text-[#6366f1] animate-pulse"></span>
          <span class="text-sm font-500 bg-gradient-to-r from-[#6366f1] to-[#a78bfa] bg-clip-text text-transparent">iOS 18 design · 本地处理 · 隐私安全</span>
        </div>
        
        <h1 class="mt-8 text-4xl md:text-6xl font-800 tracking-tight leading-tight">
          <span class="bg-gradient-to-r from-[#0b0b0f] via-[#374151] to-[#0b0b0f] bg-clip-text text-transparent">Image</span>
          <span class="bg-gradient-to-r from-[#6366f1] to-[#a78bfa] bg-clip-text text-transparent ml-2">Studio</span>
        </h1>
        
        <p class="mt-4 text-lg op-80 max-w-2xl mx-auto">
          专业的图片处理工具集 · 支持格式转换、智能压缩、水印编辑
        </p>
        
        <div class="mt-6 flex flex-wrap justify-center gap-2 text-sm op-60">
          <span class="px-3 py-1 bg-white/60 rd-999 border border-black/10">PNG</span>
          <span class="px-3 py-1 bg-white/60 rd-999 border border-black/10">JPG</span>
          <span class="px-3 py-1 bg-white/60 rd-999 border border-black/10">WEBP</span>
          <span class="px-3 py-1 bg-white/60 rd-999 border border-black/10">GIF</span>
          <span class="px-3 py-1 bg-white/60 rd-999 border border-black/10">ICO</span>
        </div>
      </div>

      <!-- 功能卡片区 -->
      <div class="grid md:grid-cols-3 gap-8 mt-16">
        <!-- 转换 -->
        <RouterLink to="/convert" class="group relative rd-6 p-8 border border-black/10 bg-white/80 backdrop-blur-xl hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#7dd3fc]/10 transition-all duration-500 overflow-hidden">
          <!-- 卡片装饰 -->
          <div class="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#7dd3fc]/10 to-[#a78bfa]/10 rd-999 blur-xl -translate-y-4 translate-x-4"></div>
          
          <div class="relative z-1">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rd-3 bg-gradient-to-br from-[#7dd3fc] to-[#a78bfa] shadow-xl shadow-[#7dd3fc]/40 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <span class="i-lucide-arrow-left-right text-xl text-white"></span>
              </div>
              <div>
                <div class="text-xl font-700">图片转换</div>
                <div class="text-xs op-60 mt-1">Format Conversion</div>
              </div>
            </div>
            
            <p class="mt-4 text-base op-80 leading-relaxed">多格式互转，支持质量与尺寸精准控制</p>
            
            <div class="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div class="flex items-center gap-2 op-70">
                <span class="w-1.5 h-1.5 bg-[#7dd3fc] rd-999"></span>
                GIF 动画保留
              </div>
              <div class="flex items-center gap-2 op-70">
                <span class="w-1.5 h-1.5 bg-[#a78bfa] rd-999"></span>
                ICO 多尺寸
              </div>
              <div class="flex items-center gap-2 op-70">
                <span class="w-1.5 h-1.5 bg-[#7dd3fc] rd-999"></span>
                质量可控
              </div>
              <div class="flex items-center gap-2 op-70">
                <span class="w-1.5 h-1.5 bg-[#a78bfa] rd-999"></span>
                批量处理
              </div>
            </div>
            
            <div class="mt-6 flex items-center justify-between">
              <div class="text-sm font-600 bg-gradient-to-r from-[#7dd3fc] to-[#a78bfa] bg-clip-text text-transparent">立即转换</div>
              <span class="i-lucide-arrow-right text-lg op-60 group-hover:op-100 group-hover:translate-x-1 transition-all"></span>
            </div>
          </div>
        </RouterLink>

        <!-- 压缩 -->
        <RouterLink to="/compress" class="group relative rd-6 p-8 border border-black/10 bg-white/80 backdrop-blur-xl hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#f472b6]/10 transition-all duration-500 overflow-hidden">
          <!-- 卡片装饰 -->
          <div class="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#f472b6]/10 to-[#a78bfa]/10 rd-999 blur-xl -translate-y-4 translate-x-4"></div>
          
          <div class="relative z-1">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rd-3 bg-gradient-to-br from-[#f472b6] to-[#a78bfa] shadow-xl shadow-[#f472b6]/40 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <span class="i-lucide-scissors text-xl text-white"></span>
              </div>
              <div>
                <div class="text-xl font-700">图片压缩</div>
                <div class="text-xs op-60 mt-1">Smart Compression</div>
              </div>
            </div>
            
            <p class="mt-4 text-base op-80 leading-relaxed">智能压缩优化，保持原格式与最佳画质</p>
            
            <div class="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div class="flex items-center gap-2 op-70">
                <span class="w-1.5 h-1.5 bg-[#f472b6] rd-999"></span>
                GIF 优化级别
              </div>
              <div class="flex items-center gap-2 op-70">
                <span class="w-1.5 h-1.5 bg-[#a78bfa] rd-999"></span>
                无损压缩
              </div>
              <div class="flex items-center gap-2 op-70">
                <span class="w-1.5 h-1.5 bg-[#f472b6] rd-999"></span>
                尺寸控制
              </div>
              <div class="flex items-center gap-2 op-70">
                <span class="w-1.5 h-1.5 bg-[#a78bfa] rd-999"></span>
                防掉帧技术
              </div>
            </div>
            
            <div class="mt-6 flex items-center justify-between">
              <div class="text-sm font-600 bg-gradient-to-r from-[#f472b6] to-[#a78bfa] bg-clip-text text-transparent">立即压缩</div>
              <span class="i-lucide-arrow-right text-lg op-60 group-hover:op-100 group-hover:translate-x-1 transition-all"></span>
            </div>
          </div>
        </RouterLink>

        <!-- 编辑 -->
        <RouterLink to="/edit" class="group relative rd-6 p-8 border border-black/10 bg-white/80 backdrop-blur-xl hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#22c55e]/10 transition-all duration-500 overflow-hidden">
          <!-- 卡片装饰 -->
          <div class="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#22c55e]/10 to-[#7dd3fc]/10 rd-999 blur-xl -translate-y-4 translate-x-4"></div>
          
          <div class="relative z-1">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rd-3 bg-gradient-to-br from-[#22c55e] to-[#7dd3fc] shadow-xl shadow-[#22c55e]/40 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <span class="i-lucide-wand-2 text-xl text-white"></span>
              </div>
              <div>
                <div class="text-xl font-700">图片编辑</div>
                <div class="text-xs op-60 mt-1">Creative Editing</div>
              </div>
            </div>
            
            <p class="mt-4 text-base op-80 leading-relaxed">专业水印与旋转编辑，精准控制每个细节</p>
            
            <div class="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div class="flex items-center gap-2 op-70">
                <span class="w-1.5 h-1.5 bg-[#22c55e] rd-999"></span>
                文字水印
              </div>
              <div class="flex items-center gap-2 op-70">
                <span class="w-1.5 h-1.5 bg-[#7dd3fc] rd-999"></span>
                自由旋转
              </div>
              <div class="flex items-center gap-2 op-70">
                <span class="w-1.5 h-1.5 bg-[#22c55e] rd-999"></span>
                位置调节
              </div>
              <div class="flex items-center gap-2 op-70">
                <span class="w-1.5 h-1.5 bg-[#7dd3fc] rd-999"></span>
                镜像翻转
              </div>
            </div>
            
            <div class="mt-6 flex items-center justify-between">
              <div class="text-sm font-600 bg-gradient-to-r from-[#22c55e] to-[#7dd3fc] bg-clip-text text-transparent">立即编辑</div>
              <span class="i-lucide-arrow-right text-lg op-60 group-hover:op-100 group-hover:translate-x-1 transition-all"></span>
            </div>
          </div>
        </RouterLink>
      </div>

      <!-- 特性区 -->
      <div class="mt-20">
        <div class="text-center mb-12">
          <h3 class="text-2xl font-700 mb-3">为什么选择 Image Studio</h3>
          <p class="op-70 max-w-lg mx-auto">基于现代 Web 技术打造的专业图片处理工具</p>
        </div>
        
        <div class="grid md:grid-cols-3 gap-8">
          <div class="group rd-6 p-6 border border-black/10 bg-white/60 backdrop-blur-xl hover:bg-white/80 transition-all duration-300">
            <div class="w-14 h-14 rd-4 bg-gradient-to-br from-[#16a34a]/20 to-[#22c55e]/20 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <span class="i-lucide-shield-check text-2xl text-[#16a34a]"></span>
            </div>
            <div class="font-700 text-lg mb-2">隐私安全</div>
            <p class="text-sm op-70 leading-relaxed">所有操作均在浏览器本地完成，图片不上传到任何服务器，确保您的隐私安全。</p>
          </div>
          
          <div class="group rd-6 p-6 border border-black/10 bg-white/60 backdrop-blur-xl hover:bg-white/80 transition-all duration-300">
            <div class="w-14 h-14 rd-4 bg-gradient-to-br from-[#6366f1]/20 to-[#8b5cf6]/20 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <span class="i-lucide-zap text-2xl text-[#6366f1]"></span>
            </div>
            <div class="font-700 text-lg mb-2">高性能处理</div>
            <p class="text-sm op-70 leading-relaxed">基于 Canvas API 与 WebAssembly 技术，GIF 优化使用专业级算法，兼顾速度与品质。</p>
          </div>
          
          <div class="group rd-6 p-6 border border-black/10 bg-white/60 backdrop-blur-xl hover:bg-white/80 transition-all duration-300">
            <div class="w-14 h-14 rd-4 bg-gradient-to-br from-[#f59e0b]/20 to-[#f97316]/20 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <span class="i-lucide-settings text-2xl text-[#f59e0b]"></span>
            </div>
            <div class="font-700 text-lg mb-2">专业可控</div>
            <p class="text-sm op-70 leading-relaxed">丰富的参数设置，详细的输出信息，让您精准控制每一个处理细节。</p>
          </div>
        </div>
      </div>
      
      <!-- 底部装饰 -->
      <div class="mt-20 text-center">
        <div class="inline-flex items-center gap-2 px-4 py-2 rd-999 bg-white/60 border border-black/10 text-sm op-60">
          <span class="i-lucide-heart text-red-500"></span>
          Made with passion for image processing
        </div>
      </div>
    </section>
  </main>
</template>


