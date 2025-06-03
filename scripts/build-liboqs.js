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

    const cmakeArgs = [
      '-DBUILD_SHARED_LIBS=OFF',
      '-DCMAKE_BUILD_TYPE=Release',
      '-DOQS_BUILD_ONLY_LIB=ON',
      '-DOQS_USE_OPENSSL=ON',
      '-DOQS_DIST_BUILD=ON',
      '-GNinja'
    ];

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
      
      // Explicitly disable any compiler flags that might cause issues on ARM
      cmakeArgs.push('-DCMAKE_C_FLAGS_INIT=-DDISABLE_X86_INTRIN');
      cmakeArgs.push('-DCMAKE_CXX_FLAGS_INIT=-DDISABLE_X86_INTRIN');
      
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
      cmakeArgs.push('-DOQS_USE_AES_INSTRUCTIONS=ON');
      cmakeArgs.push('-DCMAKE_SYSTEM_PROCESSOR=x86_64');
      console.log('==================================================================');
    }

    cmakeArgs.push('..');

    // Print the complete CMake command for debugging
    console.log('Running CMake with args:', cmakeArgs.join(' '));

    try {
      // Add special handling for ARM64/aarch64 builds
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
            console.error('export CFLAGS="-march=armv8-a+crypto -fPIC"');
            console.error('export CXXFLAGS="-march=armv8-a+crypto -fPIC"');
            console.error('npm run liboqs:build');
          } else {
            console.error('\nFor ARMv7 compilation:');
            console.error('The compiler error usually involves flags like -maes or -mssse3 which are x86-specific.\n');
            console.error('Try manually applying a patch to liboqs source files to remove x86-specific flags:');
            console.error('1. Edit deps/liboqs/src/common/CMakeLists.txt');
            console.error('2. Find the lines with set_source_files_properties(...) that use -maes or -mssse3');
            console.error('3. Modify those lines to be conditional on architecture (e.g., if NOT CMAKE_SYSTEM_PROCESSOR MATCHES "arm|aarch64")');
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
  process.exit(1);
}

