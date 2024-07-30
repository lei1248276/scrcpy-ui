import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import vue from '@vitejs/plugin-vue'
import tailwind from 'tailwindcss'
import autoprefixer from 'autoprefixer'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin({ exclude: ['fix-path', 'electron-store'] })]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    css: {
      postcss: {
        plugins: [tailwind(), autoprefixer()]
      }
    },
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [
      vue(),
      AutoImport({
        include: [
          /\.[tj]sx?$/, // .ts, .tsx, .js, .jsx
          /\.vue$/
        ],
        imports: [
          'vue'
        ],
        dirs: [
          'src/renderer/src/components/**',
          'src/renderer/src/hooks/**',
          'src/renderer/src/utils/**'
        ],
        vueTemplate: true,
        dts: true, // or a custom path
        eslintrc: {
          enabled: true
        }
      }),
      Components({
        dts: true
      })
    ]
  }
})
