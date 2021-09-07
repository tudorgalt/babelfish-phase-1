"use strict";
exports.__esModule = true;
exports.fromWei = exports.padRight = exports.BN = exports.aToH = void 0;
var web3_utils_1 = require("web3-utils");
exports.aToH = web3_utils_1.asciiToHex;
exports.padRight = web3_utils_1.padRight;
exports.fromWei = web3_utils_1.fromWei;
var bn_js_1 = require("bn.js");
exports.BN = bn_js_1["default"];
