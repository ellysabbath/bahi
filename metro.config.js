const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Wrap the default config with NativeWind
module.exports = withNativeWind(config, {
  // Point to your global CSS file
  input: './global.css',
  // Set to true for optimal NativeWind v3+ compatibility
  // Set to false if you have issues with hot reload
  projectRoot: __dirname,
});