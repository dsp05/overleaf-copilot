'use strict';

const { merge } = require('webpack-merge');

const common = require('./webpack.common.js');
const PATHS = require('./paths');

// Merge webpack configuration files
const config = (env, argv) =>
  merge(common, {
    entry: {
      contentMainScript: PATHS.src + '/main/contentScript.ts',
      contentIsoScript: PATHS.src + '/iso//contentScript.ts',
      background: PATHS.src + '/background.ts',
      options: PATHS.src + '/components/Options.tsx',
      similar: PATHS.src + '/components/FindSimilarPage.tsx',
    },
    devtool: argv.mode === 'production' ? false : 'source-map',
    resolve: {
      fallback: {
        http: false,
        https: false,
        url: false,
        timers: false,
        string_decoder: false,
      },
    },
  });

module.exports = config;
