import React, { useEffect, useState } from 'react'
import SetupWizard from './components/SetupWizard'

export default function App() {
  const [setupComplete, setSetupComplete] = useState<boolean | null>(null)

  useEffect(() => {
    // Add spinner keyframe
    const style = document.createElement('style')
    style.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`
    document.head.appendChild(style)

    if (window.vulnscan) {
      window.vulnscan.readState().then(state => {
        setSetupComplete(state.setupComplete)
      })
    } else {
      setSetupComplete(false)
    }
  }, [])

  // Loading state
  if (setupComplete === null) {
    return (
      <div style={{
        height: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        color: 'var(--color-text-muted)', fontSize: 12,
      }}>
        loading...
      </div>
    )
  }

  // First launch — show wizard
  if (!setupComplete) {
    return <SetupWizard onComplete={() => setSetupComplete(true)} />
  }

  // Main app
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
        <span style={{ color: 'var(--color-accent)', fontWeight: 700, fontSize: 13, letterSpacing: '0.05em' }}>
          VULNSCAN
        </span>
        <span style={{ color: 'var(--color-text-muted)', fontSize: 11 }}>v0.1.0-dev</span>
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
          <div style={{ padding: '8px 12px', color: 'var(--color-text-muted)', fontSize: 12, fontStyle: 'italic' }}>
            No sessions yet
          </div>
        </div>

        {/* Content */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          color: 'var(--color-text-muted)',
        }}>
          <div style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 8,
            padding: '24px 32px',
            minWidth: 400,
            textAlign: 'center',
          }}>
            <div style={{ color: 'var(--color-accent)', fontSize: 11, letterSpacing: '0.1em', marginBottom: 12 }}>
              READY
            </div>
            <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
              Create a new session to start scanning
            </div>
            <button style={{
              marginTop: 20,
              padding: '8px 20px',
              background: 'var(--color-accent)',
              color: '#000',
              border: 'none',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              fontFamily: 'inherit',
              cursor: 'pointer',
            }}>
              + New Session
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
