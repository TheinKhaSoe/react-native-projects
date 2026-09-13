const { getDefaultConfig } = require("expo/metro-config");
const { withNativewind } = require("nativewind/metro");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// expo-sqlite uses a WASM build (wa-sqlite) on web; Metro needs .wasm as an asset.
config.resolver.assetExts.push("wasm");

module.exports = withNativewind(config);
