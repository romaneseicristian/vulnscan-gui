// Maps logical tool names to their binary filename on each platform.
// Adding support for a new tool = add one entry here + drop the binary
// in resources/bin/{platform}/. No other code changes needed.

export type Platform = 'win32' | 'darwin' | 'linux'

export interface BinaryEntry {
  win32: string
  darwin: string
  linux: string
  // GitHub release URL pattern for the bundle script
  releaseUrl?: {
    win32?: string
    darwin?: string
    linux?: string
  }
}

export const BINARY_REGISTRY: Record<string, BinaryEntry> = {
  nmap: {
    win32: 'nmap.exe',
    darwin: 'nmap',
    linux: 'nmap',
    releaseUrl: {
      win32: 'https://nmap.org/dist/nmap-7.97-setup.exe',
    },
  },
  nuclei: {
    win32: 'nuclei.exe',
    darwin: 'nuclei',
    linux: 'nuclei',
    releaseUrl: {
      win32: 'https://github.com/projectdiscovery/nuclei/releases/latest/download/nuclei_windows_amd64.zip',
      darwin: 'https://github.com/projectdiscovery/nuclei/releases/latest/download/nuclei_macos_amd64.zip',
      linux: 'https://github.com/projectdiscovery/nuclei/releases/latest/download/nuclei_linux_amd64.zip',
    },
  },
  httpx: {
    win32: 'httpx.exe',
    darwin: 'httpx',
    linux: 'httpx',
    releaseUrl: {
      win32: 'https://github.com/projectdiscovery/httpx/releases/latest/download/httpx_windows_amd64.zip',
      darwin: 'https://github.com/projectdiscovery/httpx/releases/latest/download/httpx_macos_amd64.zip',
      linux: 'https://github.com/projectdiscovery/httpx/releases/latest/download/httpx_linux_amd64.zip',
    },
  },
  naabu: {
    win32: 'naabu.exe',
    darwin: 'naabu',
    linux: 'naabu',
    releaseUrl: {
      win32: 'https://github.com/projectdiscovery/naabu/releases/latest/download/naabu_windows_amd64.zip',
      darwin: 'https://github.com/projectdiscovery/naabu/releases/latest/download/naabu_macos_amd64.zip',
      linux: 'https://github.com/projectdiscovery/naabu/releases/latest/download/naabu_linux_amd64.zip',
    },
  },
  subfinder: {
    win32: 'subfinder.exe',
    darwin: 'subfinder',
    linux: 'subfinder',
    releaseUrl: {
      win32: 'https://github.com/projectdiscovery/subfinder/releases/latest/download/subfinder_windows_amd64.zip',
      darwin: 'https://github.com/projectdiscovery/subfinder/releases/latest/download/subfinder_macos_amd64.zip',
      linux: 'https://github.com/projectdiscovery/subfinder/releases/latest/download/subfinder_linux_amd64.zip',
    },
  },
  dnsx: {
    win32: 'dnsx.exe',
    darwin: 'dnsx',
    linux: 'dnsx',
    releaseUrl: {
      win32: 'https://github.com/projectdiscovery/dnsx/releases/latest/download/dnsx_windows_amd64.zip',
      darwin: 'https://github.com/projectdiscovery/dnsx/releases/latest/download/dnsx_macos_amd64.zip',
      linux: 'https://github.com/projectdiscovery/dnsx/releases/latest/download/dnsx_linux_amd64.zip',
    },
  },
  ffuf: {
    win32: 'ffuf.exe',
    darwin: 'ffuf',
    linux: 'ffuf',
    releaseUrl: {
      win32: 'https://github.com/ffuf/ffuf/releases/latest/download/ffuf_windows_amd64.zip',
      darwin: 'https://github.com/ffuf/ffuf/releases/latest/download/ffuf_macos_amd64.zip',
      linux: 'https://github.com/ffuf/ffuf/releases/latest/download/ffuf_linux_amd64.zip',
    },
  },
  gobuster: {
    win32: 'gobuster.exe',
    darwin: 'gobuster',
    linux: 'gobuster',
    releaseUrl: {
      win32: 'https://github.com/OJ/gobuster/releases/latest/download/gobuster_Windows_x86_64.zip',
      darwin: 'https://github.com/OJ/gobuster/releases/latest/download/gobuster_Darwin_x86_64.tar.gz',
      linux: 'https://github.com/OJ/gobuster/releases/latest/download/gobuster_Linux_x86_64.tar.gz',
    },
  },
  katana: {
    win32: 'katana.exe',
    darwin: 'katana',
    linux: 'katana',
    releaseUrl: {
      win32: 'https://github.com/projectdiscovery/katana/releases/latest/download/katana_windows_amd64.zip',
      darwin: 'https://github.com/projectdiscovery/katana/releases/latest/download/katana_macos_amd64.zip',
      linux: 'https://github.com/projectdiscovery/katana/releases/latest/download/katana_linux_amd64.zip',
    },
  },
  wafw00f: {
    win32: 'wafw00f.exe',
    darwin: 'wafw00f',
    linux: 'wafw00f',
  },
  sqlmap: {
    win32: 'sqlmap.exe',
    darwin: 'sqlmap',
    linux: 'sqlmap',
  },
}

export function getBinaryFilename(toolName: string, platform: Platform): string {
  const entry = BINARY_REGISTRY[toolName]
  if (!entry) throw new Error(`Unknown tool: ${toolName}`)
  return entry[platform]
}

export function getAllToolNames(): string[] {
  return Object.keys(BINARY_REGISTRY)
}
