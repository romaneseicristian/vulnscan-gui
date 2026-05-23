import React, { useEffect, useState } from 'react'

interface ToolStatus {
  name: string
  label: string
  version: string | null
  status: 'pending' | 'checking' | 'ok' | 'failed' | 'missing'
  required: boolean
}

const TOOLS: { name: string; label: string; required: boolean }[] = [
  { name: 'nmap',      label: 'nmap',      required: true  },
  { name: 'nuclei',    label: 'nuclei',    required: true  },
  { name: 'httpx',     label: 'httpx',     required: true  },
  { name: 'naabu',     label: 'naabu',     required: false },
  { name: 'subfinder', label: 'subfinder', required: false },
  { name: 'dnsx',      label: 'dnsx',      required: false },
  { name: 'ffuf',      label: 'ffuf',      required: false },
  { name: 'gobuster',  label: 'gobuster',  required: false },
  { name: 'katana',    label: 'katana',    required: false },
]

type WizardStep = 'welcome' | 'extracting' | 'checking' | 'templates' | 'done'

interface Props {
  onComplete: () => void
}

declare global {
  interface Window {
    vulnscan: {
      extractBinaries: () => Promise<{ tool: string; ok: boolean; error?: string }[]>
      checkTool: (name: string) => Promise<{ name: string; version: string | null; ok: boolean }>
      updateTemplates: () => Promise<{ ok: boolean }>
      onTemplateOutput: (cb: (line: string) => void) => () => void
      completeSetup: () => Promise<void>
      readState: () => Promise<{ setupComplete: boolean; toolVersions: Record<string, string> }>
      getExtractionDir: () => Promise<string>
      writeState: (p: object) => Promise<void>
      getBinaryPath: (name: string) => Promise<string>
      installNpcap: () => Promise<{ ok: boolean; error?: string }>
      runTool: (name: string, args: string[], opts?: object) => Promise<{ exitCode: number; stdout: string; stderr: string; timedOut: boolean }>
      onToolOutput: (cb: (data: object) => void) => () => void
    }
  }
}

