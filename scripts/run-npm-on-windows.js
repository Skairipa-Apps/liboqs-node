#!/usr/bin/env node

/**
 * This script is used as a wrapper to run npm commands on Windows
 * It ensures the correct npm.cmd is used with the correct path
 */

const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Get npm executable path (npm.cmd on Windows)
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

// Get arguments (skip node and script path)
const args = process.argv.slice(2);

console.log(`Running: ${npmCmd} ${args.join(' ')}`);

// Execute npm with provided arguments
const result = spawnSync(npmCmd, args, {
  stdio: 'inherit',
  shell: true,
  windowsVerbatimArguments: true
});

// Forward the exit code
process.exit(result.status);

