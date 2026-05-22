import { contextBridge, ipcRenderer } from 'electron'

// All renderer <-> main communication goes through this bridge.
// nodeIntegration is false — renderer has zero direct Node access.

contextBridge.exposeInMainWorld('vulnscan', {
  // Binary paths
  getBinaryPath: (toolName: string): Promise<string> =>
    ipcRenderer.invoke('binary:get-path', toolName),

  getExtractionDir: (): Promise<string> =>
    ipcRenderer.invoke('binary:get-extraction-dir'),

  // App state
  readState: (): Promise<AppState> =>
    ipcRenderer.invoke('state:read'),

  writeState: (partial: Partial<AppState>): Promise<void> =>
    ipcRenderer.invoke('state:write', partial),

  // Executor — run a tool, stream output back
  runTool: (
    toolName: string,
    args: string[],
    opts?: RunToolOptions
  ): Promise<RunResult> =>
    ipcRenderer.invoke('executor:run', toolName, args, opts),

  // Listen to streaming output lines from a running tool
  onToolOutput: (
    callback: (data: ToolOutputEvent) => void
  ): (() => void) => {
    const handler = (_: Electron.IpcRendererEvent, data: ToolOutputEvent) =>
      callback(data)
    ipcRenderer.on('executor:output', handler)
    return () => ipcRenderer.removeListener('executor:output', handler)
  },
})

// ── Types shared between preload and renderer ────────────────────────────────

export interface AppState {
  setupComplete: boolean
  toolVersions: Record<string, string>
  lastTemplateUpdate: string | null
}

export interface RunToolOptions {
  timeout?: number
  cwd?: string
}

export interface RunResult {
  exitCode: number
  stdout: string
  stderr: string
  timedOut: boolean
}

export interface ToolOutputEvent {
  toolName: string
  line: string
  stream: 'stdout' | 'stderr'
}
