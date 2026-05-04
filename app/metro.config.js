const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = {
  watchFolders: [workspaceRoot],
  resolver: {
    nodeModulesPaths: [
      path.resolve(projectRoot, 'node_modules'),
      path.resolve(workspaceRoot, 'node_modules'),
    ],
    // `@/` import alias — mirrors tsconfig.json paths so editor + bundler agree.
    extraNodeModules: new Proxy(
      {},
      {
        get: (_t, name) => {
          if (typeof name === 'string' && name.startsWith('@/')) {
            return path.resolve(projectRoot, 'src', name.slice(2));
          }
          return path.join(projectRoot, 'node_modules', name);
        },
      }
    ),
  },
};

module.exports = mergeConfig(getDefaultConfig(projectRoot), config);
