const { getDefaultConfig } = require('expo/metro-config');
const fs = require('fs');
const path = require('path');

const config = getDefaultConfig(__dirname);

// viem pulls in @noble/hashes@1.x, whose CJS build does
// `require("@noble/hashes/crypto")`. Metro probes the `./crypto.js`
// subpath, which that version's `exports` map does not list, so every
// bundle logs "not listed in the exports" warnings and falls back to
// file resolution. The file is just `globalThis.crypto` (no node:crypto),
// which works on Android because src/polyfills.ts installs
// expo-crypto's getRandomValues before any app code runs. Resolve it
// explicitly to silence the warning and pin the device-safe shim —
// never the `cryptoNode.js` (node:crypto) variant, which Hermes cannot
// load.
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@noble/hashes/crypto.js') {
    try {
      const pkgPath = require.resolve('@noble/hashes/package.json', {
        paths: [path.dirname(context.originModuleName)],
      });
      const filePath = path.join(path.dirname(pkgPath), 'crypto.js');
      if (fs.existsSync(filePath)) {
        return { filePath, type: 'sourceFile' };
      }
    } catch {
      // Fall through to default handling below.
    }
  }
  if (typeof defaultResolveRequest === 'function') {
    return defaultResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
