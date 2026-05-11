const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Abilita package exports per react-map-gl v8+ e mapbox-gl v3+
// (entrambi usano il campo "exports" in package.json senza un root "." export)
config.resolver.unstable_enablePackageExports = true;
config.resolver.unstable_conditionNames = ["browser", "require", "default"];

module.exports = config;
