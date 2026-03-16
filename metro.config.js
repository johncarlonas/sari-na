const { getDefaultConfig } = require('@expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

// Metro for React Native / Expo doesn't include Node core modules.
// Some Supabase dependencies (like ws) import "stream" which isn't available.
// Keep the polyfill surface minimal to avoid native module issues in release builds.

defaultConfig.resolver.unstable_conditionNames = [
  'react-native',
  'browser',
  'require',
];

defaultConfig.resolver.extraNodeModules = {
  ...(defaultConfig.resolver.extraNodeModules || {}),
  // Ensure stream uses a browser-friendly implementation.
  stream: require.resolve('stream-browserify'),
};

module.exports = defaultConfig;
