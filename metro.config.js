const { getDefaultConfig } = require('@expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

// Metro for React Native / Expo doesn't include Node core modules.
// Some Supabase dependencies (like ws) import "stream" which isn't available.
// Provide browser-friendly polyfills via node-libs-react-native and stream-browserify.
const nodeLibs = require('node-libs-react-native');

defaultConfig.resolver.unstable_conditionNames = [
  'react-native',
  'browser',
  'require',
];

defaultConfig.resolver.extraNodeModules = {
  ...(defaultConfig.resolver.extraNodeModules || {}),
  ...nodeLibs,
  // Ensure stream uses a browser-friendly implementation.
  stream: require.resolve('stream-browserify'),
};

module.exports = defaultConfig;
