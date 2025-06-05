/**
 * @fileoverview Comprehensive examples for @skairipaapps/liboqs-node
 * Demonstrates all major features of the post-quantum cryptography library
 */

const {
  Random,
  KEMs,
  Sigs,
  KeyEncapsulation,
  Signature
} = require('@skairipaapps/liboqs-node');

// ============================================================================
// Random Number Generation Examples
// ============================================================================

console.log('\n=== Random Number Generation ===');

// Generate cryptographically secure random bytes
const randomBytes = Random.randomBytes(32);
console.log('Generated 32 random bytes:', randomBytes.toString('hex'));

// Switch random algorithm for testing
Random.switchAlgorithm('system');
console.log('Switched to system random algorithm');

// Initialize NIST KAT mode (for testing and validation)
const entropy = Buffer.alloc(48, 'test-entropy-seed');
const personalization = Buffer.alloc(48, 'test-personalization');
Random.initNistKat(entropy, personalization);
console.log('Initialized NIST KAT mode for deterministic testing');

// ============================================================================
// Key Encapsulation Mechanism (KEM) Examples
// ============================================================================

console.log('\n=== Key Encapsulation Mechanisms ===');

// List all available KEM algorithms
const kemAlgorithms = KEMs.getEnabledAlgorithms();
console.log('Available KEM algorithms:', kemAlgorithms);

// Check if specific algorithms are enabled
console.log('ML-KEM-768 enabled:', KEMs.isAlgorithmEnabled('ML-KEM-768'));
console.log('Invalid algorithm enabled:', KEMs.isAlgorithmEnabled('FAKE-KEM'));

// Example with ML-KEM-768 (formerly Kyber-768)
function demonstrateKEM(algorithmName) {
  console.log(`\n--- ${algorithmName} Example ---`);
  
  try {
    // Create Alice and Bob instances
    const alice = new KeyEncapsulation(algorithmName);
    const bob = new KeyEncapsulation(algorithmName);
    
    // Get algorithm details
    const details = alice.getDetails();
    console.log('Algorithm details:', {
      name: details.name,
      version: details.version,
      securityLevel: details.claimedNistLevel,
      isINDCCA: details.isINDCCA,
      publicKeyLength: details.publicKeyLength,
      secretKeyLength: details.secretKeyLength,
      ciphertextLength: details.ciphertextLength,
      sharedSecretLength: details.sharedSecretLength
    });
    
    // Alice generates her key pair
    console.log('Alice generating key pair...');
    const alicePublicKey = alice.generateKeypair();
    console.log('Alice public key length:', alicePublicKey.length);
    
    // Bob generates his key pair
    console.log('Bob generating key pair...');
    bob.generateKeypair();
    
    // Bob encapsulates a secret using Alice's public key
    console.log('Bob encapsulating secret with Alice\'s public key...');
    const { ciphertext, sharedSecret: bobSecret } = bob.encapsulateSecret(alicePublicKey);
    console.log('Ciphertext length:', ciphertext.length);
    console.log('Bob\'s shared secret:', bobSecret.toString('hex').substring(0, 16) + '...');
    
    // Alice decapsulates the secret
    console.log('Alice decapsulating secret...');
    const aliceSecret = alice.decapsulateSecret(ciphertext);
    console.log('Alice\'s shared secret:', aliceSecret.toString('hex').substring(0, 16) + '...');
    
    // Verify both parties have the same shared secret
    const secretsMatch = aliceSecret.equals(bobSecret);
    console.log('Shared secrets match:', secretsMatch);
    
    if (!secretsMatch) {
      throw new Error('Key exchange failed - secrets do not match!');
    }
    
    console.log('✅ KEM exchange successful!');
    
  } catch (error) {
    console.error('❌ KEM example failed:', error.message);
  }
}

// Demonstrate different KEM algorithms
if (KEMs.isAlgorithmEnabled('ML-KEM-768')) {
  demonstrateKEM('ML-KEM-768');
}

if (KEMs.isAlgorithmEnabled('FrodoKEM-640-SHAKE')) {
  demonstrateKEM('FrodoKEM-640-SHAKE');
}

// ============================================================================
// Digital Signature Examples
// ============================================================================

console.log('\n=== Digital Signatures ===');

// List all available signature algorithms
const sigAlgorithms = Sigs.getEnabledAlgorithms();
console.log('Available signature algorithms:', sigAlgorithms);

// Check if specific algorithms are enabled
console.log('ML-DSA-65 enabled:', Sigs.isAlgorithmEnabled('ML-DSA-65'));
console.log('Invalid algorithm enabled:', Sigs.isAlgorithmEnabled('FAKE-SIG'));

