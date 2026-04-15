const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Watch all files in the monorepo
config.watchFolders = [
	...new Set([...(config.watchFolders || []), workspaceRoot]),
];

// Resolve the app's own dependencies first, then fall back to hoisted workspace packages.
config.resolver.nodeModulesPaths = [
	path.resolve(projectRoot, "node_modules"),
	...(config.resolver.nodeModulesPaths || []),
	path.resolve(workspaceRoot, "node_modules"),
];

module.exports = config;
