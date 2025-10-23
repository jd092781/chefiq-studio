// babel.config.js
module.exports = function (api) {
  api.cache(true);

  const plugins = [
    // Required for Expo Router
    'expo-router/babel',
  ];

  // Only include the worklets plugin if it's installed.
  try {
    require.resolve('react-native-worklets/plugin');
    plugins.push('react-native-worklets/plugin');
  } catch (e) {
    // Not installed – skip. This avoids CI/Expo build crashes.
  }

  return {
    presets: ['babel-preset-expo'],
    plugins,
  };
};
