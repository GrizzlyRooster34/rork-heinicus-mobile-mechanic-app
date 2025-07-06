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
  '@': './src',
};

// Enable experimental features for better performance
config.transformer.unstable_allowRequireContext = true;

module.exports = config;