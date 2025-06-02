/// <reference types="node" />

declare module "@skairipaapps/liboqs-node" {
  // === Random ===
  export namespace Random {
    function randomBytes(length: number): Buffer;
    function initNistKat(seed: Buffer): void;
  }

  // === KEMs ===
  export namespace KEMs {
    function getEnabledAlgorithms(): string[];
    function isAlgorithmEnabled(name: string): boolean;
    function switchAlgorithm(name: string): void;
  }

  // === KeyEncapsulation ===
  export class KeyEncapsulation {
    constructor(algName: string);

    generateKeypair(): void;
    exportSecretKey(): Buffer;

    encapsulateSecret(publicKey: Buffer): { ciphertext: Buffer; sharedSecret: Buffer };
    decapsulateSecret(ciphertext: Buffer): Buffer;

    getDetails(): {
      algName: string;
      version: string;
      claimedNistLevel: number;
      isIndCCA: boolean;
      lengthCiphertext: number;
      lengthSharedSecret: number;
      lengthSecretKey: number;
      lengthPublicKey: number;
    };
  }

  // === Sigs ===
  export namespace Sigs {
    function getEnabledAlgorithms(): string[];
    function isAlgorithmEnabled(name: string): boolean;
  }

  // === Signature ===
  export class Signature {
    constructor(algName: string);

    generateKeypair(): void;
    exportSecretKey(): Buffer;

    sign(message: Buffer): Buffer;
    verify(message: Buffer, signature: Buffer): boolean;

    getDetails(): {
      algName: string;
      version: string;
      claimedNistLevel: number;
      lengthSignature: number;
      lengthPublicKey: number;
      lengthSecretKey: number;
    };
  }

  // === Default Exported Structure ===
  const liboqs: {
    Random: typeof Random;
    KEMs: typeof KEMs;
    Sigs: typeof Sigs;
    KeyEncapsulation: typeof KeyEncapsulation;
    Signature: typeof Signature;
  };

  export = liboqs;
}

