/**
 export const browserCodeLoadingCacheStrategy = (() => {
    // Always enabled when sandbox is enabled
    if (isElectronSandboxed) {
        return 'bypassHeatCheck';
    }
    // Otherwise, only enabled conditionally
    const env = nodeProcess === null || nodeProcess === void 0 ? void 0 : nodeProcess.env['ENABLE_VSCODE_BROWSER_CODE_LOADING'];
    if (typeof env === 'string') {
        if (env === 'none' || env === 'code' || env === 'bypassHeatCheck' || env === 'bypassHeatCheckAndEagerCompile') {
            return env;
        }
        return 'bypassHeatCheck';
    }
    return undefined;
})();
 */
module.exports = {
  module: {
    rules: [
      {
        test: /monaco-editor\/esm\/vs\/base\/common\/platform.js/,
        loader: 'string-replace-loader',
        options: {
          search: 'if (isElectronSandboxed) {',
          replace: 'if (1) {'
        }
      }
    ]
  }
};
