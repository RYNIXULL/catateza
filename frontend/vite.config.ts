import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
import path from 'node:path'

// Plugin to record current dev server port so Electron desktop can connect accurately
const electronDevTrackerPlugin = (): Plugin => ({
  name: 'electron-dev-url-tracker',
  configureServer(server) {
    server.httpServer?.once('listening', () => {
      const address = server.httpServer?.address()
      const port = typeof address === 'object' && address ? address.port : 5173
      const devUrl = `http://localhost:${port}`
      try {
        fs.writeFileSync(path.join(__dirname, '.dev-server-url'), devUrl, 'utf-8')
      } catch (e) {
        console.error('Failed to write .dev-server-url', e)
      }
    })
  }
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), electronDevTrackerPlugin()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  }
})
