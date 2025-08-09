import { createRouter, createWebHistory } from 'vue-router'

const Home = () => import('./pages/Home.vue')
const Convert = () => import('./pages/Convert.vue')
const Compress = () => import('./pages/Compress.vue')
const Edit = () => import('./pages/Edit.vue')

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: Home },
    { path: '/convert', name: 'convert', component: Convert },
    { path: '/compress', name: 'compress', component: Compress },
    { path: '/edit', name: 'edit', component: Edit },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})


