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
var test_helpers_1 = require("@openzeppelin/test-helpers");
var constants_1 = require("@utils/constants");
var env_setup_1 = require("@utils/env_setup");
var InitializableOwnableWrapper = artifacts.require("InitializableOwnableWrapper");
var expect = env_setup_1["default"].configure().expect;
contract("InitializableOwnable", function (accounts) { return __awaiter(void 0, void 0, void 0, function () {
    var owner, user, initializableOwnableWrapper;
    return __generator(this, function (_a) {
        owner = accounts[0], user = accounts[1];
        before("before all", function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, InitializableOwnableWrapper["new"]()];
                    case 1:
                        initializableOwnableWrapper = _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        describe("initialize", function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                beforeEach("before all", function () { return __awaiter(void 0, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, InitializableOwnableWrapper["new"]()];
                            case 1:
                                initializableOwnableWrapper = _a.sent();
                                return [2 /*return*/];
                        }
                    });
                }); });
                context("should succeed", function () { return __awaiter(void 0, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        it("when it's called first time", function () { return __awaiter(void 0, void 0, void 0, function () {
                            var currOwner;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, initializableOwnableWrapper.initialize({ from: owner })];
                                    case 1:
                                        _a.sent();
                                        return [4 /*yield*/, initializableOwnableWrapper.owner()];
                                    case 2:
                                        currOwner = _a.sent();
                                        expect(currOwner).to.equal(owner);
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                        return [2 /*return*/];
                    });
                }); });
                context("should fail", function () { return __awaiter(void 0, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        it("when it's called second time", function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, initializableOwnableWrapper.initialize({ from: owner })];
                                    case 1:
                                        _a.sent();
                                        return [4 /*yield*/, test_helpers_1.expectRevert.unspecified(initializableOwnableWrapper.initialize({ from: user }), "already initialized")];
                                    case 2:
                                        _a.sent();
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
        describe("renounceOwnership", function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                beforeEach("before all", function () { return __awaiter(void 0, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, InitializableOwnableWrapper["new"]()];
                            case 1:
                                initializableOwnableWrapper = _a.sent();
                                return [2 /*return*/];
                        }
                    });
                }); });
                it("should properly clear owner state", function () { return __awaiter(void 0, void 0, void 0, function () {
                    var isCurrOwner;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, initializableOwnableWrapper.initialize({ from: owner })];
                            case 1:
                                _a.sent();
                                return [4 /*yield*/, initializableOwnableWrapper.isOwner({ from: owner })];
                            case 2:
                                isCurrOwner = _a.sent();
                                expect(isCurrOwner).to.equal(true);
                                return [4 /*yield*/, initializableOwnableWrapper.renounceOwnership({ from: owner })];
                            case 3:
                                _a.sent();
                                return [4 /*yield*/, initializableOwnableWrapper.isOwner({ from: owner })];
                            case 4:
                                isCurrOwner = _a.sent();
                                expect(isCurrOwner).to.equal(false);
                                return [2 /*return*/];
                        }
                    });
                }); });
                return [2 /*return*/];
            });
        }); });
        describe("transferOwnership", function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                beforeEach("before all", function () { return __awaiter(void 0, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, InitializableOwnableWrapper["new"]()];
                            case 1:
                                initializableOwnableWrapper = _a.sent();
                                return [2 /*return*/];
                        }
                    });
                }); });
                context("should succeed", function () { return __awaiter(void 0, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        it("when it's called by owner", function () { return __awaiter(void 0, void 0, void 0, function () {
                            var currOwner;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, initializableOwnableWrapper.initialize({ from: owner })];
                                    case 1:
                                        _a.sent();
                                        return [4 /*yield*/, initializableOwnableWrapper.transferOwnership(user, { from: owner })];
                                    case 2:
                                        _a.sent();
                                        return [4 /*yield*/, initializableOwnableWrapper.owner({ from: owner })];
                                    case 3:
                                        currOwner = _a.sent();
                                        expect(currOwner).to.equal(user);
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                        return [2 /*return*/];
                    });
                }); });
                context("should fail", function () { return __awaiter(void 0, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        it("when it's not called by owner", function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, initializableOwnableWrapper.initialize({ from: owner })];
                                    case 1:
                                        _a.sent();
                                        return [4 /*yield*/, (0, test_helpers_1.expectRevert)(initializableOwnableWrapper.transferOwnership(user, { from: user }), "caller is not the owner")];
                                    case 2:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                        it("when new owner is zero address", function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, initializableOwnableWrapper.initialize({ from: owner })];
                                    case 1:
                                        _a.sent();
                                        return [4 /*yield*/, (0, test_helpers_1.expectRevert)(initializableOwnableWrapper.transferOwnership(constants_1.ZERO_ADDRESS, { from: owner }), "new owner is the zero address")];
                                    case 2:
                                        _a.sent();
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
        return [2 /*return*/];
    });
}); });
