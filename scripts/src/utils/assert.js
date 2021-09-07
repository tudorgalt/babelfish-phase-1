"use strict";
exports.__esModule = true;
var node_logs_1 = require("node-logs");
var logger = new node_logs_1["default"]().showInConsole(true);
exports["default"] = (function (condition, message) {
    if (!condition) {
        var errorMessage = message || "Assertion failed";
        logger.err("err: " + errorMessage);
        throw new Error(errorMessage);
    }
});
