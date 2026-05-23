import { contextBridge, ipcRenderer } from 'electron'

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

  // Executor
  runTool: (toolName: string, args: string[], opts?: RunToolOptions): Promise<RunResult> =>
    ipcRenderer.invoke('executor:run', toolName, args, opts),

  onToolOutput: (callback: (data: ToolOutputEvent) => void): (() => void) => {
    const handler = (_: Electron.IpcRendererEvent, data: ToolOutputEvent) => callback(data)
    ipcRenderer.on('executor:output', handler)
    return () => ipcRenderer.removeListener('executor:output', handler)
  },

  // Setup wizard
  extractBinaries: (): Promise<ExtractionResult[]> =>
    ipcRenderer.invoke('setup:extract-binaries'),

  checkTool: (toolName: string): Promise<ToolCheckResult> =>
    ipcRenderer.invoke('setup:check-tool', toolName),

  installNpcap: (): Promise<{ ok: boolean; error?: string }> =>
    ipcRenderer.invoke('setup:install-npcap'),

  updateTemplates: (): Promise<{ ok: boolean; exitCode: number }> =>
    ipcRenderer.invoke('setup:update-templates'),

  onTemplateOutput: (callback: (line: string) => void): (() => void) => {
    const handler = (_: Electron.IpcRendererEvent, line: string) => callback(line)
    ipcRenderer.on('setup:template-output', handler)
    return () => ipcRenderer.removeListener('setup:template-output', handler)
  },

  completeSetup: (): Promise<void> =>
    ipcRenderer.invoke('setup:complete'),
})

// ── Shared types ─────────────────────────────────────────────────────────────

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

export interface ExtractionResult {
  tool: string
  ok: boolean
  error?: string
}

export interface ToolCheckResult {
  name: string
  version: string | null
  ok: boolean
}
