import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { getExtractionDir, getBundledBinDir } from './binary-paths'
import { getAllToolNames, getBinaryFilename } from './binary-registry'

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
    const filename = getBinaryFilename(toolName, platform)
    const src = path.join(bundledDir, filename)
    const dest = path.join(extractionDir, filename)

    // Skip if already extracted
    if (fs.existsSync(dest)) {
      results.push({ tool: toolName, ok: true })
      continue
    }

    // Skip if not bundled for this platform (wafw00f, sqlmap are optional)
    if (!fs.existsSync(src)) {
      results.push({ tool: toolName, ok: false, error: 'not bundled' })
      continue
    }

    try {
      fs.copyFileSync(src, dest)
      // Make executable on Unix
      if (platform !== 'win32') {
        fs.chmodSync(dest, 0o755)
      }
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
