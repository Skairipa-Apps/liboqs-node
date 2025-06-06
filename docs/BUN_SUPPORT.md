# Bun Support for liboqs-node

This document explains how to use liboqs-node with the Bun JavaScript runtime.

## Overview

liboqs-node provides two different implementations:

1. **Node.js**: Uses native C++ addons compiled with node-gyp
2. **Bun**: Uses Foreign Function Interface (FFI) to call liboqs directly

## Building for Bun

To build liboqs for use with Bun, you need to create shared libraries instead of static libraries:

```bash
# Build shared libraries for Bun FFI
bun run build:bun

# Or manually with environment variable
BUILD_SHARED=true bun run liboqs:build
```

This will create shared library files:
- macOS: `deps/liboqs/build/lib/liboqs.dylib`
- Linux: `deps/liboqs/build/lib/liboqs.so`
- Windows: `deps/liboqs/build/lib/liboqs.dll`

## Usage with Bun

The package automatically detects the runtime and loads the appropriate implementation:

```javascript
// This works in both Node.js and Bun
import { KeyEncapsulation, Signature, KEMs, Sigs } from '@skairipaapps/liboqs-node';

// Create a KEM instance
const kem = new KeyEncapsulation('Kyber512');

// Generate key pair
const keyPair = kem.generateKeyPair();
console.log('Public key:', keyPair.publicKey);
console.log('Private key:', keyPair.privateKey);
```

## Runtime Detection

The package uses the following logic to detect the runtime:

```javascript
const runtime = (() => {
  if (typeof Bun !== 'undefined') {
    return 'bun';
  }
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    return 'node';
  }
  return 'unknown';
})();
```

## Current Limitations

⚠️ **Note**: The Bun FFI implementation is currently a work in progress. The following features are not yet fully implemented:

- Complete memory management for FFI buffers
- Full algorithm support matching the Node.js version
- Error handling and cleanup
- Performance optimization

## Building Blocks

The Bun implementation uses:

1. **FFI (Foreign Function Interface)**: Direct calls to liboqs C functions
2. **Shared Libraries**: Dynamic linking to liboqs
3. **Runtime Detection**: Automatic selection of the correct implementation

## Development Status

- ✅ Runtime detection
- ✅ Basic FFI setup
- ✅ Shared library building
- ⚠️ Memory management (in progress)
- ⚠️ Complete API implementation (in progress)
- ⚠️ Test coverage (in progress)

## Contributing

To help complete the Bun implementation:

1. Check the `lib/bun.js` file for TODOs
2. Implement proper memory management for FFI buffers
3. Add comprehensive error handling
4. Write tests for the Bun-specific code path
5. Optimize performance

## Platform Support

Bun FFI support is available on:
- ✅ macOS (Intel and Apple Silicon)
- ✅ Linux (x64 and ARM64)
- ✅ Windows (x64)

Make sure to build the appropriate shared library for your target platform.

