"use strict";
/// <reference path="../types/interfaces.d.ts" />
/// <reference path="../types/chai.d.ts" />
exports.__esModule = true;
var chai = require("chai");
var chai_bn_1 = require("chai-bn");
var tools_1 = require("./tools");
/**
 * @notice This file configures the environment for testing
 */
var TestEnvironmentSetup = /** @class */ (function () {
    function TestEnvironmentSetup() {
        this.isConfigured = false;
    }
    TestEnvironmentSetup.prototype.configure = function () {
        require("chai-core");
        if (this.isConfigured) {
            return chai;
        }
        chai.use((0, chai_bn_1["default"])(tools_1.BN));
        chai.should();
        this.isConfigured = true;
        return chai;
    };
    return TestEnvironmentSetup;
}());
exports["default"] = new TestEnvironmentSetup();
