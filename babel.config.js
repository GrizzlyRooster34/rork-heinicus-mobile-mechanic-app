module.exports = function (api) {
  api.cache(true);
  
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          jsxImportSource: 'nativewind',
        },
      ],
    ],
    plugins: [
      // Required for NativeWind
      'nativewind/babel',
      
      // React Native Reanimated plugin (should be last)
      [
        'react-native-reanimated/plugin',
        {
          relativeSourceLocation: true,
        },
      ],
    ],
  };
};