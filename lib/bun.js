// Bun-compatible version using FFI to call liboqs directly
import { dlopen, FFIType, ptr } from "bun:ffi";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// Get the directory of this module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Try to find the compiled liboqs library
function getLibraryPath() {
  const platform = process.platform;
  let filename;
  
  switch (platform) {
    case 'darwin': // macOS
      filename = 'liboqs.dylib';
      break;
    case 'linux':
      filename = 'liboqs.so';
      break;
    case 'win32': // Windows
      filename = 'liboqs.dll';
      break;
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
  
  return resolve(__dirname, '..', 'deps', 'liboqs', 'build', 'lib', filename);
}

const libPath = getLibraryPath();
console.log(`[Bun FFI] Attempting to load liboqs from: ${libPath}`);

let lib;
try {
  lib = dlopen(libPath, {
    // Core OQS functions
    OQS_init: {
      returns: FFIType.void,
    },
    
    // KEM functions
    OQS_KEM_new: {
      args: [FFIType.cstring],
      returns: FFIType.ptr,
    },
    OQS_KEM_free: {
      args: [FFIType.ptr],
      returns: FFIType.void,
    },
    OQS_KEM_keypair: {
      args: [FFIType.ptr, FFIType.ptr, FFIType.ptr],
      returns: FFIType.i32,
    },
    OQS_KEM_encaps: {
      args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr],
      returns: FFIType.i32,
    },
    OQS_KEM_decaps: {
      args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr],
      returns: FFIType.i32,
    },
    
    // Signature functions
    OQS_SIG_new: {
      args: [FFIType.cstring],
      returns: FFIType.ptr,
    },
    OQS_SIG_free: {
      args: [FFIType.ptr],
      returns: FFIType.void,
    },
    OQS_SIG_keypair: {
      args: [FFIType.ptr, FFIType.ptr, FFIType.ptr],
      returns: FFIType.i32,
    },
    OQS_SIG_sign: {
      args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u64, FFIType.ptr],
      returns: FFIType.i32,
    },
    OQS_SIG_verify: {
      args: [FFIType.ptr, FFIType.ptr, FFIType.u64, FFIType.ptr, FFIType.u64, FFIType.ptr],
      returns: FFIType.i32,
    },
  });
} catch (error) {
  throw new Error(`Failed to load liboqs library: ${error.message}\nMake sure to build liboqs first with: bun run build:liboqs`);
}

console.log('[Bun FFI] Successfully loaded liboqs library');

// Initialize liboqs
lib.symbols.OQS_init();
console.log('[Bun FFI] Initialized liboqs');

// Export the same API as the Node.js version
export class KeyEncapsulation {
  constructor(algorithm) {
    this.algorithm = algorithm;
    this.kem = lib.symbols.OQS_KEM_new(algorithm);
    if (!this.kem) {
      throw new Error(`Unsupported KEM algorithm: ${algorithm}`);
    }
  }
  
  generateKeyPair() {
    // Implementation would require proper memory management
    // This is a simplified example
    throw new Error("Not yet implemented - requires proper FFI memory management");
  }
  
  encapsulateSecret(publicKey) {
    throw new Error("Not yet implemented - requires proper FFI memory management");
  }
  
  decapsulateSecret(ciphertext, privateKey) {
    throw new Error("Not yet implemented - requires proper FFI memory management");
  }
  
  free() {
    if (this.kem) {
      lib.symbols.OQS_KEM_free(this.kem);
      this.kem = null;
    }
  }
}

export class Signature {
  constructor(algorithm) {
    this.algorithm = algorithm;
    this.sig = lib.symbols.OQS_SIG_new(algorithm);
    if (!this.sig) {
      throw new Error(`Unsupported signature algorithm: ${algorithm}`);
    }
  }
  
  generateKeyPair() {
    throw new Error("Not yet implemented - requires proper FFI memory management");
  }
  
  sign(message, privateKey) {
    throw new Error("Not yet implemented - requires proper FFI memory management");
  }
  
  verify(message, signature, publicKey) {
    throw new Error("Not yet implemented - requires proper FFI memory management");
  }
  
  free() {
    if (this.sig) {
      lib.symbols.OQS_SIG_free(this.sig);
      this.sig = null;
    }
  }
}

// Export algorithm lists (would need to be populated from liboqs)
export const KEMs = {
  supportedAlgorithms: [
    "Kyber512",
    "Kyber768", 
    "Kyber1024",
    // Add more as needed
  ]
};

export const Sigs = {
  supportedAlgorithms: [
    "Dilithium2",
    "Dilithium3",
    "Dilithium5",
    // Add more as needed
  ]
};

// Note: This is a basic template. A complete implementation would require:
// 1. Proper memory management for buffers
// 2. Error handling
// 3. Complete algorithm lists
// 4. Proper cleanup
// 5. Platform-specific library loading

