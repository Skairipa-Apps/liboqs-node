# Contributing to @skairipaapps/liboqs-node

Thank you for your interest in contributing to this post-quantum cryptography library! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Build Process](#build-process)
- [Testing](#testing)
- [Documentation](#documentation)
- [Pull Request Process](#pull-request-process)
- [Code Style](#code-style)
- [Architecture Overview](#architecture-overview)
- [Release Process](#release-process)

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). By participating, you agree to uphold this code.

## Getting Started

### Prerequisites

- **Node.js**: >=12.11.0
- **npm**: >=6.0.0
- **CMake**: >=3.5
- **C++ Compiler**: GCC >=7.0, Clang >=6.0, or MSVC >=19.14
- **Git**: For version control and submodules
- **Python**: >=3.6 (for build scripts)

### Platform-Specific Requirements

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install build-essential cmake git python3 libssl-dev
```

#### macOS
```bash
# Install Xcode Command Line Tools
xcode-select --install

# Install Homebrew (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install dependencies
brew install cmake git python3 openssl
```

#### Windows
- Visual Studio 2019 or later with C++ build tools
- CMake (can be installed via Visual Studio Installer)
- Git for Windows
- Python 3.x

## Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/liboqs-node.git
   cd liboqs-node
   ```

2. **Initialize Submodules**
   ```bash
   git submodule update --init --recursive
   ```

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Build liboqs**
   ```bash
   npm run liboqs:build
   ```

5. **Build Native Module**
   ```bash
   npm run build
   ```

6. **Run Tests**
   ```bash
   npm test
   ```

7. **Run Examples**
   ```bash
   node examples.js
   ```

## Build Process

### Build Scripts

- `npm run build`: Build only the Node.js native module
- `npm run build:all`: Build liboqs and the native module
- `npm run liboqs:build`: Build only the liboqs library
- `npm run clean`: Clean build artifacts

### Cross-Compilation

For ARM architectures:

```bash
export OQS_PERMIT_UNSUPPORTED_ARCHITECTURE=ON
export CC=arm-linux-gnueabihf-gcc
export CXX=arm-linux-gnueabihf-g++
npm run build:all
```

### Build Configuration

The build process uses:
- **binding.gyp**: Node.js native module configuration
- **CMake**: For building liboqs
- **node-pre-gyp**: For binary distribution

## Testing

### Test Structure

```
test/
├── KEMs.test.js           # KEM algorithm tests
├── KeyEncapsulation.test.js # KEM functionality tests
├── Random.test.js         # Random number generation tests
├── Signature.test.js      # Signature functionality tests
└── Sigs.test.js          # Signature algorithm tests
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test test/KeyEncapsulation.test.js

# Run tests with coverage
npm run test:coverage

# Run performance benchmarks
node examples.js
```

### Writing Tests

Use Mocha and Chai for testing:

```javascript
const { expect } = require('chai').use(require('chai-bytes'));
const { KeyEncapsulation, KEMs } = require('../lib/index.js');

describe('New Feature', () => {
  it('should work correctly', () => {
    const kem = new KeyEncapsulation('ML-KEM-768');
    const publicKey = kem.generateKeypair();
    expect(publicKey).to.be.an.instanceof(Buffer);
  });
});
```

## Documentation

### API Documentation

Generate API documentation:

```bash
npm run docs:build
```

Documentation is generated using JSDoc and the docdash template.

### Type Definitions

Update TypeScript definitions in `index.d.ts` when adding new APIs:

```typescript
/**
 * New method description.
 * @param param - Parameter description
 * @returns Return value description
 * @example
 * ```typescript
 * const result = newMethod(param);
 * ```
 */
function newMethod(param: string): Buffer;
```

### Code Comments

Use JSDoc comments for all public APIs:

```javascript
/**
 * Brief description of the function.
 * @param {string} algorithm - The algorithm name
 * @param {Buffer} [secretKey] - Optional secret key
 * @throws {Error} When algorithm is not supported
 * @example
 * const instance = new Constructor('ML-KEM-768');
 */
function Constructor(algorithm, secretKey) {
  // Implementation
}
```

## Pull Request Process

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**
   - Follow code style guidelines
   - Add tests for new functionality
   - Update documentation
   - Update TypeScript definitions

3. **Test Changes**
   ```bash
   npm test
   npm run build
   node examples.js
   ```

4. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

   Use conventional commit format:
   - `feat:` for new features
   - `fix:` for bug fixes
   - `docs:` for documentation changes
   - `test:` for test changes
   - `refactor:` for code refactoring
   - `chore:` for build/tooling changes

5. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **PR Requirements**
   - Clear description of changes
   - Tests pass
   - Documentation updated
   - No breaking changes (unless major version)

## Code Style

### JavaScript/Node.js

- Use 2 spaces for indentation
- Use semicolons
- Use single quotes for strings
- Use camelCase for variables and functions
- Use PascalCase for classes
- Maximum line length: 100 characters

### C++

- Use 2 spaces for indentation
- Use snake_case for variables and functions
- Use PascalCase for classes
- Follow Google C++ Style Guide

### Example JavaScript Style

```javascript
const { KeyEncapsulation } = require('@skairipaapps/liboqs-node');

class MyClass {
  constructor(algorithmName) {
    this.algorithm = algorithmName;
    this.kem = new KeyEncapsulation(algorithmName);
  }

  generateKeys() {
    return this.kem.generateKeypair();
  }
}

module.exports = MyClass;
```

## Architecture Overview

### Project Structure

```
liboqs-node/
├── lib/                   # JavaScript entry point
├── src/                   # C++ source code
├── deps/                  # Git submodules (liboqs, liboqs-cpp)
├── test/                  # Test files
├── docs/                  # Documentation configuration
├── scripts/               # Build and utility scripts
├── binding.gyp           # Node.js native module config
├── package.json          # NPM package configuration
├── index.d.ts            # TypeScript definitions
└── examples.js           # Usage examples
```

### Key Components

1. **Native Module** (`src/`)
   - C++ bindings using N-API
   - Interfaces with liboqs-cpp
   - Memory management and error handling

2. **JavaScript Layer** (`lib/`)
   - Simple passthrough to native module
   - Could add validation/utilities in future

3. **Build System**
   - CMake for liboqs
   - node-gyp for native module
   - Custom scripts for cross-compilation

### Adding New Algorithms

1. **Update liboqs submodule** (if needed)
2. **Update algorithm lists** in C++ code
3. **Add tests** for new algorithms
4. **Update documentation** and examples
5. **Update TypeScript definitions**

### Memory Management

- Use RAII principles in C++
- Properly handle Buffer objects from Node.js
- Clean up liboqs objects in destructors
- Validate input parameters early

## Release Process

### Version Numbering

We follow [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking API changes
- **MINOR**: New features, backward compatible
- **PATCH**: Bug fixes, backward compatible

### Release Steps

1. **Update Version**
   ```bash
   npm version patch|minor|major
   ```

2. **Build Binaries**
   ```bash
   npm run build:package
   npm run tag_upload_binary_release
   ```

3. **Publish to NPM**
   ```bash
   npm publish
   ```

4. **Create GitHub Release**
   - Tag the release
   - Upload binary artifacts
   - Write release notes

### Binary Distribution

Pre-built binaries are distributed via GitHub Releases:
- Linux x86_64
- Linux ARM/ARM64
- macOS x86_64/ARM64
- Windows x86_64

## Security Considerations

### Cryptographic Safety

- **Never** commit private keys or sensitive data
- Use secure random number generation
- Validate all input parameters
- Handle memory securely (clear sensitive data)
- Follow constant-time programming practices

### Code Review

- All cryptographic code requires thorough review
- Test against known answer tests (KATs)
- Verify algorithm implementations
- Check for side-channel vulnerabilities

## Getting Help

- **Issues**: [GitHub Issues](https://github.com/skairipa-apps/liboqs-node/issues)
- **Discussions**: [GitHub Discussions](https://github.com/skairipa-apps/liboqs-node/discussions)
- **Email**: For security issues, email security@skairipaapps.com

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to post-quantum cryptography! 🔐

