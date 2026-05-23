import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { getExtractionDir, getBundledBinDir } from './binary-paths'
import { getAllToolNames, getBinaryFilename } from './binary-registry'
import { BINARY_REGISTRY } from './binary-registry'


export interface ExtractionResult {
  tool: string
  ok: boolean
  error?: string
}

// Copy all bundled binaries from resources/bin/{platform}/ to userData/bin/
// Safe to call multiple times — skips tools that already exist
export async function extractBinaries(): Promise<ExtractionResult[]> {
  const extractionDir = getExtractionDir()
  const bundledDir = getBundledBinDir()
  const platform = process.platform as 'win32' | 'darwin' | 'linux'

  if (!fs.existsSync(extractionDir)) {
    fs.mkdirSync(extractionDir, { recursive: true })
  }

  const results: ExtractionResult[] = []

  for (const toolName of getAllToolNames()) {
    const entry = BINARY_REGISTRY[toolName]

    // Handle installer-based tools (e.g. nmap) — launches UI installer, waits for binary
if (platform === 'win32' && entry.installer?.win32) {
  const installerSrc = path.join(bundledDir, entry.installer.win32)
  const installedPath = entry.win32InstallPath

  // Skip if already installed
  if (installedPath && fs.existsSync(installedPath)) {
    results.push({ tool: toolName, ok: true })
    continue
  }

  if (!fs.existsSync(installerSrc)) {
    results.push({ tool: toolName, ok: false, error: 'installer not bundled' })
    continue
  }

  try {
    // Launch installer with UAC elevation
const { spawn } = require('child_process')
const proc = spawn('powershell', [
  '-Command',
  `Start-Process -FilePath "${installerSrc}" -Verb RunAs`
], { stdio: 'ignore' })
proc.unref()

    // Poll for the binary to appear — check every 2s for up to 3 minutes
    const installed = await waitForFile(installedPath!, 180000, 1000)
    if (installed) {
      results.push({ tool: toolName, ok: true })
    } else {
      results.push({ tool: toolName, ok: false, error: 'installer timed out or was cancelled' })
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    results.push({ tool: toolName, ok: false, error: msg })
  }
  continue
}

    // Handle regular zip-extracted binaries
    const filename = getBinaryFilename(toolName, platform)
    const src = path.join(bundledDir, filename)
    const dest = path.join(extractionDir, filename)

    if (fs.existsSync(dest)) {
      results.push({ tool: toolName, ok: true })
      continue
    }

    if (!fs.existsSync(src)) {
      results.push({ tool: toolName, ok: false, error: 'not bundled' })
      continue
    }

    try {
      fs.copyFileSync(src, dest)
      if (platform !== 'win32') fs.chmodSync(dest, 0o755)
      results.push({ tool: toolName, ok: true })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      results.push({ tool: toolName, ok: false, error: msg })
    }
  }

  return results
}

// Install Npcap silently (Windows only, required by nmap)
export async function installNpcap(bundledDir: string): Promise<{ ok: boolean; error?: string }> {
  if (process.platform !== 'win32') return { ok: true }

  const npcapInstaller = path.join(bundledDir, 'npcap-installer.exe')
  if (!fs.existsSync(npcapInstaller)) {
    return { ok: false, error: 'npcap-installer.exe not found in bundle' }
  }

  try {
    execSync(`"${npcapInstaller}" /S`, { timeout: 60000 })
    return { ok: true }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, error: msg }
  }
}

// Polls for a file to appear on disk — used to detect when an installer finishes
function waitForFile(filePath: string, timeoutMs: number, intervalMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    const start = Date.now()
    const interval = setInterval(() => {
      if (fs.existsSync(filePath)) {
        clearInterval(interval)
        resolve(true)
      } else if (Date.now() - start >= timeoutMs) {
        clearInterval(interval)
        resolve(false)
      }
    }, intervalMs)
  })
}