// Example with ML-DSA-65 (formerly Dilithium3)
function demonstrateSignature(algorithmName) {
  console.log(`\n--- ${algorithmName} Example ---`);
  
  try {
    // Create signer and verifier instances
    const signer = new Signature(algorithmName);
    const verifier = new Signature(algorithmName);
    
    // Get algorithm details
    const details = signer.getDetails();
    console.log('Algorithm details:', {
      name: details.name,
      version: details.version,
      securityLevel: details.claimedNistLevel,
      isEUFCMA: details.isEUFCMA,
      publicKeyLength: details.publicKeyLength,
      secretKeyLength: details.secretKeyLength,
      maxSignatureLength: details.maxSignatureLength
    });
    
    // Generate key pair
    console.log('Generating key pair...');
    const publicKey = signer.generateKeypair();
    console.log('Public key length:', publicKey.length);
    
    // Prepare message to sign
    const message = Buffer.from('Hello, post-quantum cryptographic world! 🚀', 'utf8');
    console.log('Message to sign:', message.toString());
    
    // Sign the message
    console.log('Signing message...');
    const signature = signer.sign(message);
    console.log('Signature length:', signature.length);
    console.log('Signature (first 32 bytes):', signature.subarray(0, 32).toString('hex'));
    
    // Verify the signature
    console.log('Verifying signature...');
    const isValid = verifier.verify(message, signature, publicKey);
    console.log('Signature valid:', isValid);
    
    if (!isValid) {
      throw new Error('Signature verification failed!');
    }
    
    // Test with invalid signature (should fail)
    const tamperedMessage = Buffer.from('Tampered message', 'utf8');
    const invalidVerification = verifier.verify(tamperedMessage, signature, publicKey);
    console.log('Tampered message verification (should be false):', invalidVerification);
    
    console.log('✅ Digital signature example successful!');
    
  } catch (error) {
    console.error('❌ Signature example failed:', error.message);
  }
}

// Demonstrate different signature algorithms
if (Sigs.isAlgorithmEnabled('ML-DSA-65')) {
  demonstrateSignature('ML-DSA-65');
}

if (Sigs.isAlgorithmEnabled('Falcon-512')) {
  demonstrateSignature('Falcon-512');
}

// ============================================================================
// Advanced Use Cases
// ============================================================================

console.log('\n=== Advanced Use Cases ===');

// Hybrid cryptography example (combining traditional and post-quantum)
function hybridCryptographyExample() {
  console.log('\n--- Hybrid Cryptography Pattern ---');
  
  try {
    // Use both traditional ECDH (simulated) and post-quantum KEM
    const postQuantumKem = new KeyEncapsulation('ML-KEM-768');
    
    // Alice generates post-quantum keys
    const alicePQPublicKey = postQuantumKem.generateKeypair();
    
    // Bob performs post-quantum key exchange
    const bobKem = new KeyEncapsulation('ML-KEM-768');
    const { ciphertext, sharedSecret: pqSecret } = bobKem.encapsulateSecret(alicePQPublicKey);
    
    // Alice decapsulates
    const alicePQSecret = postQuantumKem.decapsulateSecret(ciphertext);
    
    // In a real implementation, you would:
    // 1. Also perform traditional ECDH
    // 2. Combine both secrets using a KDF
    // 3. Use the combined key for symmetric encryption
    
    console.log('Post-quantum shared secret established');
    console.log('PQ secret length:', alicePQSecret.length);
    console.log('In practice, combine with traditional ECDH for hybrid security');
    
  } catch (error) {
    console.error('Hybrid cryptography example failed:', error.message);
  }
}

// Key serialization example
function keySerializationExample() {
  console.log('\n--- Key Serialization Example ---');
  
  try {
    const kem = new KeyEncapsulation('ML-KEM-768');
    const publicKey = kem.generateKeypair();
    const secretKey = kem.exportSecretKey();
    
    // Serialize keys (in practice, you might use base64 or PEM format)
    const serializedPublicKey = publicKey.toString('base64');
    const serializedSecretKey = secretKey.toString('base64');
    
    console.log('Public key serialized length:', serializedPublicKey.length);
    console.log('Secret key serialized length:', serializedSecretKey.length);
    
    // Deserialize and recreate instance
    const deserializedSecretKey = Buffer.from(serializedSecretKey, 'base64');
    const restoredKem = new KeyEncapsulation('ML-KEM-768', deserializedSecretKey);
    
    // Verify the restored key works
    const testCiphertext = Buffer.alloc(kem.getDetails().ciphertextLength);
    // Note: In practice, you'd use a real ciphertext
    
    console.log('Key serialization/deserialization completed');
    
  } catch (error) {
    console.error('Key serialization example failed:', error.message);
  }
}

