import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),
  VitePWA({
    registerType: 'autoUpdate', // 更新があったらすぐに反映
    includeAssets: ['favicon.ico', 'apple-touch-icon.png'], // キャッシュする静的アセット
    manifest: {
      name: '瞬間記憶模写',
      short_name: '記憶模写',
      description: '画像を脳に焼き付けてから描くトレーニングアプリ',
      theme_color: '#121212', // アプリの背景色（ダークモードに合わせています）
      background_color: '#121212',
      display: 'standalone', // これでアドレスバーが消えます
      orientation: 'portrait', // 縦画面固定（お好みで）
      icons: [
        {
          src: 'pwa-192x192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: 'pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png'
        }
      ]
    }
  })
  ],
  base: '/mosha-app/',
  server: {
    host: true,
    port: 5173,
    hmr: {
      clientPort: 5173
    }
  }
})
