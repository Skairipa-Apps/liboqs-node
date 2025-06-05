/// <reference types="node" />

declare module "@skairipaapps/liboqs-node" {
  /**
   * Random number generation utilities and algorithms for post-quantum cryptography.
   * Provides secure random byte generation and NIST KAT initialization.
   */
  export namespace Random {
    /**
     * Generates cryptographically secure random bytes.
     * @param length - The number of random bytes to generate (must be positive)
     * @returns A Buffer containing the requested number of random bytes
     * @throws {Error} When length is negative or not a number
     * @example
     * ```typescript
     * const randomData = Random.randomBytes(32);
     * console.log(randomData.length); // 32
     * ```
     */
    function randomBytes(length: number): Buffer;

    /**
     * Initializes the random number generator for NIST Known Answer Tests (KAT).
     * This is primarily used for testing and validation purposes.
     * @param entropy - Exactly 48 bytes of entropy for initialization
     * @param personalizationString - Optional personalization string (minimum 48 bytes if provided)
     * @throws {Error} When entropy is not exactly 48 bytes or personalizationString is less than 48 bytes
     * @example
     * ```typescript
     * const entropy = Buffer.alloc(48, 'test-entropy');
     * Random.initNistKat(entropy);
     * ```
     */
    function initNistKat(entropy: Buffer, personalizationString?: Buffer): void;

    /**
     * Switches the random number generation algorithm.
     * @param algorithm - The algorithm name (e.g., "system")
     * @throws {Error} When algorithm is invalid or not supported
     * @example
     * ```typescript
     * Random.switchAlgorithm("system");
     * ```
     */
    function switchAlgorithm(algorithm: string): void;
  }

  /**
   * Key Encapsulation Mechanism (KEM) algorithm management.
   * Provides utilities to query and manage available post-quantum KEM algorithms.
   */
  export namespace KEMs {
    /**
     * Gets a list of all enabled KEM algorithms.
     * @returns Array of algorithm names that are currently enabled
     * @example
     * ```typescript
     * const algorithms = KEMs.getEnabledAlgorithms();
     * console.log(algorithms); // ["ML-KEM-512", "ML-KEM-768", "ML-KEM-1024", ...]
     * ```
     */
    function getEnabledAlgorithms(): string[];

    /**
     * Checks if a specific KEM algorithm is enabled.
     * @param name - The algorithm name to check
     * @returns true if the algorithm is enabled, false otherwise
     * @throws {Error} When name is not a string
     * @example
     * ```typescript
     * const isEnabled = KEMs.isAlgorithmEnabled("ML-KEM-768");
     * console.log(isEnabled); // true or false
     * ```
     */
    function isAlgorithmEnabled(name: string): boolean;

    /**
     * Switches to a specific KEM algorithm (deprecated - use specific algorithm names instead).
     * @param name - The algorithm name to switch to
     * @throws {Error} When algorithm is not supported
     * @deprecated This method is deprecated. Use specific algorithm names with KeyEncapsulation constructor instead.
     */
    function switchAlgorithm(name: string): void;
  }

  /**
   * Details about a Key Encapsulation Mechanism algorithm.
   */
  export interface KEMDetails {
    /** The algorithm name */
    name: string;
    /** The algorithm version */
    version: string;
    /** The claimed NIST security level (1-5) */
    claimedNistLevel: number;
    /** Whether the algorithm provides IND-CCA security */
    isINDCCA: boolean;
    /** Length of public keys in bytes */
    publicKeyLength: number;
    /** Length of secret keys in bytes */
    secretKeyLength: number;
    /** Length of ciphertexts in bytes */
    ciphertextLength: number;
    /** Length of shared secrets in bytes */
    sharedSecretLength: number;
  }

  /**
   * Result of key encapsulation operation.
   */
  export interface EncapsulationResult {
    /** The encapsulated ciphertext */
    ciphertext: Buffer;
    /** The shared secret */
    sharedSecret: Buffer;
  }

