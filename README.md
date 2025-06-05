# @skairipaapps/liboqs-node

[![npm version](https://badge.fury.io/js/%40skairipaapps%2Fliboqs-node.svg)](https://badge.fury.io/js/%40skairipaapps%2Fliboqs-node)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Node.js bindings for [liboqs](https://github.com/open-quantum-safe/liboqs) (Open Quantum Safe), providing post-quantum cryptographic algorithms through [liboqs-cpp](https://github.com/open-quantum-safe/liboqs-cpp).

## ⚠️ Security Warning

**IMPORTANT: The cryptographic algorithms provided by this library are experimental and should not be used in production environments.** These post-quantum algorithms are still under development and standardization. Use only for research, testing, and development purposes.

If you must use this in a production-like environment, ensure that sensitive data is protected by additional layers of established cryptographic algorithms.

## Features

- 🔐 **Key Encapsulation Mechanisms (KEMs)**: ML-KEM (Kyber), FrodoKEM, Classic McEliece, BIKE, HQC, and more
- ✍️ **Digital Signatures**: ML-DSA (Dilithium), Falcon, SPHINCS+, MAYO, CROSS, and more
- 🎲 **Secure Random Number Generation**: Cryptographically secure random bytes with multiple algorithms
- 🔧 **Cross-platform**: Support for Linux (x86_64, ARM, ARM64), macOS, and Windows
- 📘 **TypeScript Support**: Comprehensive type definitions with detailed documentation
- 🚀 **High Performance**: Native C++ implementation with Node.js bindings

## Installation

```bash
npm install @skairipaapps/liboqs-node
```

### System Requirements

- **Node.js**: >=12.11.0
- **Operating Systems**: Linux (x86_64, ARM, ARM64), macOS, Windows
- **Dependencies**: 
  - CMake >=3.5
  - C++ compiler with C++11 support
  - OpenSSL >=1.1.1 (optional, for enhanced performance)

### Pre-built Binaries

Pre-built binaries are available for:
- Linux x86_64
- Linux ARM/ARM64 (with cross-compilation support)
- macOS x86_64/ARM64
- Windows x86_64

If no pre-built binary is available for your platform, the package will automatically compile from source.

### ARM/Cross-compilation Support

For ARM architectures, the package automatically detects cross-compilation and sets appropriate flags:

```bash
# For ARM builds, set the architecture flag
export OQS_PERMIT_UNSUPPORTED_ARCHITECTURE=ON
npm install @skairipaapps/liboqs-node
```

## Quick Start

### Key Encapsulation (Post-Quantum Key Exchange)

```javascript
const { KeyEncapsulation, KEMs } = require('@skairipaapps/liboqs-node');

// List available algorithms
console.log('Available KEMs:', KEMs.getEnabledAlgorithms());

// Create Alice and Bob
const alice = new KeyEncapsulation('ML-KEM-768');
const bob = new KeyEncapsulation('ML-KEM-768');

// Alice generates her key pair
const alicePublicKey = alice.generateKeypair();

// Bob generates his key pair
bob.generateKeypair();

// Bob encapsulates a secret using Alice's public key
const { ciphertext, sharedSecret: bobSecret } = bob.encapsulateSecret(alicePublicKey);

// Alice decapsulates the secret
const aliceSecret = alice.decapsulateSecret(ciphertext);

// Both parties now have the same shared secret
console.log('Shared secrets match:', aliceSecret.equals(bobSecret));
```

### Digital Signatures

```javascript
const { Signature, Sigs } = require('@skairipaapps/liboqs-node');

// List available algorithms
console.log('Available Signatures:', Sigs.getEnabledAlgorithms());

// Create signer
const signer = new Signature('ML-DSA-65');
const publicKey = signer.generateKeypair();

// Sign a message
const message = Buffer.from('Hello, post-quantum world!', 'utf8');
const signature = signer.sign(message);

// Verify signature
const verifier = new Signature('ML-DSA-65');
const isValid = verifier.verify(message, signature, publicKey);
console.log('Signature valid:', isValid);
```

### Secure Random Number Generation

```javascript
const { Random } = require('@skairipaapps/liboqs-node');

// Generate random bytes
const randomBytes = Random.randomBytes(32);
console.log('Random bytes:', randomBytes.toString('hex'));

// Switch random algorithm (for testing)
Random.switchAlgorithm('system');

// Initialize NIST KAT mode (for testing)
const entropy = Buffer.alloc(48, 'test-entropy');
Random.initNistKat(entropy);
```

## API Reference

### Key Encapsulation Mechanisms (KEMs)

#### Supported Algorithms

| Algorithm | Security Level | Public Key | Secret Key | Ciphertext | Shared Secret |
|-----------|----------------|------------|------------|------------|---------------|
| ML-KEM-512 | 1 | 800 bytes | 1632 bytes | 768 bytes | 32 bytes |
| ML-KEM-768 | 3 | 1184 bytes | 2400 bytes | 1088 bytes | 32 bytes |
| ML-KEM-1024 | 5 | 1568 bytes | 3168 bytes | 1568 bytes | 32 bytes |
| FrodoKEM-640-SHAKE | 1 | 9616 bytes | 19888 bytes | 9720 bytes | 16 bytes |
| FrodoKEM-976-SHAKE | 3 | 15632 bytes | 31296 bytes | 15744 bytes | 24 bytes |
| FrodoKEM-1344-SHAKE | 5 | 21520 bytes | 43088 bytes | 21632 bytes | 32 bytes |

#### KEMs Namespace

```javascript
const { KEMs } = require('@skairipaapps/liboqs-node');

// Get all enabled algorithms
const algorithms = KEMs.getEnabledAlgorithms();

// Check if specific algorithm is enabled
const isEnabled = KEMs.isAlgorithmEnabled('ML-KEM-768');
```

#### KeyEncapsulation Class

```javascript
const kem = new KeyEncapsulation(algorithmName, optionalSecretKey);

// Generate key pair
const publicKey = kem.generateKeypair();

// Get algorithm details
const details = kem.getDetails();
console.log(details);
// {
//   name: 'ML-KEM-768',
//   version: '1.0',
//   claimedNistLevel: 3,
//   isINDCCA: true,
//   publicKeyLength: 1184,
//   secretKeyLength: 2400,
//   ciphertextLength: 1088,
//   sharedSecretLength: 32
// }

// Export secret key
const secretKey = kem.exportSecretKey();

// Encapsulate secret
const { ciphertext, sharedSecret } = kem.encapsulateSecret(publicKey);

// Decapsulate secret
const recoveredSecret = kem.decapsulateSecret(ciphertext);
```

### Digital Signatures

#### Supported Algorithms

| Algorithm | Security Level | Public Key | Secret Key | Max Signature |
|-----------|----------------|------------|------------|---------------|
| ML-DSA-44 | 2 | 1312 bytes | 2560 bytes | 2420 bytes |
| ML-DSA-65 | 3 | 1952 bytes | 4032 bytes | 3309 bytes |
| ML-DSA-87 | 5 | 2592 bytes | 4896 bytes | 4627 bytes |
| Falcon-512 | 1 | 897 bytes | 1281 bytes | 690 bytes |
| Falcon-1024 | 5 | 1793 bytes | 2305 bytes | 1330 bytes |
| SPHINCS+-SHAKE-128s | 1 | 32 bytes | 64 bytes | 7856 bytes |

#### Sigs Namespace

```javascript
const { Sigs } = require('@skairipaapps/liboqs-node');

// Get all enabled algorithms
const algorithms = Sigs.getEnabledAlgorithms();

// Check if specific algorithm is enabled
const isEnabled = Sigs.isAlgorithmEnabled('ML-DSA-65');
```

#### Signature Class

```javascript
const sig = new Signature(algorithmName, optionalSecretKey);

// Generate key pair
const publicKey = sig.generateKeypair();

// Get algorithm details
const details = sig.getDetails();
console.log(details);
// {
//   name: 'ML-DSA-65',
//   version: '1.0',
//   claimedNistLevel: 3,
//   isEUFCMA: true,
//   publicKeyLength: 1952,
//   secretKeyLength: 4032,
//   maxSignatureLength: 3309
// }

// Export secret key
const secretKey = sig.exportSecretKey();

// Sign message
const message = Buffer.from('Important message');
const signature = sig.sign(message);

// Verify signature
const isValid = sig.verify(message, signature, publicKey);
```

### Random Number Generation

```javascript
const { Random } = require('@skairipaapps/liboqs-node');

// Generate secure random bytes
const randomData = Random.randomBytes(32);

// Switch random algorithm
Random.switchAlgorithm('system'); // or 'OpenSSL'

// Initialize NIST KAT mode (for testing)
const entropy = Buffer.alloc(48, 'test-entropy');
const personalization = Buffer.alloc(48, 'test-personalization');
Random.initNistKat(entropy, personalization);
```

## TypeScript Support

This package includes comprehensive TypeScript definitions:

```typescript
import {
  KeyEncapsulation,
  Signature,
  KEMs,
  Sigs,
  Random,
  KEMDetails,
  SignatureDetails,
  EncapsulationResult
} from '@skairipaapps/liboqs-node';

// TypeScript will provide full intellisense and type checking
const kem: KeyEncapsulation = new KeyEncapsulation('ML-KEM-768');
const details: KEMDetails = kem.getDetails();
const result: EncapsulationResult = kem.encapsulateSecret(publicKey);
```

## Error Handling

All methods throw descriptive errors for invalid inputs:

```javascript
try {
  const kem = new KeyEncapsulation('INVALID-ALGORITHM');
} catch (error) {
  console.error('Algorithm not supported:', error.message);
}

try {
  const randomBytes = Random.randomBytes(-1);
} catch (error) {
  console.error('Invalid length:', error.message);
}

try {
  const kem = new KeyEncapsulation('ML-KEM-768');
  // This will throw because no keypair was generated
  const secret = kem.decapsulateSecret(Buffer.alloc(1088));
} catch (error) {
  console.error('No secret key available:', error.message);
}
```

## Performance Considerations

- **Key Generation**: Most expensive operation, especially for algorithms like Classic McEliece
- **Encapsulation/Decapsulation**: Generally fast, varies by algorithm
- **Signing/Verification**: SPHINCS+ signatures are large but fast to verify; Falcon is compact but slower
- **Memory Usage**: Some algorithms (like FrodoKEM) have large key sizes

### Benchmarking

```javascript
const { KeyEncapsulation } = require('@skairipaapps/liboqs-node');

function benchmark(algorithm) {
  console.time(`${algorithm} keygen`);
  const kem = new KeyEncapsulation(algorithm);
  const publicKey = kem.generateKeypair();
  console.timeEnd(`${algorithm} keygen`);
  
  console.time(`${algorithm} encapsulation`);
  const { ciphertext, sharedSecret } = kem.encapsulateSecret(publicKey);
  console.timeEnd(`${algorithm} encapsulation`);
  
  console.time(`${algorithm} decapsulation`);
  const recovered = kem.decapsulateSecret(ciphertext);
  console.timeEnd(`${algorithm} decapsulation`);
}

benchmark('ML-KEM-768');
benchmark('FrodoKEM-976-SHAKE');
```

## Testing

```bash
# Run all tests
npm test

# Run specific test suite
npm test test/KeyEncapsulation.test.js

# Build documentation
npm run docs:build
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/skairipa-apps/liboqs-node.git
   cd liboqs-node
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the native module:
   ```bash
   npm run build
   ```

4. Run tests:
   ```bash
   npm test
   ```

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- **Issues**: [GitHub Issues](https://github.com/skairipa-apps/liboqs-node/issues)
- **Discussions**: [GitHub Discussions](https://github.com/skairipa-apps/liboqs-node/discussions)
- **Documentation**: [API Documentation](https://skairipa-apps.github.io/liboqs-node/)

## Acknowledgments

- [Open Quantum Safe](https://openquantumsafe.org/) project for the liboqs library
- [liboqs-cpp](https://github.com/open-quantum-safe/liboqs-cpp) for C++ bindings
- Original [liboqs-node](https://github.com/TapuCosmo/liboqs-node) by TapuCosmo

## Security

For security issues, please email security@skairipaapps.com instead of using the public issue tracker.

---

**Remember**: This library implements experimental post-quantum cryptographic algorithms. Use responsibly and only for research, development, and testing purposes.
