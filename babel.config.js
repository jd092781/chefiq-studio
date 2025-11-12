// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    // No "expo-router/babel" here (deprecated on SDK 50+)
    // Use the new worklets plugin (replacement for reanimated's babel plugin)
    plugins: ["react-native-worklets/plugin"],
  };
};
