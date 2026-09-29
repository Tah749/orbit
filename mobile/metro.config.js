const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const shared = path.resolve(projectRoot, "../src/orbit");

const config = getDefaultConfig(projectRoot);

// The web app's pure data and logic live outside this folder; Metro must watch them.
config.watchFolders = [...(config.watchFolders ?? []), shared];

// Anything imported from the shared folder resolves packages from mobile/node_modules.
config.resolver.nodeModulesPaths = [path.resolve(projectRoot, "node_modules")];

// "@orbit/x" maps to ../src/orbit/x (mirrors the tsconfig paths entry).
const upstream = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith("@orbit/")) {
    const target = path.join(shared, moduleName.slice("@orbit/".length));
    return (upstream ?? context.resolveRequest)(context, target, platform);
  }
  return (upstream ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = config;
