/**
 * Web shim for `react-native-safe-area-context/src/specs/NativeSafeAreaContext`.
 *
 * The native spec module calls `TurboModuleRegistry.get('RNCSafeAreaContext')`
 * at module top-level, but react-native-web does not implement
 * TurboModuleRegistry, so importing it crashes the web bundle.
 *
 * On web, safe-area insets are measured via CSS/env() by
 * NativeSafeAreaProvider.web.tsx, so this module can safely be null.
 */

module.exports = null;
