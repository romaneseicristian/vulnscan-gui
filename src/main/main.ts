import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import { getBinaryPath, getExtractionDir, getBundledBinDir } from '../core/binary-paths'
import { readState, writeState } from '../core/state'
import { extractBinaries, installNpcap } from '../core/extractor'
import { getVersion } from '../core/executor'
console.log('Bundled bin dir:', getBundledBinDir())

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

// ── IPC: Binary paths ────────────────────────────────────────────────────────

ipcMain.handle('binary:get-path', (_event, toolName: string) => {
  return getBinaryPath(toolName)
})

ipcMain.handle('binary:get-extraction-dir', () => {
  return getExtractionDir()
})

// ── IPC: State ───────────────────────────────────────────────────────────────

ipcMain.handle('state:read', () => {
  return readState()
})

ipcMain.handle('state:write', (_event, partial: Record<string, unknown>) => {
  return writeState(partial)
})

// ── IPC: Setup wizard ────────────────────────────────────────────────────────

ipcMain.handle('setup:extract-binaries', async () => {
  return extractBinaries()
})

ipcMain.handle('setup:check-tool', async (_event, toolName: string) => {
  const version = await getVersion(toolName)
  return {
    name: toolName,
    version,
    ok: version !== null,
  }
})

ipcMain.handle('setup:install-npcap', async () => {
  return installNpcap(getBundledBinDir())
})

ipcMain.handle('setup:update-templates', async (event) => {
  const { run } = await import('../core/executor')
  const { emitter, promise } = run('nuclei', ['-update-templates'])
  emitter.on('output', (data) => {
    event.sender.send('setup:template-output', data.line)
  })
  const result = await promise
  return { ok: result.exitCode === 0, exitCode: result.exitCode }
})

ipcMain.handle('setup:complete', () => {
  writeState({ setupComplete: true })
})
