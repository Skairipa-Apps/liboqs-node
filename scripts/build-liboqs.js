#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import rimraf from 'rimraf';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));


// Configuration
const liboqsDir = path.join(__dirname, '..', 'deps', 'liboqs');
const buildDir = path.join(liboqsDir, 'build');

/**
 * Patches x86-specific source files to skip them on ARM builds
 * by wrapping the entire file content in #if guards
 */
function patchX86SpecificFiles(isArmBuild) {
  if (!isArmBuild) return;
  
  console.log('Patching x86-specific source files for ARM build...');
  
  // Files that contain x86-specific code
  const filesToPatch = [
    {
      path: path.join(liboqsDir, 'src', 'common', 'aes', 'aes128_ni.c'),
      guard: `
// This file has been patched to exclude x86-specific code on ARM
#if !(defined(__ARM_ARCH) || defined(DISABLE_X86_INTRIN) || defined(__aarch64__) || defined(OQS_SKIP_X86_SPECIFIC))
// Original content will be here
#else
// Provide ARM-compatible stubs
#include "aes.h"
#include <stdint.h>

// Simple implementation for ARM architectures that don't support x86 intrinsics
void AES128_ECB_ni(const uint8_t *key, const uint8_t *in, uint8_t *out) {
    // Fallback to non-x86 implementation
    AES128_ECB(key, in, out);
}
#endif
`
    },
    {
      path: path.join(liboqsDir, 'src', 'common', 'aes', 'aes256_ni.c'),
      guard: `
// This file has been patched to exclude x86-specific code on ARM
#if !(defined(__ARM_ARCH) || defined(DISABLE_X86_INTRIN) || defined(__aarch64__) || defined(OQS_SKIP_X86_SPECIFIC))
// Original content will be here
#else
// Provide ARM-compatible stubs
#include "aes.h"
#include <stdint.h>

// Simple implementation for ARM architectures that don't support x86 intrinsics
void AES256_ECB_ni(const uint8_t *key, const uint8_t *in, uint8_t *out) {
    // Fallback to non-x86 implementation
    AES256_ECB(key, in, out);
}
#endif
`
    }
  ];

  for (const file of filesToPatch) {
    if (!fs.existsSync(file.path)) {
      console.log(`File not found: ${file.path}`);
      continue;
    }
    
    let content = fs.readFileSync(file.path, 'utf8');
    
    // Only patch if not already patched
    if (!content.includes('__ARM_ARCH') && !content.includes('DISABLE_X86_INTRIN')) {
      console.log(`Patching ${path.basename(file.path)} to skip x86-specific code on ARM...`);
      
      // Split the guard template and insert the original content
      const [guardStart, guardEnd] = file.guard.split('// Original content will be here');
      content = guardStart + content + guardEnd;
      
      fs.writeFileSync(file.path, content);
      console.log(`✅ Successfully patched ${path.basename(file.path)}`);
    } else {
      console.log(`File ${path.basename(file.path)} already patched, skipping.`);
    }
  }
  
  // Also patch CMakeLists.txt to handle x86-specific files properly
  const cmakeListsPath = path.join(liboqsDir, 'src', 'common', 'CMakeLists.txt');
  if (fs.existsSync(cmakeListsPath)) {
    let cmakeContent = fs.readFileSync(cmakeListsPath, 'utf8');
    
    // Only patch if not already patched
    if (!cmakeContent.includes('DISABLE_X86_INTRIN') && !cmakeContent.includes('OQS_SKIP_X86_SPECIFIC')) {
      console.log('Patching CMakeLists.txt to improve ARM compatibility...');
      
      // More comprehensive modifications to the CMake file
      let modified = false;
      
      // 1. Find the section that includes AES NI files and make it conditional
      const aesNiIncludePattern = /set\(AES_IMPL\s+\${AES_IMPL}\s+aes\/aes128_ni\.c\)/;
      if (aesNiIncludePattern.test(cmakeContent)) {
        cmakeContent = cmakeContent.replace(
          aesNiIncludePattern,
          'if(NOT DEFINED OQS_SKIP_X86_SPECIFIC AND NOT CMAKE_SYSTEM_PROCESSOR MATCHES "^(arm.*|aarch64.*)")\n      $&\n      else()\n        message(STATUS "Skipping x86-specific AES files on ${CMAKE_SYSTEM_PROCESSOR}")\n      endif()'
        );
        modified = true;
      }
      
      // 2. Find the part that sets source properties with x86 flags
      const setSourcePropsRegex = /set_source_files_properties\(aes\/aes\d+_ni\.c\s+PROPERTIES\s+COMPILE_FLAGS\s+"-maes\s+-mssse3"\)/g;
      
      if (setSourcePropsRegex.test(cmakeContent)) {
        // Wrap the property setting in a condition
        cmakeContent = cmakeContent.replace(
          setSourcePropsRegex,
          'if(NOT DEFINED OQS_SKIP_X86_SPECIFIC AND NOT CMAKE_SYSTEM_PROCESSOR MATCHES "^(arm.*|aarch64.*)")\n      $&\n      endif()'
        );
        modified = true;
      }
      
      // 3. Add a definition for ARM architecture
      if (!cmakeContent.includes('OQS_SYSTEM_ARM')) {
        const targetDefPattern = /target_compile_definitions\(common PRIVATE (.*)\)/;
        if (targetDefPattern.test(cmakeContent)) {
          cmakeContent = cmakeContent.replace(
            targetDefPattern,
            'if(CMAKE_SYSTEM_PROCESSOR MATCHES "^(arm.*|aarch64.*)")\n  target_compile_definitions(common PRIVATE OQS_SYSTEM_ARM OQS_SKIP_X86_SPECIFIC)\nelse()\n  $&\nendif()'
          );
          modified = true;
        }
      }
      
      if (modified) {
        fs.writeFileSync(cmakeListsPath, cmakeContent);
        console.log('✅ Successfully patched CMakeLists.txt');
      } else {
        console.log('Did not find expected patterns in CMakeLists.txt, manual patching may be required');
      }
    } else {
      console.log('Did not find x86-specific flags in CMakeLists.txt, or format is different than expected');
    }
  } else {
    console.log('CMakeLists.txt not found, skipping.');
  }
  
  // Also create empty stub files as fallbacks for x86-specific headers
  const x86Headers = [
    { name: 'wmmintrin.h', content: '// Empty stub for ARM compatibility\n#ifndef WMMINTRIN_H\n#define WMMINTRIN_H\n// This is a stub header for ARM builds\n#endif\n' },
    { name: 'tmmintrin.h', content: '// Empty stub for ARM compatibility\n#ifndef TMMINTRIN_H\n#define TMMINTRIN_H\n// This is a stub header for ARM builds\n#endif\n' },
    { name: 'emmintrin.h', content: '// Empty stub for ARM compatibility\n#ifndef EMMINTRIN_H\n#define EMMINTRIN_H\n// This is a stub header for ARM builds\n#endif\n' }
  ];
  
  const includeDir = path.join(buildDir, 'include', 'stubs');
  fs.mkdirSync(includeDir, { recursive: true });
  
  x86Headers.forEach(header => {
    const headerPath = path.join(includeDir, header.name);
    try {
      fs.writeFileSync(headerPath, header.content);
      console.log(`Created stub header: ${headerPath}`);
    } catch (error) {
      console.error(`Failed to create stub header: ${headerPath}`, error);
    }
  });
  
  // Add include path for stub headers
  process.env.CFLAGS = `${process.env.CFLAGS || ''} -I${includeDir}`;
  process.env.CXXFLAGS = `${process.env.CXXFLAGS || ''} -I${includeDir}`;
  console.log(`Added stub headers include path to CFLAGS/CXXFLAGS`);
}
console.log('Starting liboqs build process... (syntax fixed)');

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

    const cmakeArgs = [
      '-DBUILD_SHARED_LIBS=OFF',
      '-DCMAKE_BUILD_TYPE=Release',
      '-DOQS_BUILD_ONLY_LIB=ON',
      '-DOQS_USE_OPENSSL=ON',
      '-DOQS_DIST_BUILD=ON',
      '-G',
      'Visual Studio 17 2022',
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

    // Enhanced architecture detection with prioritization for cross-compilation
    
    // Check for ARM-specific environment variables that might indicate cross-compilation
    const npmConfigArch = process.env.npm_config_arch;
    const ccCompiler = process.env.CC;
    
    // Prioritize compiler and npm_config_arch over process.arch
    
    // Detect ARM compilers
    const isArmCompiler = ccCompiler && (
      ccCompiler.includes('arm-linux') || 
      ccCompiler.includes('armv7') || 
      ccCompiler.includes('armhf')
    );
    
    // Detect ARM64/aarch64 compilers
    const isAarch64Compiler = ccCompiler && (
      ccCompiler.includes('aarch64')
    );
    
    // Detect npm target architecture
    const isArmTarget = npmConfigArch === 'arm' || npmConfigArch === 'armhf';
    const isAarch64Target = npmConfigArch === 'arm64';
    
    // Detect native architecture
    const isArmLinux = process.platform === 'linux' && process.arch.startsWith('arm');
    const isAarch64 = process.arch === 'arm64' || process.arch === 'aarch64';
    
    // Cross-compilation check (building on one architecture for another)
    const isCrossCompiling = (isArmCompiler || isAarch64Compiler || isArmTarget || isAarch64Target) && 
                            process.arch !== 'arm' && process.arch !== 'arm64' && process.arch !== 'aarch64';
    
    // Combined architecture detection - prioritize compiler and npm_config_arch over process.arch
    const isArmArchitecture = isArmCompiler || isArmTarget || isArmLinux || isAarch64Compiler || isAarch64Target || isAarch64;
    
    // Determine if we're specifically targeting ARM64/aarch64
    const isTargetingAarch64 = isAarch64Compiler || isAarch64Target || (!isCrossCompiling && isAarch64);
    
    // Only consider x86_64 if we're not cross-compiling to ARM
    const isX86_64 = !isArmArchitecture;
    
    // Detailed system information logging for debugging
    console.log('==================== Build System Information ====================');
    console.log(`Platform: ${process.platform}, Architecture: ${process.arch}`);
    console.log(`Node.js version: ${process.version}`);
    console.log(`Environment: npm_config_arch=${npmConfigArch || 'not set'}, CC=${ccCompiler || 'not set'}`);
    console.log(`Detected compiler for ARM: ${isArmCompiler ? 'Yes' : 'No'}, for ARM64: ${isAarch64Compiler ? 'Yes' : 'No'}`);
    console.log(`Detected npm target for ARM: ${isArmTarget ? 'Yes' : 'No'}, for ARM64: ${isAarch64Target ? 'Yes' : 'No'}`);
    console.log(`Cross-compilation: ${isCrossCompiling ? 'Yes' : 'No'}`);
    console.log(`Final architecture decision: ${isArmArchitecture ? 'ARM' : 'non-ARM'}, ARM64/aarch64: ${isTargetingAarch64 ? 'Yes' : 'No'}`);
    console.log('==================================================================');

    // Force ARM architecture when cross-compiling with ARM tools
    const forceArmArchitecture = isArmCompiler || isArmTarget;
    const explicitCrossCompile = isArmCompiler && process.arch === 'x64';

    // Set up basic cmake args
    const cmakeArgs = [];
    
    // For ARM builds, add early flags to completely exclude x86-specific files
    if (isArmArchitecture) {
      // Force CMake to skip x86 files entirely
      cmakeArgs.push('-DOQS_SKIP_X86_FILES=ON');
      cmakeArgs.push('-DCMAKE_DISABLE_FIND_PACKAGE_X86=ON');
      
      // Add compiler definitions before any other flags
      const skipX86Defines = [
        '-DDISABLE_X86_INTRIN',
        '-DOQS_NO_AES_NI=1',
        '-DOQS_SKIP_X86_SPECIFIC=1',
        '-D__ARM_CROSS_COMPILE=1'
      ].join(' ');
      
      // Set environment variables to control compiler behavior
      process.env.CFLAGS = `${skipX86Defines} ${process.env.CFLAGS || ''}`;
      process.env.CXXFLAGS = `${skipX86Defines} ${process.env.CXXFLAGS || ''}`;
      console.log(`Setting early compiler flags for ARM builds:`);
      console.log(`CFLAGS: ${process.env.CFLAGS}`);
      console.log(`CXXFLAGS: ${process.env.CXXFLAGS}`);
    }
    
    // Check if we're building for Bun (need shared libraries for FFI)
    const buildShared = process.env.BUILD_SHARED === 'true' || process.argv.includes('--shared');
    
    // Add standard CMake args
    cmakeArgs.push(
      buildShared ? '-DBUILD_SHARED_LIBS=ON' : '-DBUILD_SHARED_LIBS=OFF',
      '-DCMAKE_BUILD_TYPE=Release',
      '-DOQS_BUILD_ONLY_LIB=ON',
      '-DOQS_USE_OPENSSL=ON',
      '-DOQS_DIST_BUILD=ON',
      '-GNinja'
    );
    
    if (buildShared) {
      console.log('Building shared libraries for FFI compatibility...');
    }
    
    // Add cross-compilation setup if needed
    if (explicitCrossCompile) {
      console.log('Setting up explicit cross-compilation for ARM...');
      cmakeArgs.push('-DCMAKE_CROSSCOMPILING=ON');
      cmakeArgs.push('-DCMAKE_SYSTEM_NAME=Linux');
      cmakeArgs.push('-DCMAKE_SYSTEM_VERSION=1');
      
      // Set explicit compilers if using ARM compiler
      if (ccCompiler && ccCompiler.includes('arm-linux-gnueabihf')) {
        cmakeArgs.push('-DCMAKE_C_COMPILER=arm-linux-gnueabihf-gcc');
        cmakeArgs.push('-DCMAKE_CXX_COMPILER=arm-linux-gnueabihf-g++');
      }
    }

    if (isArmArchitecture) {
      console.log('============== Configuring for ARM Architecture ==============');
      
      // Explicitly disable ALL x86-specific optimizations and features
      cmakeArgs.push('-DOQS_DIST_X86_64_BUILD=OFF');
      cmakeArgs.push('-DOQS_USE_AES_INSTRUCTIONS=OFF');
      cmakeArgs.push('-DOQS_DISABLE_X86=ON');
      
      // Additional x86 disabling to ensure no x86 instructions are used
      cmakeArgs.push('-DOQS_SPEED_USE_AES_NI=OFF');
      cmakeArgs.push('-DOQS_USE_X86_64_BUILD=OFF');
      cmakeArgs.push('-DOQS_ENABLE_AES_NI=OFF');
      cmakeArgs.push('-DOQS_ENABLE_SSSE3=OFF');
      cmakeArgs.push('-DOQS_ENABLE_SSE2=OFF');
      cmakeArgs.push('-DOQS_ENABLE_AVX=OFF');
      cmakeArgs.push('-DOQS_ENABLE_AVX2=OFF');
      cmakeArgs.push('-DOQS_ENABLE_AVX512=OFF');
      cmakeArgs.push('-DOQS_ENABLE_PCLMULQDQ=OFF');
      
      // Force ARM build configuration
      if (forceArmArchitecture) {
        cmakeArgs.push('-DOQS_ARM_BUILD=ON');
      }
      
      // Set the system processor explicitly to prevent auto-detection issues
      if (isTargetingAarch64) {
        console.log('Setting system processor to aarch64');
        cmakeArgs.push('-DCMAKE_SYSTEM_PROCESSOR=aarch64');
        
        // Add ARM64-specific CMake options
        cmakeArgs.push('-DOQS_DIST_ARM64_BUILD=ON');
        cmakeArgs.push('-DARMV8=ON');
      } else {
        console.log('Setting system processor to arm');
        cmakeArgs.push('-DCMAKE_SYSTEM_PROCESSOR=arm');
      }
      
      // Add compile definitions to skip x86-specific files
      if (explicitCrossCompile || isArmCompiler) {
        const armDefines = [
          '-DDISABLE_X86_INTRIN',
          '-DOQS_NO_AES_NI',
          '-DOQS_SKIP_X86_SPECIFIC=1',
          '-D__ARM_CROSS_COMPILE=1'
        ].join(' ');
        
        // Add to both C and CXX flags
        process.env.CFLAGS = `${process.env.CFLAGS || ''} ${armDefines}`;
        process.env.CXXFLAGS = `${process.env.CXXFLAGS || ''} ${armDefines}`;
        
        console.log('Setting ARM-specific environment variables:');
        console.log(`CFLAGS: ${process.env.CFLAGS}`);
        console.log(`CXXFLAGS: ${process.env.CXXFLAGS}`);
      }
      
      // Explicitly disable any compiler flags that might cause issues on ARM
      cmakeArgs.push('-DCMAKE_C_FLAGS_INIT=-DDISABLE_X86_INTRIN');
      cmakeArgs.push('-DCMAKE_CXX_FLAGS_INIT=-DDISABLE_X86_INTRIN');
      
      // Patch x86-specific source files to skip them on ARM builds
      patchX86SpecificFiles(true);
      
      // For ARM64, enable ARM-specific optimizations
      if (isTargetingAarch64) {
        console.log('ARM64 architecture detected - enabling ARM64-specific optimizations');
        cmakeArgs.push('-DOQS_DIST_ARM64_V8_BUILD=ON');
        cmakeArgs.push('-DOQS_USE_ARM_AES_INSTRUCTIONS=ON');
        
        // ARM64-specific compiler flags
        if (process.platform === 'darwin') {
          // macOS/Apple Silicon specific flags
          console.log('Configuring for Apple Silicon (ARM64)');
          cmakeArgs.push('-DCMAKE_C_FLAGS=-arch arm64');
          cmakeArgs.push('-DCMAKE_CXX_FLAGS=-arch arm64');
        } else if (isAarch64Compiler) {
          // For cross-compilation with ARM64 compiler
          console.log('Configuring for cross-compilation with ARM64 compiler');
          
          // Explicitly add ARM64-specific CMake configuration
          cmakeArgs.push('-DOQS_DIST_ARM64_V8_BUILD=ON');
          
          // Check if we're using aarch64-linux-gnu-gcc
          const isAarch64LinuxGnu = ccCompiler && ccCompiler.includes('aarch64-linux-gnu');
          
          if (isAarch64LinuxGnu) {
            console.log('Detected aarch64-linux-gnu compiler - using specific flags');
            
            // Set environment variables to override any conflicting flags
            if (!process.env.CFLAGS) {
              process.env.CFLAGS = '-fPIC -D__ARM_FEATURE_CRYPTO -DDISABLE_X86_INTRIN';
              console.log('Setting CFLAGS environment variable:', process.env.CFLAGS);
            }
            
            if (!process.env.CXXFLAGS) {
              process.env.CXXFLAGS = '-fPIC -D__ARM_FEATURE_CRYPTO -DDISABLE_X86_INTRIN';
              console.log('Setting CXXFLAGS environment variable:', process.env.CXXFLAGS);
            }
            
            // Simple ARM64 flags for aarch64-linux-gnu-gcc
            // IMPORTANT: Avoid using any architecture-specific flags like -march
            // that might cause conflicts with the compiler
            const aarch64LinuxFlags = [
              '-fPIC',
              '-D__ARM_FEATURE_CRYPTO',
              '-DDISABLE_X86_INTRIN'
            ].join(' ');
            
            cmakeArgs.push(`-DCMAKE_C_FLAGS=${aarch64LinuxFlags}`);
            cmakeArgs.push(`-DCMAKE_CXX_FLAGS=${aarch64LinuxFlags}`);
          } else {
            // Generic ARM64 flags for other compilers
            const aarch64Flags = [
              '-fPIC',
              '-D__DISABLE_AES__',
              '-D__DISABLE_SSSE3__',
              '-DDISABLE_X86_INTRIN'
            ].join(' ');
            
            cmakeArgs.push(`-DCMAKE_C_FLAGS=${aarch64Flags}`);
            cmakeArgs.push(`-DCMAKE_CXX_FLAGS=${aarch64Flags}`);
          }
        } else if (isArmCompiler) {
          // For cross-compilation with ARM compiler
          console.log('Configuring for cross-compilation with ARM compiler');
          const armCrossFlags = [
            '-fPIC',
            '-D__DISABLE_AES__',
            '-D__DISABLE_SSSE3__',
            '-DDISABLE_X86_INTRIN'
          ].join(' ');
          
          cmakeArgs.push(`-DCMAKE_C_FLAGS=${armCrossFlags}`);
          cmakeArgs.push(`-DCMAKE_CXX_FLAGS=${armCrossFlags}`);
        } else {
          // Linux ARM64 specific flags - explicitly avoid any x86 instructions
          console.log('Configuring for Linux ARM64');
          // The +crypto suffix enables hardware crypto extensions if available
          // Note: DO NOT use -mfpu=neon or -fno-integrated-as with ARM64
          const arm64Flags = [
            '-march=armv8-a+crypto',
            '-fPIC',
            '-D__ARM_FEATURE_CRYPTO',
            // Explicitly disable x86 instructions in compiler flags
            '-D__DISABLE_AES__',
            '-D__DISABLE_SSSE3__',
            '-DDISABLE_X86_INTRIN'
          ].join(' ');
          
          cmakeArgs.push(`-DCMAKE_C_FLAGS=${arm64Flags}`);
          cmakeArgs.push(`-DCMAKE_CXX_FLAGS=${arm64Flags}`);
        }
      } else {
        // Non-ARM64 ARM architecture (e.g., armv7)
        console.log('ARM (non-ARM64) architecture detected');
        
        // Only use ARMv7-specific flags if we're specifically using an ARMv7 compiler
        if (isArmCompiler && !isAarch64Compiler) {
          console.log('Using ARMv7-specific compiler flags');
          const armv7Flags = [
            '-march=armv7-a',
            '-fPIC',
            '-mfpu=neon',
            // Explicitly disable x86 instructions in compiler flags
            '-D__DISABLE_AES__',
            '-D__DISABLE_SSSE3__',
            '-DDISABLE_X86_INTRIN'
          ].join(' ');
          
          cmakeArgs.push(`-DCMAKE_C_FLAGS=${armv7Flags}`);
          cmakeArgs.push(`-DCMAKE_CXX_FLAGS=${armv7Flags}`);
        } else {
          // Generic ARM flags without architecture-specific options
          const genericArmFlags = [
            '-fPIC',
            '-D__DISABLE_AES__',
            '-D__DISABLE_SSSE3__',
            '-DDISABLE_X86_INTRIN'
          ].join(' ');
          
          cmakeArgs.push(`-DCMAKE_C_FLAGS=${genericArmFlags}`);
          cmakeArgs.push(`-DCMAKE_CXX_FLAGS=${genericArmFlags}`);
        }
      }
      console.log('==================================================================');
    } else {
      // For x86/x64 platforms
      console.log('============= Configuring for x86/x64 Architecture =============');
      cmakeArgs.push('-DOQS_DIST_X86_64_BUILD=ON');
      
      // Check if we're in a container environment that might not support AVX2
      const isContainer = process.env.CI === 'true' && process.env.ACT === 'true';
      const disableAesNi = process.env.CMAKE_FLAGS && process.env.CMAKE_FLAGS.includes('DOQS_ENABLE_AESNI=OFF');
      
      // Also check for explicit CMAKE_FLAGS from environment
      if (process.env.CMAKE_FLAGS) {
        console.log('Found CMAKE_FLAGS environment variable:', process.env.CMAKE_FLAGS);
        // Parse CMAKE_FLAGS and add each flag
        const flags = process.env.CMAKE_FLAGS.split(' ').filter(flag => flag.trim().length > 0);
        flags.forEach(flag => {
          if (flag.startsWith('-D')) {
            cmakeArgs.push(flag);
            console.log('Added CMake flag from environment:', flag);
          }
        });
      }
      
      if (isContainer || disableAesNi) {
        console.log('Container or restricted environment detected - disabling advanced CPU instructions');
        cmakeArgs.push('-DOQS_USE_AES_INSTRUCTIONS=OFF');
        cmakeArgs.push('-DOQS_ENABLE_AESNI=OFF');
        cmakeArgs.push('-DOQS_ENABLE_AVX=OFF');
        cmakeArgs.push('-DOQS_ENABLE_AVX2=OFF');
        cmakeArgs.push('-DOQS_ENABLE_AVX512=OFF');
        cmakeArgs.push('-DOQS_ENABLE_SSSE3=OFF');
        cmakeArgs.push('-DOQS_ENABLE_SSE2=OFF');
        cmakeArgs.push('-DOQS_ENABLE_PCLMULQDQ=OFF');
      } else if (!process.env.CMAKE_FLAGS || !process.env.CMAKE_FLAGS.includes('DOQS_USE_AES_INSTRUCTIONS')) {
        cmakeArgs.push('-DOQS_USE_AES_INSTRUCTIONS=ON');
      }
      
      cmakeArgs.push('-DCMAKE_SYSTEM_PROCESSOR=x86_64');
      console.log('==================================================================');
    }
    
    // Add any additional CMAKE_FLAGS that weren't already handled
    if (process.env.CMAKE_FLAGS) {
      console.log('Processing additional CMAKE_FLAGS environment variable:', process.env.CMAKE_FLAGS);
      const flags = process.env.CMAKE_FLAGS.split(' ').filter(flag => flag.trim().length > 0);
      flags.forEach(flag => {
        if (flag.startsWith('-D') && !cmakeArgs.includes(flag)) {
          cmakeArgs.push(flag);
          console.log('Added additional CMake flag from environment:', flag);
        }
      });
    }

    cmakeArgs.push('..');

    // Print the complete CMake command for debugging
    console.log('Running CMake with args:', cmakeArgs.join(' '));

    try {
      // Add special handling for ARM64/aarch64 builds
      // Add special handling for ARM builds
      if (isArmArchitecture) {
        if (isTargetingAarch64) {
          console.log('⚠️ Using ARM64/aarch64 build configuration');
          console.log('⚠️ This will explicitly disable ARMv7-specific flags that are incompatible with aarch64');
          
          // Check compiler compatibility
          if (ccCompiler && ccCompiler.includes('aarch64')) {
            console.log('✅ Detected aarch64 compiler: ' + ccCompiler);
            
            // For cross-compilation with aarch64-linux-gnu-gcc
            if (ccCompiler.includes('aarch64-linux-gnu')) {
              console.log('⚠️ Cross-compiling with aarch64-linux-gnu-gcc - using minimal flags');
              
              // Handle cross-compilation environment
              cmakeArgs.push('-DCMAKE_CROSSCOMPILING=ON');
              
              // Remove any potentially problematic flags from the command line
              for (let i = 0; i < cmakeArgs.length; i++) {
                if (cmakeArgs[i].includes('-march=') || 
                    cmakeArgs[i].includes('-mfpu=') || 
                    cmakeArgs[i].includes('-fno-integrated-as')) {
                  console.log(`⚠️ Removing potentially problematic flag: ${cmakeArgs[i]}`);
                  cmakeArgs.splice(i, 1);
                  i--;
                }
              }
            }
          } else if (ccCompiler) {
            console.log('⚠️ Warning: Using non-aarch64 compiler for ARM64 build: ' + ccCompiler);
          }
        } else if (isArmCompiler) {
          console.log('⚠️ Cross-compiling for ARM with compiler: ' + ccCompiler);
          
          // Create a simple preprocessor header to exclude x86-specific code
          const skipX86Header = path.join(buildDir, 'skip_x86.h');
          console.log(`Creating helper header at ${skipX86Header} to skip x86-specific code`);
          
          const headerContent = `
#ifndef SKIP_X86_H
#define SKIP_X86_H

// This header is automatically generated to skip x86-specific code during ARM builds
#define DISABLE_X86_INTRIN
#define OQS_NO_AES_NI
#define OQS_SKIP_X86_SPECIFIC 1

#endif // SKIP_X86_H
`;
          
          try {
            fs.writeFileSync(skipX86Header, headerContent);
            console.log('Successfully created helper header');
            
            // Add the directory containing the header to include path
            cmakeArgs.push(`-DCMAKE_C_FLAGS=-I${buildDir} -DOQS_NO_AES_NI=1 -DOQS_SKIP_X86_SPECIFIC=1`);
          } catch (error) {
            console.error('Failed to create helper header:', error);
          }
        }
      }
      
      const cmakeResult = spawnSync('cmake', cmakeArgs, {
        stdio: 'inherit',
        shell: false,
      });

      if (cmakeResult.error) {
        console.error('CMake error details:', cmakeResult.error);
        throw new Error(`Failed to run cmake: ${cmakeResult.error.message}`);
      }
      
      if (cmakeResult.status !== 0) {
        throw new Error(`cmake process exited with code ${cmakeResult.status}`);
      }
    } catch (error) {
      console.error('CMake configuration failed. See error details above.');
      console.error('This might be due to architecture-specific flags incompatibility.');
      
      // Create a patch to fix CMakeLists.txt if we're on ARM and encounter issues
      if (isArmArchitecture) {
        console.error('\nTrying to check if we can fix the issue automatically...');
        
        try {
          // Look for common files that might need patching
          const commonCMakeListsPath = path.join(liboqsDir, 'src', 'common', 'CMakeLists.txt');
          
          if (fs.existsSync(commonCMakeListsPath)) {
            console.log('Found src/common/CMakeLists.txt file, checking for x86-specific flags...');
            // If needed, we could implement automatic patching of the file here
            console.log('Manual patching may be required. See error messages for instructions.');
          }
        } catch (checkError) {
          console.error('Failed to check for possible fixes:', checkError.message);
        }
      }
      
      throw error;
    }

    // Run ninja to build
    console.log('Running ninja to build liboqs...');
    try {
      const ninjaResult = spawnSync('ninja', [], {
        stdio: 'inherit',
        shell: false,
      });

      if (ninjaResult.error) {
        console.error('Ninja build error details:', ninjaResult.error);
        throw new Error(`Failed to run ninja: ${ninjaResult.error.message}`);
      }
      
      if (ninjaResult.status !== 0) {
        console.error('Ninja build failed. This might be due to compiler flag incompatibilities.');
        
        // If on ARM, provide a helpful message about the likely cause
        if (isArmArchitecture) {
          console.error('\nERROR: The build likely failed because of architecture-specific issues.');
          
          if (isTargetingAarch64) {
            console.error('\nFor ARM64/aarch64 compilation:');
            console.error('1. Ensure you are not using ARMv7-specific flags with aarch64 compiler');
            console.error('2. Do NOT use -mfpu=neon or -fno-integrated-as with aarch64-linux-gnu-gcc');
            console.error('3. Use only ARM64-compatible flags');
            console.error('4. Check if your compiler is properly installed and supports the target architecture');
            console.error('\nTo override compiler flags, you can try:');
            console.error('export CFLAGS="-fPIC -DOQS_NO_AES_NI=1 -DOQS_SKIP_X86_SPECIFIC=1"');
            console.error('export CXXFLAGS="-fPIC -DOQS_NO_AES_NI=1 -DOQS_SKIP_X86_SPECIFIC=1"');
            console.error('npm run liboqs:build');
          } else {
            console.error('\nFor ARMv7 compilation:');
            console.error('The compiler error usually involves flags like -maes or -mssse3 which are x86-specific.\n');
            console.error('Try one of these options:');
            console.error('\nOption 1: Modify the source code to skip x86-specific files:');
            console.error('1. Edit deps/liboqs/src/common/aes/aes128_ni.c');
            console.error('2. Add at the beginning of the file:');
            console.error('#if !defined(DISABLE_X86_INTRIN) && !defined(__ARM_ARCH)');
            console.error('3. Add at the end of the file: #endif');
            console.error('\nOption 2: Set environment variables to skip x86 code:');
            console.error('export CFLAGS="-DOQS_NO_AES_NI=1 -DOQS_SKIP_X86_SPECIFIC=1"');
            console.error('export CXXFLAGS="-DOQS_NO_AES_NI=1 -DOQS_SKIP_X86_SPECIFIC=1"');
          }
          
          console.error('\nAlternatively, you can try using a pre-built binary for your platform if available.\n');
        }
        
        throw new Error(`ninja process exited with code ${ninjaResult.status}`);
      }
    } catch (error) {
      console.error('Build failed. See error details above.');
      throw error;
    }
  }

  console.log('liboqs build completed successfully');
} catch (error) {
  console.error('Error building liboqs:', error.message);
  console.error('Please check build configuration and try again.');
  process.exit(1);
}