export default function SetupWizard({ onComplete }: Props) {
  const [step, setStep] = useState<WizardStep>('welcome')
  const [tools, setTools] = useState<ToolStatus[]>(
    TOOLS.map(t => ({ ...t, version: null, status: 'pending' }))
  )
  const [templateLines, setTemplateLines] = useState<string[]>([])
  const [templateDone, setTemplateDone] = useState(false)
  const [templateOk, setTemplateOk] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateTool = (name: string, patch: Partial<ToolStatus>) => {
    setTools(prev => prev.map(t => t.name === name ? { ...t, ...patch } : t))
  }

  // Step 1: Extract binaries
  const runExtraction = async () => {
    setStep('extracting')
    try {
      await window.vulnscan.extractBinaries()
      runChecks()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  // Step 2: Check each tool
  const runChecks = async () => {
    setStep('checking')
    const versions: Record<string, string> = {}

    for (const tool of TOOLS) {
      updateTool(tool.name, { status: 'checking' })
      const result = await window.vulnscan.checkTool(tool.name)
      if (result.ok && result.version) {
        versions[tool.name] = result.version
        updateTool(tool.name, { status: 'ok', version: result.version })
      } else {
        updateTool(tool.name, { status: 'failed' })
      }
    }

    await window.vulnscan.writeState({ toolVersions: versions })
    setStep('templates')
    runTemplateUpdate()
  }

  // Step 3: Update nuclei templates
  const runTemplateUpdate = async () => {
    const unsub = window.vulnscan.onTemplateOutput((line) => {
      setTemplateLines(prev => [...prev.slice(-50), line]) // keep last 50 lines
    })

    const result = await window.vulnscan.updateTemplates()
    unsub()
    setTemplateOk(result.ok)
    setTemplateDone(true)
  }

  // Step 4: Finish
  const finish = async () => {
    await window.vulnscan.completeSetup()
    onComplete()
  }

  const requiredFailed = tools.filter(t => t.required && t.status === 'failed')
  const allChecked = tools.every(t => t.status === 'ok' || t.status === 'failed')

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'var(--color-bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100,
    }}>
      <div style={{
        width: 560,
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 10,
        overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ color: 'var(--color-accent)', fontWeight: 700, fontSize: 15, letterSpacing: '0.05em' }}>
            VULNSCAN
          </span>
          <span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>
            First time setup
          </span>
          <div style={{ flex: 1 }} />
          <StepDots current={step} />
        </div>

        {/* Body */}
        <div style={{ padding: '24px', minHeight: 320 }}>

          {step === 'welcome' && (
            <div>
              <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>
                Welcome to VulnScan GUI
              </div>
              <div style={{ color: 'var(--color-text-muted)', fontSize: 13, lineHeight: 1.7, marginBottom: 24 }}>
                This wizard will extract the bundled scanning tools and verify they are working correctly.
                This only runs once.
              </div>
              <div style={{
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: 6,
                padding: '12px 16px',
                marginBottom: 24,
                fontSize: 12,
                color: 'var(--color-text-muted)',
                lineHeight: 1.8,
              }}>
                Tools to install: {TOOLS.map(t => t.label).join(', ')}
              </div>
              {error && <ErrorBox message={error} />}
              <button onClick={runExtraction} style={btnStyle}>
                Begin Setup →
              </button>
            </div>
          )}

          {step === 'extracting' && (
            <div style={{ textAlign: 'center', paddingTop: 40 }}>
              <Spinner />
              <div style={{ marginTop: 16, color: 'var(--color-text-muted)', fontSize: 13 }}>
                Extracting binaries...
              </div>
            </div>
          )}

          {(step === 'checking' || step === 'templates' || step === 'done') && (
            <div>
              <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 16 }}>
                {step === 'checking' ? 'Verifying tools...' : 'Tool verification complete'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
                {tools.map(tool => (
                  <ToolRow key={tool.name} tool={tool} />
                ))}
              </div>

              {/* Template update section */}
              {(step === 'templates' || step === 'done') && (
                <div style={{
                  background: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 6,
                  padding: '12px 16px',
                  marginBottom: 20,
                }}>
                  <div style={{
                    fontSize: 11,
                    color: 'var(--color-text-muted)',
                    marginBottom: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}>
                    <span>NUCLEI TEMPLATES</span>
                    {!templateDone && <Spinner small />}
                    {templateDone && (
                      <span style={{ color: templateOk ? 'var(--color-accent)' : 'var(--color-high)' }}>
                        {templateOk ? '✓ updated' : '✗ failed'}
                      </span>
                    )}
                  </div>
                  <div style={{
                    fontFamily: 'monospace',
                    fontSize: 11,
                    color: 'var(--color-text-muted)',
                    maxHeight: 80,
                    overflowY: 'auto',
                    lineHeight: 1.6,
                  }}>
                    {templateLines.slice(-5).map((line, i) => (
                      <div key={i}>{line}</div>
                    ))}
                    {!templateDone && <div style={{ color: 'var(--color-accent)' }}>▋</div>}
                  </div>
                </div>
              )}

              {/* Finish button — show when checks done and templates done */}
              {allChecked && templateDone && (
                <div>
                  {requiredFailed.length > 0 && (
                    <ErrorBox message={`${requiredFailed.length} required tool(s) failed: ${requiredFailed.map(t => t.name).join(', ')}. Check that binaries are bundled correctly.`} />
                  )}
                  <button
                    onClick={finish}
                    disabled={requiredFailed.length > 0}
                    style={{ ...btnStyle, opacity: requiredFailed.length > 0 ? 0.4 : 1 }}
                  >
                    {requiredFailed.length > 0 ? 'Cannot proceed — required tools missing' : 'Launch VulnScan →'}
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ToolRow({ tool }: { tool: ToolStatus }) {
  const statusColor = {
    pending:  'var(--color-text-muted)',
    checking: 'var(--color-medium)',
    ok:       'var(--color-accent)',
    failed:   'var(--color-critical)',
    missing:  'var(--color-text-muted)',
  }[tool.status]

  const statusIcon = {
    pending:  '○',
    checking: '◌',
    ok:       '✓',
    failed:   '✗',
    missing:  '—',
  }[tool.status]

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '6px 10px',
      background: 'var(--color-bg)',
      borderRadius: 4,
      fontSize: 12,
    }}>
      <span style={{ color: statusColor, width: 14, textAlign: 'center', flexShrink: 0 }}>
        {statusIcon}
      </span>
      <span style={{ flex: 1, color: 'var(--color-text)' }}>{tool.label}</span>
      {tool.required && (
        <span style={{ fontSize: 10, color: 'var(--color-text-muted)', background: 'var(--color-surface)', padding: '1px 6px', borderRadius: 3 }}>
          required
        </span>
      )}
      <span style={{ color: statusColor, fontSize: 11, fontFamily: 'monospace', minWidth: 120, textAlign: 'right' }}>
        {tool.status === 'checking' ? 'checking...' : tool.version ?? (tool.status === 'failed' ? 'not found' : '')}
      </span>
    </div>
  )
}

function StepDots({ current }: { current: WizardStep }) {
  const steps: WizardStep[] = ['welcome', 'extracting', 'checking', 'templates', 'done']
  const idx = steps.indexOf(current)
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {steps.map((s, i) => (
        <div key={s} style={{
          width: i === idx ? 16 : 6,
          height: 6,
          borderRadius: 3,
          background: i <= idx ? 'var(--color-accent)' : 'var(--color-border)',
          transition: 'all 0.2s',
        }} />
      ))}
    </div>
  )
}

function Spinner({ small }: { small?: boolean }) {
  const size = small ? 12 : 24
  return (
    <div style={{
      width: size, height: size,
      border: `${small ? 1.5 : 2}px solid var(--color-border)`,
      borderTopColor: 'var(--color-accent)',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
      display: 'inline-block',
    }} />
  )
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div style={{
      background: '#2d1a1a',
      border: '1px solid var(--color-critical)',
      borderRadius: 6,
      padding: '10px 14px',
      marginBottom: 16,
      fontSize: 12,
      color: '#ff8080',
      lineHeight: 1.6,
    }}>
      {message}
    </div>
  )
}

const btnStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 0',
  background: 'var(--color-accent)',
  color: '#000',
  border: 'none',
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 600,
  fontFamily: 'inherit',
  cursor: 'pointer',
  letterSpacing: '0.03em',
}
