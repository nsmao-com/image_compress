<script setup lang="ts">
import { useRoute } from 'vue-router'
const route = useRoute()
</script>

<template>
  <header class="sticky top-0 z-10 w-full backdrop-blur-xl bg-white/70 border-b border-black/10">
    <div class="mx-auto max-w-6xl flex items-center justify-between px-4 py-3">
      <div class="flex items-center gap-3">
        <div class="flex items-center justify-center text-white font-bold w-8 h-8 rd-2 bg-gradient-to-br from-[#6366f1] via-[#a78bfa] to-[#f472b6] shadow-lg shadow-[#a78bfa]/20">
          N
        </div>
        <h1 class="text-lg md:text-xl font-600 tracking-tight mb-0">Image Studio</h1>
      </div>
      <nav class="flex items-center gap-2 text-sm">
        <RouterLink
          to="/"
          class="px-3 py-1 rd-3 border border-black/10 bg-white hover:bg-black/5 transition-all inline-flex items-center gap-2"
          :class="route.name === 'home' ? 'ring-2 ring-[#7dd3fc]' : ''">
          <span class="i-lucide-home"></span>
          首页
        </RouterLink>
        <RouterLink
          to="/convert"
          class="px-3 py-1 rd-3 border border-black/10 bg-white hover:bg-black/5 transition-all inline-flex items-center gap-2"
          :class="route.name === 'convert' ? 'ring-2 ring-[#a78bfa]' : ''">
          <span class="i-lucide-arrow-left-right"></span>
          转换
        </RouterLink>
        <RouterLink
          to="/compress"
          class="px-3 py-1 rd-3 border border-black/10 bg-white hover:bg-black/5 transition-all inline-flex items-center gap-2"
          :class="route.name === 'compress' ? 'ring-2 ring-[#f472b6]' : ''">
          <span class="i-lucide-scissors"></span>
          压缩
        </RouterLink>
        <RouterLink
          to="/edit"
          class="px-3 py-1 rd-3 border border-black/10 bg-white hover:bg-black/5 transition-all inline-flex items-center gap-2"
          :class="route.name === 'edit' ? 'ring-2 ring-[#22c55e]' : ''">
          <span class="i-lucide-wand-2"></span>
          编辑
        </RouterLink>
      </nav>
    </div>
  </header>
</template>

<style scoped>
:root { color-scheme: dark; }
</style>


