import { app, BrowserWindow } from 'electron'
import path from 'node:path'
import fs from 'node:fs'

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.cjs
// │ │ └── preload.cjs
// │
const DIST = path.join(__dirname, '../dist')
const VITE_PUBLIC = app.isPackaged ? DIST : path.join(DIST, '../public')

let win: BrowserWindow | null
const isDev = !app.isPackaged

// Dynamically resolve Vite Dev Server URL
async function getDevServerUrl(): Promise<string> {
  // 1. Check explicit environment variables
  if (process.env.VITE_DEV_SERVER_URL) {
    return process.env.VITE_DEV_SERVER_URL
  }
  if (process.env.DEV_SERVER_URL) {
    return process.env.DEV_SERVER_URL
  }

  // 2. Check tracking file written by Vite server (.dev-server-url)
  const devUrlFile = path.join(__dirname, '../.dev-server-url')
  if (fs.existsSync(devUrlFile)) {
    try {
      const savedUrl = fs.readFileSync(devUrlFile, 'utf-8').trim()
      if (savedUrl.startsWith('http://localhost:')) {
        try {
          const res = await fetch(savedUrl, { signal: AbortSignal.timeout(1000) })
          if (res.ok) {
            console.log(`[Electron] Using dev server URL from .dev-server-url: ${savedUrl}`)
            return savedUrl
          }
        } catch {
          // File might be stale from previous run, continue to dynamic scan
        }
      }
    } catch {
      // Ignore read error
    }
  }

  // 3. Scan candidate Vite ports and verify it matches THIS specific application
  // Prevents opening other apps that happen to be using port 5173
  const candidatePorts = [5173, 5174, 5175, 5176, 5177, 5178]
  for (const port of candidatePorts) {
    try {
      const url = `http://localhost:${port}`
      const res = await fetch(url, { signal: AbortSignal.timeout(600) })
      if (res.ok) {
        const text = await res.text()
        // Ensure it is our SmartPOS / Catat Eza app and not an unrelated project
        if (text.includes('/src/main.tsx') || text.includes('catat eza')) {
          console.log(`[Electron] Auto-detected matching Vite app at ${url}`)
          return url
        }
      }
    } catch {
      // Port is closed or not responding, continue scanning next port
    }
  }

  // 4. Default fallback
  return 'http://localhost:5173'
}

async function createWindow() {
  console.log('Creating window... isDev:', isDev)
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    center: true, // Center the window on the screen
    icon: path.join(VITE_PUBLIC, 'favicon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false, // Don't show until ready-to-show
  })
  console.log('Window created')

  win.once('ready-to-show', () => {
    win?.show()
    win?.focus() // Force focus
  })

  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  win.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    console.error(`[Electron] Failed to load: ${errorCode} - ${errorDescription}`)
  })

  // Tekan F12 untuk membuka DevTools (Console / Network)
  win.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12' && input.type === 'keyDown') {
      win?.webContents.toggleDevTools()
    }
  })

  if (isDev) {
    const devUrl = await getDevServerUrl()
    console.log(`[Electron] Connecting to: ${devUrl}`)
    await win.loadURL(devUrl)
  } else {
    const indexPath = path.join(DIST, 'index.html')
    console.log(`[Electron] Loading production file: ${indexPath}`)
    await win.loadFile(indexPath)
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(createWindow)
