#!/usr/bin/env node

/**
 * This script is used to correctly run npm commands on Windows.
 * It ensures the correct npm executable is used and handles arguments properly.
 */

const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Determine the npm executable based on platform
const npmExecutable = process.platform === 'win32' ? 'npm.cmd' : 'npm';

// Get arguments passed to this script (exclude node and script name)
const args = process.argv.slice(2);

console.log(`Running npm command on ${process.platform}`);
console.log(`Command: ${npmExecutable} ${args.join(' ')}`);

// Run npm with the provided arguments
const result = spawnSync(npmExecutable, args, {
  stdio: 'inherit',  // Forward stdio to parent process
  shell: process.platform === 'win32', // Use shell on Windows
  windowsVerbatimArguments: process.platform === 'win32', // Handle Windows arguments correctly
  env: process.env  // Forward environment variables
});

// Handle possible errors
if (result.error) {
  console.error(`Error executing npm: ${result.error.message}`);
  process.exit(1);
}

// Forward the exit code from npm
process.exit(result.status);

