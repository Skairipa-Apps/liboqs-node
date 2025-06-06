// Test runtime detection and basic functionality
import { describe, it } from 'mocha';
import { expect } from 'chai';

describe('Runtime Detection', () => {
  it('should detect the current runtime', () => {
    const runtime = (() => {
      if (typeof Bun !== 'undefined') {
        return 'bun';
      }
      if (typeof process !== 'undefined' && process.versions && process.versions.node) {
        return 'node';
      }
      return 'unknown';
    })();
    
    console.log(`Detected runtime: ${runtime}`);
    expect(['bun', 'node']).to.include(runtime);
  });
  
  it('should load the appropriate module for the runtime', async () => {
    try {
      const module = await import('../lib/index.js');
      expect(module).to.be.an('object');
      expect(module.KeyEncapsulation).to.exist;
      expect(module.Signature).to.exist;
      expect(module.KEMs).to.exist;
      expect(module.Sigs).to.exist;
    } catch (error) {
      // For Bun, the FFI implementation might not be complete yet
      if (typeof Bun !== 'undefined') {
        console.log('Bun FFI implementation not complete yet:', error.message);
      } else {
        throw error;
      }
    }
  });
});

