const bindings = require("bindings");

const addon = bindings("oqs_node");

// Export named exports for destructuring compatibility
module.exports = addon;
module.exports.Random = addon.Random;
module.exports.KEMs = addon.KEMs;
module.exports.Sigs = addon.Sigs;
module.exports.KeyEncapsulation = addon.KeyEncapsulation;
module.exports.Signature = addon.Signature;

// Also support default export
module.exports.default = addon;
