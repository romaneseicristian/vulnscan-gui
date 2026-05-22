import React, { useEffect, useState } from 'react'

// Temporary type shim until we have proper window.vulnscan types
declare global {
  interface Window {
    vulnscan?: {
      readState: () => Promise<{ setupComplete: boolean; toolVersions: Record<string, string> }>
      getExtractionDir: () => Promise<string>
    }
  }
}

export default function App() {
  const [setupComplete, setSetupComplete] = useState<boolean | null>(null)
  const [extractionDir, setExtractionDir] = useState<string>('')

  useEffect(() => {
    if (window.vulnscan) {
      window.vulnscan.readState().then(state => {
        setSetupComplete(state.setupComplete)
      })
      window.vulnscan.getExtractionDir().then(dir => {
        setExtractionDir(dir)
      })
    } else {
      // Running in browser dev mode without Electron — show placeholder
      setSetupComplete(false)
      setExtractionDir('(not in Electron context)')
    }
  }, [])

  return (
    <div style={{ display: 'flex', height: '100vh', flexDirection: 'column' }}>

      {/* Title bar */}
      <div style={{
        height: 38,
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 10,
        WebkitAppRegion: 'drag' as React.CSSProperties['WebkitAppRegion'],
        flexShrink: 0,
      }}>
        <span style={{
          color: 'var(--color-accent)',
          fontWeight: 700,
          fontSize: 13,
          letterSpacing: '0.05em',
        }}>
          VULNSCAN
        </span>
        <span style={{ color: 'var(--color-text-muted)', fontSize: 11 }}>
          v0.1.0-dev
        </span>
      </div>

      {/* Main layout */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Sidebar */}
        <div style={{
          width: 220,
          background: 'var(--color-surface)',
          borderRight: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          padding: '12px 0',
          flexShrink: 0,
        }}>
          <div style={{ padding: '0 12px 8px', color: 'var(--color-text-muted)', fontSize: 10, letterSpacing: '0.1em' }}>
            SESSIONS
          </div>
          <div style={{
            padding: '8px 12px',
            color: 'var(--color-text-muted)',
            fontSize: 12,
            fontStyle: 'italic',
          }}>
            No sessions yet
          </div>
        </div>

        {/* Content area */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          color: 'var(--color-text-muted)',
        }}>

          {/* Boot status card */}
          <div style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 8,
            padding: '24px 32px',
            minWidth: 400,
          }}>
            <div style={{
              color: 'var(--color-accent)',
              fontSize: 11,
              letterSpacing: '0.1em',
              marginBottom: 16,
            }}>
              SPRINT 1 — FOUNDATION ✓
            </div>

            <StatusRow label="IPC bridge" value={window.vulnscan ? '✓ active' : '⚠ no Electron context'} ok={!!window.vulnscan} />
            <StatusRow label="setup complete" value={setupComplete === null ? '...' : String(setupComplete)} ok={!!setupComplete} />
            <StatusRow label="extraction dir" value={extractionDir || '...'} ok={!!extractionDir} />

            <div style={{
              marginTop: 20,
              paddingTop: 16,
              borderTop: '1px solid var(--color-border)',
              fontSize: 11,
              color: 'var(--color-text-muted)',
            }}>
              Next: Setup wizard → binary extraction → session manager
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusRow({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '6px 0',
      borderBottom: '1px solid var(--color-border)',
      gap: 24,
    }}>
      <span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>{label}</span>
      <span style={{
        color: ok ? 'var(--color-accent)' : 'var(--color-medium)',
        fontSize: 12,
        fontFamily: 'monospace',
      }}>
        {value}
      </span>
    </div>
  )
}
