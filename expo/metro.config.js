// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add support for TypeScript, JSX, and modern JS features
config.resolver.assetExts.push('bin');
config.resolver.sourceExts.push('sql');

// Configure transformer for better performance
config.transformer.minifierConfig = {
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
};

// Configure resolver for better module resolution
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Add support for absolute imports
config.resolver.alias = {
  '@': '.',
};

// Enable experimental features for better performance
config.transformer.unstable_allowRequireContext = true;


// Reduce file watching to avoid ENOSPC errors in Termux
config.watchFolders = [];
config.resolver.blockList = [
  /node_modules\/.*\/android\/.*/,
  /node_modules\/.*\/ios\/.*/,
  /node_modules\/.*\/gradle\/.*/,
  /node_modules\/.*\/kotlin\/.*/,
  /node_modules\/.*\/java\/.*/,
  /backend\/.*/, // Exclude backend from mobile bundle
];

// Disable file watching for problematic directories
config.watcher = {
  ...config.watcher,
  watchman: false,
};

module.exports = config;