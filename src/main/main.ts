import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import { getBinaryPath, getExtractionDir } from '../core/binary-paths'
import { readState, writeState } from '../core/state'

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1280,
    minHeight: 800,
    backgroundColor: '#0f1117',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    show: false,
  })

  if (isDev) {
    win.loadURL('http://localhost:5173')
    win.webContents.openDevTools()
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  win.once('ready-to-show', () => {
    win.show()
  })

  return win
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// ── IPC handlers ────────────────────────────────────────────────────────────

// Returns the resolved path for a given tool binary
ipcMain.handle('binary:get-path', (_event, toolName: string) => {
  return getBinaryPath(toolName)
})

// Returns the extraction directory for the current platform
ipcMain.handle('binary:get-extraction-dir', () => {
  return getExtractionDir()
})

// Read persisted app state
ipcMain.handle('state:read', () => {
  return readState()
})

// Write persisted app state (partial update)
ipcMain.handle('state:write', (_event, partial: Record<string, unknown>) => {
  return writeState(partial)
})
