/**
 * Script to build electron files using esbuild (CJS format)
 * and then launch Electron, pointing at the Vite dev server.
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const devUrlFile = path.join(__dirname, '..', '.dev-server-url');
if (fs.existsSync(devUrlFile)) {
  try {
    fs.unlinkSync(devUrlFile);
  } catch (e) {
    // Ignore cleanup error
  }
}

// Build main.ts and preload.ts as CommonJS
execSync(
  `npx esbuild electron/main.ts electron/preload.ts --bundle --platform=node --outdir=dist-electron --format=cjs --external:electron --out-extension:.js=.cjs`,
  { cwd: path.join(__dirname, '..'), stdio: 'inherit' }
);

console.log('Electron files built successfully to dist-electron/');
