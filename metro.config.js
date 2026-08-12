const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * Web support: when bundling for the web platform, `react-native` is resolved
 * to `react-native-web`. Native platforms are unaffected.
 *
 * Also, react-native-safe-area-context ships a native TurboModule spec that
 * calls `TurboModuleRegistry.get()` at module scope — react-native-web has no
 * TurboModuleRegistry, so for web we substitute a null shim.
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const defaultConfig = getDefaultConfig(__dirname);

const config = {
  resolver: {
    // Allow platform-specific web files (e.g. storage.web.ts).
    sourceExts: [...defaultConfig.resolver.sourceExts, 'web.ts', 'web.tsx'],
    resolveRequest: (context, moduleName, platform) => {
      if (platform === 'web') {
        if (moduleName === 'react-native') {
          // Rewrite 'react-native' to 'react-native-web' for the web bundle.
          return context.resolveRequest(
            context,
            'react-native-web',
            platform,
          );
        }
        // Avoid importing the native-only TurboModule spec on web: it calls
        // TurboModuleRegistry.get() at module scope, which react-native-web
        // does not implement. Note: `context.sourcePath` is undefined in this
        // Metro version, so we key purely on the module specifier.
        if (moduleName === './specs/NativeSafeAreaContext') {
          return context.resolveRequest(
            context,
            path.join(__dirname, 'web-shims', 'NativeSafeAreaContext.js'),
            platform,
          );
        }
      }
      // Fall back to the default resolver for everything else.
      return context.resolveRequest(context, moduleName, platform);
    },
  },
};

module.exports = mergeConfig(defaultConfig, config);
