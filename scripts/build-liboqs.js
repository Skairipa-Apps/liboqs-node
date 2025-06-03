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

// Step 5: Detect platform and run the appropriate build commands
  if (process.platform === 'win32') {
    console.log('Detected Windows platform - using Visual Studio generator');

    // Run cmake with Visual Studio generator
    const cmakeArgs = [
      '-DBUILD_SHARED_LIBS=OFF',
      '-DCMAKE_BUILD_TYPE=Release',
      '-DOQS_BUILD_ONLY_LIB=ON',
      '-DOQS_USE_OPENSSL=ON',
      '-DOQS_DIST_BUILD=ON',
      '-G',
      'Visual Studio 17 2022', // or adjust to your VS version, e.g. "Visual Studio 16 2019"
      '..'
    ];

console.log('Running CMake with args:', cmakeArgs.join(' '));

const cmakeResult = spawnSync('cmake', cmakeArgs, {
  encoding: 'utf-8',
  shell: true,
});

if (cmakeResult.error) {
  console.error('cmake error:', cmakeResult.error);
}
console.log('cmake stdout:', cmakeResult.stdout);
console.error('cmake stderr:', cmakeResult.stderr);
if (cmakeResult.status !== 0) {
  throw new Error(`cmake exited with code ${cmakeResult.status}`);
}
console.log('Running MSBuild via cmake --build...');

const buildResult = spawnSync('cmake', ['--build', '.', '--config', 'Release'], {
  encoding: 'utf-8',
  shell: true,
});

if (buildResult.error) {
  console.error('Build error:', buildResult.error);
}
console.log('Build stdout:', buildResult.stdout);
console.error('Build stderr:', buildResult.stderr);
if (buildResult.status !== 0) {
  throw new Error(`Build exited with code ${buildResult.status}`);
}
  } else {
    console.log('Detected Unix-like platform - using Ninja generator');

    // Run cmake with Ninja generator
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
      shell: false,
    });

    if (cmakeResult.error) {
      throw new Error(`Failed to run cmake: ${cmakeResult.error.message}`);
    }
    if (cmakeResult.status !== 0) {
      throw new Error(`cmake process exited with code ${cmakeResult.status}`);
    }

    // Run ninja to build
    console.log('Running ninja to build liboqs...');
    const ninjaResult = spawnSync('ninja', [], {
      stdio: 'inherit',
      shell: false,
    });

    if (ninjaResult.error) {
      throw new Error(`Failed to run ninja: ${ninjaResult.error.message}`);
    }
    if (ninjaResult.status !== 0) {
      throw new Error(`ninja process exited with code ${ninjaResult.status}`);
    }
  }

  console.log('liboqs build completed successfully');
} catch (error) {
  console.error('Error building liboqs:', error.message);
  process.exit(1);
}
