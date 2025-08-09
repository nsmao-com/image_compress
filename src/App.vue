<script setup lang="ts">
import NavBar from './components/NavBar.vue'
</script>

<template>
  <div class="min-h-screen font-sans bg-white text-[#0b0b0f]">
    <NavBar />
    <RouterView />
    <footer class="mt-12 text-center op-60 text-xs py-10">
      仅在浏览器本地处理，无文件上传
    </footer>
  </div>
  
</template>

<style scoped>
:root { color-scheme: light; }
</style>


