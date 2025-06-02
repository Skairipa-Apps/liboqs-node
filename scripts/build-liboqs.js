#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const rimraf = require('rimraf');

// Configuration
const liboqsDir = path.join(__dirname, '..', 'deps', 'liboqs');
const buildDir = path.join(liboqsDir, 'build');

console.log('Starting liboqs build process...');

try {
  // Step 1: Change to the liboqs directory
  console.log(`Changing to directory: ${liboqsDir}`);
  process.chdir(liboqsDir);

  // Step 2: Remove the build directory if it exists
  if (fs.existsSync(buildDir)) {
    console.log('Removing existing build directory...');
    rimraf.sync(buildDir);
  }

  // Step 3: Create a new build directory
  console.log('Creating build directory...');
  fs.mkdirSync(buildDir, { recursive: true });

  // Step 4: Change to the build directory
  console.log('Changing to build directory...');
  process.chdir(buildDir);

  // Step 5: Run cmake with the correct options
  console.log('Running cmake...');
  const cmakeArgs = [
    '-DBUILD_SHARED_LIBS=OFF',
    '-DCMAKE_BUILD_TYPE=Release',
    '-DOQS_BUILD_ONLY_LIB=ON',
    '-DOQS_USE_OPENSSL=ON',
    '-DOQS_DIST_BUILD=ON',
    '-GNinja',
    '..'
  ];

  const cmakeResult = spawnSync('cmake', cmakeArgs, { 
    stdio: 'inherit',
    shell: process.platform === 'win32' // Use shell on Windows
  });

  if (cmakeResult.error) {
    throw new Error(`Failed to run cmake: ${cmakeResult.error.message}`);
  }

  if (cmakeResult.status !== 0) {
    throw new Error(`cmake process exited with code ${cmakeResult.status}`);
  }

  // Step 6: Run ninja to build
  console.log('Running ninja to build liboqs...');
  const ninjaResult = spawnSync('ninja', [], {
    stdio: 'inherit',
    shell: process.platform === 'win32' // Use shell on Windows
  });

  if (ninjaResult.error) {
    throw new Error(`Failed to run ninja: ${ninjaResult.error.message}`);
  }

  if (ninjaResult.status !== 0) {
    throw new Error(`ninja process exited with code ${ninjaResult.status}`);
  }

  console.log('liboqs build completed successfully');
} catch (error) {
  console.error('Error building liboqs:', error.message);
  process.exit(1);
}