  /**
   * Key Encapsulation Mechanism (KEM) implementation for post-quantum cryptography.
   * Supports various algorithms like ML-KEM (formerly Kyber), FrodoKEM, and others.
   */
  export class KeyEncapsulation {
    /**
     * Creates a new KeyEncapsulation instance.
     * @param algName - The KEM algorithm name (e.g., "ML-KEM-768")
     * @param secretKey - Optional pre-existing secret key
     * @throws {Error} When algorithm is not supported or secretKey is invalid
     * @example
     * ```typescript
     * const kem = new KeyEncapsulation("ML-KEM-768");
     * // or with existing secret key
     * const existingKey = Buffer.alloc(48, 'my-key');
     * const kemWithKey = new KeyEncapsulation("ML-KEM-768", existingKey);
     * ```
     */
    constructor(algName: string, secretKey?: Buffer);

    /**
     * Generates a new key pair and returns the public key.
     * This method must be called before performing encapsulation or decapsulation.
     * @returns The generated public key
     * @example
     * ```typescript
     * const kem = new KeyEncapsulation("ML-KEM-768");
     * const publicKey = kem.generateKeypair();
     * console.log(publicKey.length); // Algorithm-specific length
     * ```
     */
    generateKeypair(): Buffer;

    /**
     * Exports the secret key.
     * @returns The secret key as a Buffer
     * @example
     * ```typescript
     * const kem = new KeyEncapsulation("ML-KEM-768");
     * kem.generateKeypair();
     * const secretKey = kem.exportSecretKey();
     * ```
     */
    exportSecretKey(): Buffer;

    /**
     * Encapsulates a shared secret using the provided public key.
     * @param publicKey - The recipient's public key
     * @returns Object containing the ciphertext and shared secret
     * @throws {Error} When publicKey is invalid or has wrong length
     * @example
     * ```typescript
     * const sender = new KeyEncapsulation("ML-KEM-768");
     * const receiver = new KeyEncapsulation("ML-KEM-768");
     * const receiverPublicKey = receiver.generateKeypair();
     * 
     * const { ciphertext, sharedSecret } = sender.encapsulateSecret(receiverPublicKey);
     * ```
     */
    encapsulateSecret(publicKey: Buffer): EncapsulationResult;

    /**
     * Decapsulates a shared secret from the provided ciphertext.
     * @param ciphertext - The ciphertext to decapsulate
     * @returns The shared secret
     * @throws {Error} When ciphertext is invalid, has wrong length, or no secret key is available
     * @example
     * ```typescript
     * const receiver = new KeyEncapsulation("ML-KEM-768");
     * receiver.generateKeypair();
     * 
     * // ... receive ciphertext from sender ...
     * const sharedSecret = receiver.decapsulateSecret(ciphertext);
     * ```
     */
    decapsulateSecret(ciphertext: Buffer): Buffer;

    /**
     * Gets detailed information about the algorithm.
     * @returns Algorithm details including lengths and security properties
     * @example
     * ```typescript
     * const kem = new KeyEncapsulation("ML-KEM-768");
     * const details = kem.getDetails();
     * console.log(`Algorithm: ${details.name}`);
     * console.log(`Security Level: ${details.claimedNistLevel}`);
     * console.log(`Public Key Length: ${details.publicKeyLength}`);
     * ```
     */
    getDetails(): KEMDetails;
  }

  /**
   * Digital signature algorithm management.
   * Provides utilities to query and manage available post-quantum signature algorithms.
   */
  export namespace Sigs {
    /**
     * Gets a list of all enabled signature algorithms.
     * @returns Array of algorithm names that are currently enabled
     * @example
     * ```typescript
     * const algorithms = Sigs.getEnabledAlgorithms();
     * console.log(algorithms); // ["ML-DSA-44", "ML-DSA-65", "ML-DSA-87", "Falcon-512", ...]
     * ```
     */
    function getEnabledAlgorithms(): string[];

    /**
     * Checks if a specific signature algorithm is enabled.
     * @param name - The algorithm name to check
     * @returns true if the algorithm is enabled, false otherwise
     * @throws {Error} When name is not a string
     * @example
     * ```typescript
     * const isEnabled = Sigs.isAlgorithmEnabled("ML-DSA-65");
     * console.log(isEnabled); // true or false
     * ```
     */
    function isAlgorithmEnabled(name: string): boolean;
  }

