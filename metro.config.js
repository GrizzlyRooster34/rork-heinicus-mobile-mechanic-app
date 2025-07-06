const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Enable Hermes for better Android performance
config.transformer.hermesCommand = 'hermes';

// Optimize for Android builds - prioritize Android platform
config.resolver.platforms = ['android', 'native', 'ios', 'web'];

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

// Optimize bundle size for Android 11+
config.transformer.minifierConfig = {
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
  output: {
    ascii_only: true,
    quote_keys: true,
    wrap_iife: true,
  },
  sourceMap: {
    includeSources: false,
  },
  toplevel: false,
  compress: {
    reduce_funcs: false,
  },
};

// Android-specific performance optimizations
config.cacheStores = [
  {
    name: 'filesystem',
    options: {
      cacheDirectory: './node_modules/.cache/metro',
    },
  },
];

// Optimize for Android builds
config.serializer = {
  ...config.serializer,
  getModulesRunBeforeMainModule: () => [
    require.resolve('react-native/Libraries/Core/InitializeCore'),
  ],
};

module.exports = withNativeWind(config, { input: './global.css' });