# Binary Resources

This directory contains bundled tool binaries per platform.

Structure:
  bin/
    win32/    ← Windows .exe binaries
    darwin/   ← macOS binaries
    linux/    ← Linux binaries

Binaries are populated by running:
  node scripts/bundle-binaries.js

They are NOT committed to git (see .gitignore).
At build time, electron-builder includes the correct platform folder
via the extraResources config in package.json.
