const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Enable Hermes for better Android performance
config.transformer.hermesCommand = 'hermes';

// Optimize for Android builds
config.resolver.platforms = ['native', 'android', 'ios', 'web'];

// Add support for additional file extensions
config.resolver.assetExts.push(
  // Fonts
  'ttf',
  'otf',
  'woff',
  'woff2',
  // Images
  'svg',
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
  // Audio/Video
  'mp3',
  'mp4',
  'mov',
  'avi',
  // Documents
  'pdf'
);

// Configure source extensions
config.resolver.sourceExts.push('jsx', 'js', 'ts', 'tsx', 'json', 'mjs');

// Optimize bundle size for Android
config.transformer.minifierConfig = {
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
};

module.exports = withNativeWind(config, { input: './global.css' });