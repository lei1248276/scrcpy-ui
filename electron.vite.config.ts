import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import vue from '@vitejs/plugin-vue'
import tailwind from 'tailwindcss'
import autoprefixer from 'autoprefixer'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import ElementPlus from 'unplugin-element-plus/vite'

const isProd = process.env.NODE_ENV === 'production'

export default defineConfig({
  main: {
    build: {
      minify: isProd ? 'esbuild' : false,
      rollupOptions: {
        output: {
          manualChunks: {
            'fix-path': ['fix-path'],
            'electron-store': ['electron-store']
          }
        }
      }
    }
  },
  preload: {
    build: {
      minify: isProd ? 'esbuild' : false
    }
  },
  renderer: {
    build: {
      minify: isProd ? 'esbuild' : false,
      rollupOptions: {
        output: {
          manualChunks: {
            'vue-vendor': ['vue'],
            'element-plus': ['element-plus'],
            'embla-carousel': ['embla-carousel-vue'],
            'lucide': ['lucide-vue-next'],
            'radix': ['radix-vue']
          }
        }
      }
    },
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
        resolvers: [ElementPlusResolver()],
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
        dts: true,
        resolvers: [ElementPlusResolver()]
      }),
      ElementPlus({})
    ]
  }
})
