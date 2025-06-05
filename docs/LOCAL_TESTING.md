# Local Testing with Act

This document explains how to test GitHub Actions workflows locally and addresses common issues like the "sudo: command not found" error.

## The Problem

When testing GitHub Actions workflows locally using [act](https://github.com/nektos/act), you might encounter this error:

```
/var/run/act/workflow/3: line 2: sudo: command not found
exitcode '127': command not found
```

This happens because:
1. `act` uses minimal Docker images (like `node:16-buster-slim`) by default
2. These images don't include `sudo` to keep them lightweight
3. GitHub Actions workflows often use `sudo` for package installation

## The Solution

We've implemented a multi-layered solution:

### 1. Smart Sudo Detection

The workflow now detects if `sudo` is available and adapts accordingly:

```bash
# Handle both real GitHub Actions and local act testing
if command -v sudo >/dev/null 2>&1; then
  SUDO_CMD="sudo"
else
  SUDO_CMD=""
  echo "Running without sudo (likely in act/container environment)"
  # In container environments, check if running as root
  if [ "$(id -u)" = "0" ]; then
    echo "Running as root in container, no sudo needed"
  else
    echo "Warning: Not running as root and no sudo available"
  fi
fi

# Use $SUDO_CMD instead of hardcoded sudo
$SUDO_CMD apt-get update
```

### 2. Graceful Fallbacks

Package installation now has fallbacks for missing packages:

```bash
$SUDO_CMD apt-get install -y build-essential g++ libc6-dev ninja-build cmake curl || {
  echo "Failed to install all packages, trying minimal set..."
  $SUDO_CMD apt-get install -y build-essential cmake || {
    echo "Failed to install build tools, continuing anyway..."
  }
}
```

### 3. Better Container Image

The `.actrc` file configures act to use a better image:

```ini
# Use ubuntu:latest which includes sudo instead of the slim node image
-P ubuntu-latest=catthehacker/ubuntu:act-latest
--container-architecture linux/amd64
--artifact-server-path /tmp/artifacts
```

### 4. Testing Script

Use the provided `test-workflow.sh` script for easy local testing:

```bash
./test-workflow.sh
```

## Manual Testing

If you prefer to run act manually:

```bash
# Test a single job
act -W .github/workflows/publish-binaries.yml \
    --job "build" \
    --matrix os:ubuntu-latest \
    --matrix arch:x64 \
    --matrix target:linux \
    --matrix cross:false \
    -e .github/event.json \
    --container-architecture linux/amd64 \
    -P ubuntu-latest=catthehacker/ubuntu:act-latest
```

## Common Issues and Solutions

### Issue: "sudo: command not found"
**Solution**: The workflow now automatically detects and handles this. Ensure you're using the updated workflow.

### Issue: Package installation fails
**Solution**: The workflow includes fallbacks. Check the logs for specific package failures.

### Issue: Cross-compilation fails
**Solution**: Cross-compilation setup is complex and may require additional container setup. Focus on native builds for local testing.

### Issue: ARM builds fail on x86
**Solution**: This is expected. ARM builds require emulation or cross-compilation setup.

## Environment Variables

The workflow supports these environment variables for testing:

- `OQS_PERMIT_UNSUPPORTED_ARCHITECTURE=ON`: Allow building on unsupported architectures
- `OQS_USE_OPENSSL=OFF`: Disable OpenSSL (useful for cross-compilation)
- `CMAKE_FLAGS`: Additional CMake flags

## Tips for Local Development

1. **Start Simple**: Test with ubuntu-latest x64 first
2. **Check Prerequisites**: Ensure Docker is running
3. **Use Artifacts**: Check `/tmp/artifacts` for build outputs
4. **Monitor Resources**: Act can be resource-intensive
5. **Read Logs**: Use `--verbose` flag for detailed output

## Real vs Local Testing

| Aspect | GitHub Actions | Act (Local) |
|--------|----------------|-------------|
| Sudo | Available | May not be available |
| Environment | Clean Ubuntu VM | Docker container |
| Resources | High CPU/RAM | Limited by host |
| Network | Fast | Depends on connection |
| Secrets | Available | Mock/empty |
| Artifacts | Uploaded to GitHub | Saved locally |

## Troubleshooting

If you encounter issues:

1. **Check act version**: `act --version`
2. **Update act**: `brew upgrade act`
3. **Check Docker**: `docker info`
4. **Review logs**: Look for specific error messages
5. **Simplify**: Test individual steps

## Resources

- [Act Documentation](https://github.com/nektos/act)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Hub - catthehacker images](https://hub.docker.com/r/catthehacker/ubuntu)

