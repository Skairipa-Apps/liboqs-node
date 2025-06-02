#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

// Cross-platform path to the header file
const headerPath = path.join(__dirname, '..', 'deps', 'liboqs', 'build', 'include', 'oqs', 'oqs.h');

// Check if the file exists
if (!fs.existsSync(headerPath)) {
  console.log('liboqs headers not found. Building liboqs...');
  
  // Use npm executable directly (resolves the ../npm issue on Windows)
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  
  const result = spawnSync(npmCmd, ['run', 'liboqs:build'], {
    stdio: 'inherit',
    shell: process.platform === 'win32'  // Use shell on Windows
  });
  
  if (result.error) {
    console.error('Error running npm:', result.error.message);
    process.exit(1);
  }
  
  if (result.status !== 0) {
    console.error(`Build process exited with code ${result.status}`);
    process.exit(result.status);
  }
} else {
  console.log('liboqs headers found. Skipping build.');
}

