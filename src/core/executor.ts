import { spawn, ChildProcess } from 'child_process'
import { EventEmitter } from 'events'
import { getBinaryPath } from './binary-paths'

export interface RunOptions {
  timeout?: number       // ms — kills process if exceeded
  cwd?: string           // working directory for the subprocess
  env?: NodeJS.ProcessEnv
  signal?: AbortSignal   // AbortController support
}

export interface RunResult {
  exitCode: number
  stdout: string
  stderr: string
  timedOut: boolean
}

export interface ExecutorEvents {
  output: (data: { line: string; stream: 'stdout' | 'stderr' }) => void
}

// Core run function — all tool invocations go through here.
// Returns a promise that resolves when the process exits.
// Emits 'output' events for each line of stdout/stderr.
export function run(
  toolName: string,
  args: string[],
  opts: RunOptions = {}
): { emitter: EventEmitter; promise: Promise<RunResult> } {
  const binaryPath = getBinaryPath(toolName)
  const emitter = new EventEmitter()

  const promise = new Promise<RunResult>((resolve, reject) => {
    let stdoutBuf = ''
    let stderrBuf = ''
    let timedOut = false
    let settled = false

    const proc: ChildProcess = spawn(binaryPath, args, {
      cwd: opts.cwd,
      env: opts.env ?? process.env,
      windowsHide: true, // suppress cmd window flashing on Windows
    })

    // Timeout handling
    let timeoutHandle: ReturnType<typeof setTimeout> | null = null
    if (opts.timeout) {
      timeoutHandle = setTimeout(() => {
        timedOut = true
        proc.kill('SIGTERM')
      }, opts.timeout)
    }

    // AbortController support
    if (opts.signal) {
      opts.signal.addEventListener('abort', () => {
        proc.kill('SIGTERM')
        if (!settled) {
          settled = true
          reject(new Error('Aborted'))
        }
      })
    }

    // Stream stdout line by line
    proc.stdout?.on('data', (chunk: Buffer) => {
      const text = chunk.toString()
      stdoutBuf += text
      text.split('\n').forEach(line => {
        if (line.trim()) emitter.emit('output', { line, stream: 'stdout' })
      })
    })

    // Stream stderr line by line
    proc.stderr?.on('data', (chunk: Buffer) => {
      const text = chunk.toString()
      stderrBuf += text
      text.split('\n').forEach(line => {
        if (line.trim()) emitter.emit('output', { line, stream: 'stderr' })
      })
    })

    proc.on('error', (err) => {
      if (timeoutHandle) clearTimeout(timeoutHandle)
      if (!settled) {
        settled = true
        reject(new Error(`Failed to start ${toolName}: ${err.message}`))
      }
    })

    proc.on('close', (code) => {
      if (timeoutHandle) clearTimeout(timeoutHandle)
      if (!settled) {
        settled = true
        resolve({
          exitCode: code ?? -1,
          stdout: stdoutBuf,
          stderr: stderrBuf,
          timedOut,
        })
      }
    })
  })

  return { emitter, promise }
}

// Convenience: run a tool just for its version string.
// Used by setup wizard to verify each binary.
export async function getVersion(toolName: string): Promise<string | null> {
  try {
    const { promise } = run(toolName, ['--version'], { timeout: 5000 })
    const result = await promise
    const output = (result.stdout + result.stderr).trim()
    const firstLine = output.split('\n')[0]
    return firstLine || null
  } catch {
    return null
  }
}
