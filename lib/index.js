import bindings from "bindings";
const addon = bindings("oqs_node");

// Export named exports for ESM compatibility
export const { Random, KEMs, Sigs, KeyEncapsulation, Signature } = addon;

// Also export default for backward compatibility
export default addon;
