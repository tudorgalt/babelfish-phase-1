"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
/* eslint-disable @typescript-eslint/no-use-before-define */
var test_helpers_1 = require("@openzeppelin/test-helpers");
var env_setup_1 = require("@utils/env_setup");
var constants_1 = require("@utils/constants");
var standardAccounts_1 = require("@utils/standardAccounts");
var MockProxyImplementation1 = artifacts.require("MockProxyImplementation1");
var MockProxyImplementation2 = artifacts.require("MockProxyImplementation2");
var InitializableAdminUpgradeabilityProxy = artifacts.require("InitializableAdminUpgradeabilityProxy");
var expect = env_setup_1["default"].configure().expect;
contract("InitializableAdminUpgradeabilityProxy", function (accounts) { return __awaiter(void 0, void 0, void 0, function () {
    var sa;
    return __generator(this, function (_a) {
        sa = new standardAccounts_1.StandardAccounts(accounts);
        describe("changeAdmin", function () { return __awaiter(void 0, void 0, void 0, function () {
            var proxyImplementation, adminUpgradeabilityProxy, admin;
            return __generator(this, function (_a) {
                beforeEach("before", function () { return __awaiter(void 0, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, MockProxyImplementation1["new"]()];
                            case 1:
                                proxyImplementation = _a.sent();
                                return [4 /*yield*/, InitializableAdminUpgradeabilityProxy["new"]({ from: sa["default"] })];
                            case 2:
                                adminUpgradeabilityProxy = _a.sent();
                                admin = sa["default"];
                                return [4 /*yield*/, initProxy(admin, proxyImplementation, adminUpgradeabilityProxy)];
                            case 3:
                                _a.sent();
                                return [2 /*return*/];
                        }
                    });
                }); });
                context("should fail", function () { return __awaiter(void 0, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        it("when caller is not admin", function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, (0, test_helpers_1.expectRevert)(adminUpgradeabilityProxy.changeAdmin(sa.governor, { from: sa.dummy1 }), "Transaction reverted: function selector was not recognized and there's no fallback function")];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                        it("when admin is not valid", function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, (0, test_helpers_1.expectRevert)(adminUpgradeabilityProxy.changeAdmin(constants_1.ZERO_ADDRESS, { from: admin }), "VM Exception while processing transaction: reverted with reason string 'Cannot change the admin of a proxy to the zero address'")];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                        return [2 /*return*/];
                    });
                }); });
                context("should succeed", function () { return __awaiter(void 0, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        it("when all params are valid", function () { return __awaiter(void 0, void 0, void 0, function () {
                            var newAdmin, tx, setAdmin;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        newAdmin = sa.governor;
                                        return [4 /*yield*/, adminUpgradeabilityProxy.changeAdmin(newAdmin, { from: admin })];
                                    case 1:
                                        tx = _a.sent();
                                        return [4 /*yield*/, (0, test_helpers_1.expectEvent)(tx.receipt, "AdminChanged", {
                                                previousAdmin: admin,
                                                newAdmin: newAdmin
                                            })];
                                    case 2:
                                        _a.sent();
                                        return [4 /*yield*/, adminUpgradeabilityProxy.admin()];
                                    case 3:
                                        setAdmin = _a.sent();
                                        expect(setAdmin).to.eq(newAdmin);
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                        return [2 /*return*/];
                    });
                }); });
                return [2 /*return*/];
            });
        }); });
        describe("integration", function () { return __awaiter(void 0, void 0, void 0, function () {
            var proxyImplementation, proxyImplementation2, adminUpgradeabilityProxy;
            return __generator(this, function (_a) {
                beforeEach("before", function () { return __awaiter(void 0, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, MockProxyImplementation1["new"]()];
                            case 1:
                                proxyImplementation = _a.sent();
                                return [4 /*yield*/, MockProxyImplementation2["new"]()];
                            case 2:
                                proxyImplementation2 = _a.sent();
                                return [4 /*yield*/, InitializableAdminUpgradeabilityProxy["new"]({ from: sa["default"] })];
                            case 3:
                                adminUpgradeabilityProxy = _a.sent();
                                return [2 /*return*/];
                        }
                    });
                }); });
                it("full flow test", function () { return __awaiter(void 0, void 0, void 0, function () {
                    var currImplementationVersion, initdata, admin, implementationThroughProxy, isImplementationInitalized, newAdmin, initdata2;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                initdata = proxyImplementation.contract.methods.initialize().encodeABI();
                                return [4 /*yield*/, adminUpgradeabilityProxy.methods["initialize(address,address,bytes)"](proxyImplementation.address, sa.governor, initdata)];
                            case 1:
                                _a.sent();
                                return [4 /*yield*/, adminUpgradeabilityProxy.admin()];
                            case 2:
                                admin = _a.sent();
                                expect(admin).to.eq(sa.governor, "proper admin should be set");
                                return [4 /*yield*/, MockProxyImplementation1.at(adminUpgradeabilityProxy.address)];
                            case 3:
                                implementationThroughProxy = _a.sent();
                                return [4 /*yield*/, implementationThroughProxy.isInitialized()];
                            case 4:
                                isImplementationInitalized = _a.sent();
                                expect(isImplementationInitalized).to.eq(true, "init function should be called");
                                return [4 /*yield*/, implementationThroughProxy.getVersion()];
                            case 5:
                                currImplementationVersion = _a.sent();
                                expect(currImplementationVersion).to.eq("1");
                                return [4 /*yield*/, adminUpgradeabilityProxy.changeAdmin(sa["default"], { from: sa.governor })];
                            case 6:
                                _a.sent();
                                return [4 /*yield*/, adminUpgradeabilityProxy.admin()];
                            case 7:
                                newAdmin = _a.sent();
                                expect(newAdmin).to.eq(sa["default"], "admin should be changed");
                                initdata2 = proxyImplementation2.contract.methods.initialize().encodeABI();
                                return [4 /*yield*/, adminUpgradeabilityProxy.upgradeToAndCall(proxyImplementation2.address, initdata2, { from: sa["default"] })];
                            case 8:
                                _a.sent();
                                return [4 /*yield*/, implementationThroughProxy.getVersion()];
                            case 9:
                                currImplementationVersion = _a.sent();
                                expect(currImplementationVersion).to.eq("2", "should point to second implementation after upgrade");
                                return [2 /*return*/];
                        }
                    });
                }); });
                return [2 /*return*/];
            });
        }); });
        return [2 /*return*/];
    });
}); });
var initProxy = function (admin, implementation, proxy) { return __awaiter(void 0, void 0, void 0, function () {
    var initdata, implementationThroughProxy;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                initdata = implementation.contract.methods.initialize().encodeABI();
                return [4 /*yield*/, proxy.methods["initialize(address,address,bytes)"](implementation.address, admin, initdata)];
            case 1:
                _a.sent();
                return [4 /*yield*/, MockProxyImplementation1.at(proxy.address)];
            case 2:
                implementationThroughProxy = _a.sent();
                return [2 /*return*/, implementationThroughProxy];
        }
    });
}); };
