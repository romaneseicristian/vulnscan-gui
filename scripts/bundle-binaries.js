#!/usr/bin/env node
// scripts/bundle-binaries.js
// Downloads the latest release binaries for all tools into resources/bin/{platform}/
// Run before building: node scripts/bundle-binaries.js [--platform win32|darwin|linux]
//
// Sprint 2 will flesh this out fully. For now the URL map and structure are defined.

const https = require('https')
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const PLATFORM = process.argv.includes('--platform')
  ? process.argv[process.argv.indexOf('--platform') + 1]
  : process.platform

const OUT_DIR = path.join(__dirname, '..', 'resources', 'bin', PLATFORM)

// Tool download map — imported from registry
// Full implementation in Sprint 2
const TOOLS = [
  { name: 'nuclei',    win32: 'https://github.com/projectdiscovery/nuclei/releases/latest/download/nuclei_windows_amd64.zip' },
  { name: 'httpx',     win32: 'https://github.com/projectdiscovery/httpx/releases/latest/download/httpx_windows_amd64.zip' },
  { name: 'naabu',     win32: 'https://github.com/projectdiscovery/naabu/releases/latest/download/naabu_windows_amd64.zip' },
  { name: 'subfinder', win32: 'https://github.com/projectdiscovery/subfinder/releases/latest/download/subfinder_windows_amd64.zip' },
  { name: 'dnsx',      win32: 'https://github.com/projectdiscovery/dnsx/releases/latest/download/dnsx_windows_amd64.zip' },
  { name: 'ffuf',      win32: 'https://github.com/ffuf/ffuf/releases/latest/download/ffuf_windows_amd64.zip' },
  { name: 'gobuster',  win32: 'https://github.com/OJ/gobuster/releases/latest/download/gobuster_Windows_x86_64.zip' },
  { name: 'katana',    win32: 'https://github.com/projectdiscovery/katana/releases/latest/download/katana_windows_amd64.zip' },
]

console.log(`[bundle-binaries] Platform: ${PLATFORM}`)
console.log(`[bundle-binaries] Output: ${OUT_DIR}`)
console.log(`[bundle-binaries] Sprint 2 will implement full download logic.`)
console.log(`[bundle-binaries] Tools to bundle: ${TOOLS.map(t => t.name).join(', ')}`)

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  console.log(`[bundle-binaries] Created ${OUT_DIR}`)
}

console.log('[bundle-binaries] Done (scaffold only — Sprint 2 implements downloads)')
