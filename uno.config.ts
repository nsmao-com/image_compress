import { defineConfig, presetAttributify, presetUno, presetIcons, presetTypography, transformerDirectives, transformerVariantGroup } from 'unocss'
import { iconsPlugin } from 'unocss'

export default defineConfig({
  safelist: [
    // lucide icons (icones)
    'i-lucide-home',
    'i-lucide-arrow-left-right',
    'i-lucide-scissors',
    'i-lucide-sparkles',
    'i-lucide-arrow-right',
    'i-lucide-image',
    'i-lucide-loader-circle',
    'i-lucide-wand-2',
    'i-lucide-rotate-cw',
    'i-lucide-badge-check',
    'i-lucide-lock',
    'i-lucide-cpu',
    'i-lucide-image-plus',
    'i-lucide-palette',
    'i-lucide-zap',
    'i-lucide-arrow-down',
    'i-lucide-shield-check',
    'i-lucide-settings',
    'i-lucide-heart',
    // keep old as fallback
    'i-ph-image-duotone',
    'i-ph-spinner-gap-duotone',
  ],
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons({
      collections: {
        lucide: () => import('@iconify-json/lucide/icons.json').then(i => i.default),
      },
      scale: 1.2,
      extraProperties: {
        'vertical-align': 'middle',
      },
    }),
    presetTypography(),
  ],
  transformers: [
    transformerDirectives(),
    transformerVariantGroup(),
  ],
})


