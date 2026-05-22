import path from 'path'
import os from 'os'
import { app } from 'electron'
import { getBinaryFilename, Platform } from './binary-registry'

// Returns the directory where binaries are extracted to at runtime.
// Never touches system PATH — all calls use this absolute path.
export function getExtractionDir(): string {
  let base: string

  try {
    // In Electron context, use app.getPath for correct userData location
    base = app.getPath('userData')
  } catch {
    // Fallback for unit tests running outside Electron context
    base = path.join(os.homedir(), '.vulnscan-gui')
  }

  return path.join(base, 'bin')
}

// Returns the full absolute path to a specific tool binary.
export function getBinaryPath(toolName: string): string {
  const platform = process.platform as Platform
  const filename = getBinaryFilename(toolName, platform)
  return path.join(getExtractionDir(), filename)
}

// Returns the directory where bundled binaries are stored inside the app package.
// Used by the setup wizard to extract them on first launch.
export function getBundledBinDir(): string {
  try {
    return path.join(process.resourcesPath, 'bin')
  } catch {
    // Fallback for development
    return path.join(__dirname, '../../resources/bin', process.platform)
  }
}