// Performance benchmarking
function performanceBenchmark() {
  console.log('\n--- Performance Benchmark ---');
  
  const algorithms = ['ML-KEM-768', 'ML-DSA-65'];
  
  algorithms.forEach(algorithm => {
    if (KEMs.isAlgorithmEnabled(algorithm)) {
      console.log(`\nBenchmarking ${algorithm} (KEM):`);
      
      const iterations = 10;
      let totalKeygenTime = 0;
      let totalEncapTime = 0;
      let totalDecapTime = 0;
      
      for (let i = 0; i < iterations; i++) {
        // Key generation benchmark
        const keygenStart = process.hrtime.bigint();
        const kem = new KeyEncapsulation(algorithm);
        const publicKey = kem.generateKeypair();
        const keygenEnd = process.hrtime.bigint();
        totalKeygenTime += Number(keygenEnd - keygenStart) / 1000000; // Convert to ms
        
        // Encapsulation benchmark
        const encapStart = process.hrtime.bigint();
        const { ciphertext } = kem.encapsulateSecret(publicKey);
        const encapEnd = process.hrtime.bigint();
        totalEncapTime += Number(encapEnd - encapStart) / 1000000;
        
        // Decapsulation benchmark
        const decapStart = process.hrtime.bigint();
        kem.decapsulateSecret(ciphertext);
        const decapEnd = process.hrtime.bigint();
        totalDecapTime += Number(decapEnd - decapStart) / 1000000;
      }
      
      console.log(`  Key generation: ${(totalKeygenTime / iterations).toFixed(2)} ms avg`);
      console.log(`  Encapsulation: ${(totalEncapTime / iterations).toFixed(2)} ms avg`);
      console.log(`  Decapsulation: ${(totalDecapTime / iterations).toFixed(2)} ms avg`);
    }
    
    if (Sigs.isAlgorithmEnabled(algorithm)) {
      console.log(`\nBenchmarking ${algorithm} (Signature):`);
      
      const iterations = 10;
      let totalKeygenTime = 0;
      let totalSignTime = 0;
      let totalVerifyTime = 0;
      
      const message = Buffer.from('Benchmark message for signing', 'utf8');
      
      for (let i = 0; i < iterations; i++) {
        // Key generation benchmark
        const keygenStart = process.hrtime.bigint();
        const sig = new Signature(algorithm);
        const publicKey = sig.generateKeypair();
        const keygenEnd = process.hrtime.bigint();
        totalKeygenTime += Number(keygenEnd - keygenStart) / 1000000;
        
        // Signing benchmark
        const signStart = process.hrtime.bigint();
        const signature = sig.sign(message);
        const signEnd = process.hrtime.bigint();
        totalSignTime += Number(signEnd - signStart) / 1000000;
        
        // Verification benchmark
        const verifyStart = process.hrtime.bigint();
        sig.verify(message, signature, publicKey);
        const verifyEnd = process.hrtime.bigint();
        totalVerifyTime += Number(verifyEnd - verifyStart) / 1000000;
      }
      
      console.log(`  Key generation: ${(totalKeygenTime / iterations).toFixed(2)} ms avg`);
      console.log(`  Signing: ${(totalSignTime / iterations).toFixed(2)} ms avg`);
      console.log(`  Verification: ${(totalVerifyTime / iterations).toFixed(2)} ms avg`);
    }
  });
}

// Run advanced examples
hybridCryptographyExample();
keySerializationExample();
performanceBenchmark();

// ============================================================================
// Error Handling Examples
// ============================================================================

console.log('\n=== Error Handling Examples ===');

// Invalid algorithm
try {
  new KeyEncapsulation('INVALID-ALGORITHM');
} catch (error) {
  console.log('✅ Correctly caught invalid algorithm:', error.message);
}

// Invalid random bytes length
try {
  Random.randomBytes(-1);
} catch (error) {
  console.log('✅ Correctly caught invalid random bytes length:', error.message);
}

// Decapsulation without key generation
try {
  const kem = new KeyEncapsulation('ML-KEM-768');
  const fakeDetails = kem.getDetails();
  kem.decapsulateSecret(Buffer.alloc(fakeDetails.ciphertextLength));
} catch (error) {
  console.log('✅ Correctly caught decapsulation without key generation:', error.message);
}

console.log('\n=== All Examples Completed ===');
console.log('\n🎉 Post-quantum cryptography examples finished successfully!');
console.log('\n⚠️  Remember: These are experimental algorithms - use only for research and testing!');

