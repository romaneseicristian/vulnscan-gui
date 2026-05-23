#!/usr/bin/env node
const https = require('https')
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const OUT_DIR = path.join(__dirname, '..', 'resources', 'bin', 'win32')

// asset pattern is a regex matched against the release asset names
const TOOLS = [
  { name: 'nuclei',    repo: 'projectdiscovery/nuclei',    asset: /nuclei_[\d.]+_windows_amd64\.zip$/,    binary: 'nuclei.exe' },
  { name: 'httpx',     repo: 'projectdiscovery/httpx',     asset: /httpx_[\d.]+_windows_amd64\.zip$/,     binary: 'httpx.exe' },
  { name: 'naabu',     repo: 'projectdiscovery/naabu',     asset: /naabu_[\d.]+_windows_amd64\.zip$/,     binary: 'naabu.exe' },
  { name: 'subfinder', repo: 'projectdiscovery/subfinder', asset: /subfinder_[\d.]+_windows_amd64\.zip$/, binary: 'subfinder.exe' },
  { name: 'dnsx',      repo: 'projectdiscovery/dnsx',      asset: /dnsx_[\d.]+_windows_amd64\.zip$/,      binary: 'dnsx.exe' },
  { name: 'ffuf',      repo: 'ffuf/ffuf',                  asset: /ffuf_[\d.]+_windows_amd64\.zip$/,      binary: 'ffuf.exe' },
  { name: 'gobuster',  repo: 'OJ/gobuster',                asset: /gobuster_Windows_x86_64\.zip$/,        binary: 'gobuster.exe' },
  { name: 'katana',    repo: 'projectdiscovery/katana',    asset: /katana_[\d.]+_windows_amd64\.zip$/,    binary: 'katana.exe' },
]

function ok(msg)  { process.stdout.write(`  ✓ ${msg}\n`) }
function err(msg) { process.stdout.write(`  ✗ ${msg}\n`) }

function getJson(url) {
  return new Promise((resolve, reject) => {
    const opts = { headers: { 'User-Agent': 'vulnscan-gui-bundler', 'Accept': 'application/vnd.github.v3+json' } }
    https.get(url, opts, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) return getJson(res.headers.location).then(resolve).catch(reject)
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => { try { resolve(JSON.parse(data)) } catch(e) { reject(new Error('JSON parse failed: ' + data.slice(0,200))) } })
    }).on('error', reject)
  })
}

async function getLatestAssetUrl(repo, assetPattern) {
  const release = await getJson(`https://api.github.com/repos/${repo}/releases/latest`)
  if (!release.assets) throw new Error(`No assets found for ${repo}`)
  const asset = release.assets.find(a => assetPattern.test(a.name))
  if (!asset) throw new Error(`No asset matching ${assetPattern} found. Available: ${release.assets.map(a=>a.name).join(', ')}`)
  return { url: asset.browser_download_url, version: release.tag_name }
}

function download(url, destPath) {
  return new Promise((resolve, reject) => {
    const opts = { headers: { 'User-Agent': 'vulnscan-gui-bundler' } }
    https.get(url, opts, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) return download(res.headers.location, destPath).then(resolve).catch(reject)
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`))
      const file = fs.createWriteStream(destPath)
      res.pipe(file)
      file.on('finish', () => file.close(resolve))
      file.on('error', reject)
    }).on('error', reject)
  })
}

function extractExeFromZip(zipPath, binaryName, outDir) {
  return new Promise((resolve, reject) => {
    const tmpDir = zipPath + '_tmp'
    const destFile = path.join(outDir, binaryName)
    const cmd = [
      `$ErrorActionPreference = 'Stop'`,
      `Expand-Archive -Path '${zipPath}' -DestinationPath '${tmpDir}' -Force`,
      `$exe = Get-ChildItem -Path '${tmpDir}' -Recurse -Filter '${binaryName}' | Select-Object -First 1`,
      `if ($exe) { Copy-Item $exe.FullName -Destination '${destFile}' -Force; Write-Output 'OK' } else { Write-Output 'NOT_FOUND' }`,
      `Remove-Item -Recurse -Force '${tmpDir}'`,
    ].join('; ')
    try {
      const result = execSync(`powershell -Command "${cmd}"`, { encoding: 'utf-8' }).trim()
      if (result.includes('OK')) resolve()
      else reject(new Error(`${binaryName} not found inside zip`))
    } catch(e) { reject(new Error(e.stderr || e.message)) }
  })
}

async function main() {
  const toolFlag = process.argv.indexOf('--tool')
  const tools = toolFlag !== -1 ? TOOLS.filter(t => t.name === process.argv[toolFlag + 1]) : TOOLS
  if (tools.length === 0) { err('Unknown tool. Available: ' + TOOLS.map(t=>t.name).join(', ')); process.exit(1) }
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true })

  process.stdout.write(`\nBundling ${tools.length} tool(s) into ${OUT_DIR}\n\n`)
  const results = []

  for (const tool of tools) {
    const binaryDest = path.join(OUT_DIR, tool.binary)
    if (fs.existsSync(binaryDest)) {
      ok(`${tool.name} — already exists, skipping`)
      results.push({ name: tool.name, ok: true, skipped: true })
      continue
    }

    process.stdout.write(`  ↓ ${tool.name} — resolving...`)
    const zipPath = path.join(OUT_DIR, `${tool.name}.zip`)

    try {
      const { url, version } = await getLatestAssetUrl(tool.repo, tool.asset)
      process.stdout.write(` ${version} — downloading...`)
      await download(url, zipPath)
      process.stdout.write(' extracting...')
      await extractExeFromZip(zipPath, tool.binary, OUT_DIR)
      if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath)
      process.stdout.write(' done\n')
      results.push({ name: tool.name, ok: true })
    } catch(e) {
      process.stdout.write(' FAILED\n')
      err(`  ${e.message}`)
      if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath)
      results.push({ name: tool.name, ok: false, error: e.message })
    }
  }

  process.stdout.write('\n── Summary ──────────────────────────────────────────\n')
  results.forEach(r => r.ok ? ok(`${r.name}${r.skipped?' (skipped)':''}`) : err(`${r.name}: ${r.error}`))

  const failed = results.filter(r => !r.ok)
  if (failed.length > 0) {
    process.stdout.write(`\n${failed.length} tool(s) failed. Retry: node scripts/bundle-binaries.js --tool <name>\n`)
    process.exit(1)
  } else {
    process.stdout.write('\nAll tools ready.\n\n')
  }
}

main().catch(e => { err('Fatal: ' + e.message); process.exit(1) })
