// Runtime-aware entry point
// Detects whether running in Node.js or Bun and loads appropriate implementation

const runtime = (() => {
  if (typeof Bun !== 'undefined') {
    return 'bun';
  }
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    return 'node';
  }
  return 'unknown';
})();

if (runtime === 'bun') {
  // Use FFI-based implementation for Bun
  // Re-export everything from the Bun module
  export * from './bun.js';
} else if (runtime === 'node') {
  // Use native addon for Node.js
  import bindings from "bindings";
  const addon = bindings("oqs_node");
  
  // Export named exports for ESM compatibility
  export const { Random, KEMs, Sigs, KeyEncapsulation, Signature } = addon;
  
  // Also export default for backward compatibility
  export default addon;
} else {
  throw new Error(`Unsupported runtime: ${runtime}`);
}
