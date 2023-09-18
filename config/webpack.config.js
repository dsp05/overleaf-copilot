"use strict";

const { merge } = require("webpack-merge");

const common = require("./webpack.common.js");
const PATHS = require("./paths");

// Merge webpack configuration files
const config = (env, argv) =>
  merge(common, {
    entry: {
      popup: PATHS.src + "/popup.ts",
      contentMainScript: PATHS.src + "/contentMainScript.ts",
      contentIsoScript: PATHS.src + "/contentIsoScript.ts",
      background: PATHS.src + "/background.ts",
      search: PATHS.src + "/search.ts",
    },
    devtool: argv.mode === "production" ? false : "source-map",
    resolve: {
      fallback: {
        http: false,
        https: false,
        url: false,
        timers: false
      }
    }
  });

module.exports = config;
