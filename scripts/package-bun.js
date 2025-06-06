import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { createRequire } from "module";

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

// Get package info
const packageJson = require("../package.json");
const version = packageJson.version;

// Get platform info
const platform = process.platform;
const arch = process.arch;

// Get Bun version
let bunVersion;
try {
  bunVersion = execSync("bun --version", { encoding: "utf8" }).trim();
} catch (error) {
  console.error("Bun not found. Please install Bun first.");
  process.exit(1);
}

// Define paths
const buildDir = path.join(__dirname, "../build");
const stageDir = path.join(buildDir, "stage", `v${version}`);
const tempDir = path.join(buildDir, "bun-temp");
const libDir = path.join(__dirname, "../lib");
const depsLibDir = path.join(__dirname, "../deps/liboqs/build/lib");

// Create staging directory if it doesn't exist
if (!fs.existsSync(stageDir)) {
  fs.mkdirSync(stageDir, { recursive: true });
}

// Clean up temp directory
if (fs.existsSync(tempDir)) {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
fs.mkdirSync(tempDir, { recursive: true });

// Copy Bun FFI wrapper
const bunJsSource = path.join(libDir, "bun.js");
const bunJsTarget = path.join(tempDir, "bun.js");

if (!fs.existsSync(bunJsSource)) {
  console.error("Bun FFI wrapper not found at", bunJsSource);
  process.exit(1);
}

fs.copyFileSync(bunJsSource, bunJsTarget);
console.log("Copied Bun FFI wrapper");

// Copy shared library
let libExtension;
switch (platform) {
  case "darwin":
    libExtension = "dylib";
    break;
  case "linux":
    libExtension = "so";
    break;
  case "win32":
    libExtension = "dll";
    break;
  default:
    console.error(`Unsupported platform: ${platform}`);
    process.exit(1);
}

const libSource = path.join(depsLibDir, `liboqs.${libExtension}`);
const libTarget = path.join(tempDir, `liboqs.${libExtension}`);

if (!fs.existsSync(libSource)) {
  console.error(`Shared library not found at ${libSource}. Please run 'npm run build:bun' first.`);
  process.exit(1);
}

fs.copyFileSync(libSource, libTarget);
console.log("Copied shared library");

// Copy version-specific symlinks if they exist (for Linux/macOS)
if (platform !== "win32") {
  const versionedLibs = fs.readdirSync(depsLibDir).filter(file => 
    file.startsWith("liboqs.") && file.endsWith(`.${libExtension}`) && file !== `liboqs.${libExtension}`
  );
  
  for (const versionedLib of versionedLibs) {
    const source = path.join(depsLibDir, versionedLib);
    const target = path.join(tempDir, versionedLib);
    if (fs.existsSync(source)) {
      fs.copyFileSync(source, target);
      console.log(`Copied versioned library: ${versionedLib}`);
    }
  }
}

// Create package metadata
const metadata = {
  name: packageJson.name,
  version: version,
  runtime: "bun",
  runtime_version: `v${bunVersion}`,
  platform: platform,
  arch: arch,
  files: [
    "bun.js",
    `liboqs.${libExtension}`
  ]
};

// Add versioned libs to metadata
if (platform !== "win32") {
  const versionedLibs = fs.readdirSync(tempDir).filter(file => 
    file.startsWith("liboqs.") && file.endsWith(`.${libExtension}`) && file !== `liboqs.${libExtension}`
  );
  metadata.files.push(...versionedLibs);
}

fs.writeFileSync(path.join(tempDir, "package.json"), JSON.stringify(metadata, null, 2));
console.log("Created package metadata");

// Create tarball
const tarballName = `oqs_node-v${version}-bun-${bunVersion}-${platform}-${arch}.tar.gz`;
const tarballPath = path.join(stageDir, tarballName);

// Use tar command to create the tarball
try {
  execSync(`tar -czf "${tarballPath}" -C "${tempDir}" .`, { stdio: "inherit" });
  console.log(`Created Bun package: ${tarballName}`);
} catch (error) {
  console.error("Failed to create tarball:", error.message);
  process.exit(1);
}

// Clean up temp directory
fs.rmSync(tempDir, { recursive: true, force: true });

// Verify the tarball was created
if (fs.existsSync(tarballPath)) {
  const stats = fs.statSync(tarballPath);
  console.log(`Package size: ${(stats.size / 1024).toFixed(2)} KB`);
  console.log(`Package path: ${tarballPath}`);
} else {
  console.error("Failed to create package");
  process.exit(1);
}

console.log("\nBun packaging completed successfully!");
console.log(`Package contents for ${tarballName}:`);
try {
  execSync(`tar -tzf "${tarballPath}"`, { stdio: "inherit" });
} catch (error) {
  console.log("Could not list package contents");
}