  /**
   * Details about a digital signature algorithm.
   */
  export interface SignatureDetails {
    /** The algorithm name */
    name: string;
    /** The algorithm version */
    version: string;
    /** The claimed NIST security level (1-5) */
    claimedNistLevel: number;
    /** Whether the algorithm provides EUF-CMA security */
    isEUFCMA: boolean;
    /** Length of public keys in bytes */
    publicKeyLength: number;
    /** Length of secret keys in bytes */
    secretKeyLength: number;
    /** Maximum length of signatures in bytes */
    maxSignatureLength: number;
  }

  /**
   * Digital signature implementation for post-quantum cryptography.
   * Supports various algorithms like ML-DSA (formerly Dilithium), Falcon, SPHINCS+, and others.
   */
  export class Signature {
    /**
     * Creates a new Signature instance.
     * @param algName - The signature algorithm name (e.g., "ML-DSA-65")
     * @param secretKey - Optional pre-existing secret key
     * @throws {Error} When algorithm is not supported or secretKey is invalid
     * @example
     * ```typescript
     * const sig = new Signature("ML-DSA-65");
     * // or with existing secret key
     * const existingKey = Buffer.alloc(48, 'my-key');
     * const sigWithKey = new Signature("ML-DSA-65", existingKey);
     * ```
     */
    constructor(algName: string, secretKey?: Buffer);

    /**
     * Generates a new key pair and returns the public key.
     * This method must be called before signing messages.
     * @returns The generated public key
     * @example
     * ```typescript
     * const sig = new Signature("ML-DSA-65");
     * const publicKey = sig.generateKeypair();
     * console.log(publicKey.length); // Algorithm-specific length
     * ```
     */
    generateKeypair(): Buffer;

    /**
     * Exports the secret key.
     * @returns The secret key as a Buffer
     * @example
     * ```typescript
     * const sig = new Signature("ML-DSA-65");
     * sig.generateKeypair();
     * const secretKey = sig.exportSecretKey();
     * ```
     */
    exportSecretKey(): Buffer;

    /**
     * Signs a message using the secret key.
     * @param message - The message to sign
     * @returns The signature
     * @throws {Error} When no secret key is available or message is invalid
     * @example
     * ```typescript
     * const sig = new Signature("ML-DSA-65");
     * sig.generateKeypair();
     * 
     * const message = Buffer.from("Hello, quantum world!", "utf8");
     * const signature = sig.sign(message);
     * ```
     */
    sign(message: Buffer): Buffer;

    /**
     * Verifies a signature against a message using the public key.
     * @param message - The original message
     * @param signature - The signature to verify
     * @param publicKey - The signer's public key
     * @returns true if signature is valid, false otherwise
     * @throws {Error} When parameters are invalid
     * @example
     * ```typescript
     * const verifier = new Signature("ML-DSA-65");
     * const isValid = verifier.verify(message, signature, publicKey);
     * console.log(isValid); // true or false
     * ```
     */
    verify(message: Buffer, signature: Buffer, publicKey: Buffer): boolean;

    /**
     * Gets detailed information about the algorithm.
     * @returns Algorithm details including lengths and security properties
     * @example
     * ```typescript
     * const sig = new Signature("ML-DSA-65");
     * const details = sig.getDetails();
     * console.log(`Algorithm: ${details.name}`);
     * console.log(`Security Level: ${details.claimedNistLevel}`);
     * console.log(`Max Signature Length: ${details.maxSignatureLength}`);
     * ```
     */
    getDetails(): SignatureDetails;
  }

  /**
   * Complete liboqs-node module interface.
   */
  export interface LibOQSModule {
    Random: typeof Random;
    KEMs: typeof KEMs;
    Sigs: typeof Sigs;
    KeyEncapsulation: typeof KeyEncapsulation;
    Signature: typeof Signature;
  }

  /**
   * The main liboqs-node module export.
   */
  const liboqs: LibOQSModule;

  export = liboqs;
}
