import fs from 'fs'
import path from 'path'
import { app } from 'electron'

export interface AppState {
  setupComplete: boolean
  toolVersions: Record<string, string>
  lastTemplateUpdate: string | null
}

const DEFAULT_STATE: AppState = {
  setupComplete: false,
  toolVersions: {},
  lastTemplateUpdate: null,
}

function getStatePath(): string {
  let userData: string
  try {
    userData = app.getPath('userData')
  } catch {
    // Unit test fallback
    userData = path.join(process.env.HOME || '~', '.vulnscan-gui')
  }
  return path.join(userData, 'state.json')
}

export function readState(): AppState {
  const statePath = getStatePath()
  try {
    if (!fs.existsSync(statePath)) return { ...DEFAULT_STATE }
    const raw = fs.readFileSync(statePath, 'utf-8')
    return { ...DEFAULT_STATE, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_STATE }
  }
}

export function writeState(partial: Partial<AppState>): void {
  const statePath = getStatePath()
  const current = readState()
  const updated = { ...current, ...partial }

  const dir = path.dirname(statePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  fs.writeFileSync(statePath, JSON.stringify(updated, null, 2), 'utf-8')
}
