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
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-use-before-define */
var test_helpers_1 = require("@openzeppelin/test-helpers");
var constants_1 = require("@utils/constants");
var standardAccounts_1 = require("@utils/standardAccounts");
var env_setup_1 = require("@utils/env_setup");
var expect = env_setup_1["default"].configure().expect;
var BasketManager = artifacts.require("BasketManager");
var Masset = artifacts.require("Masset");
var MockERC20 = artifacts.require("MockERC20");
contract("BasketManager", function (accounts) { return __awaiter(void 0, void 0, void 0, function () {
    var sa;
    return __generator(this, function (_a) {
        sa = new standardAccounts_1.StandardAccounts(accounts);
        before("before all", function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/];
        }); }); });
        describe("constructor", function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                it("should succeed", function () { return __awaiter(void 0, void 0, void 0, function () {
                    var inst;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, Masset["new"]()];
                            case 1:
                                inst = _a.sent();
                                return [2 /*return*/];
                        }
                    });
                }); });
                return [2 /*return*/];
            });
        }); });
        describe("initialize", function () { return __awaiter(void 0, void 0, void 0, function () {
            var masset, mockToken1, mockToken2, mockToken3, mockToken4, bassets, factors, bridges;
            return __generator(this, function (_a) {
                before(function () { return __awaiter(void 0, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, Masset["new"]()];
                            case 1:
                                masset = _a.sent();
                                return [4 /*yield*/, MockERC20["new"]("", "", 18, sa.dummy1, 1)];
                            case 2:
                                mockToken1 = _a.sent();
                                return [4 /*yield*/, MockERC20["new"]("", "", 18, sa.dummy1, 1)];
                            case 3:
                                mockToken2 = _a.sent();
                                return [4 /*yield*/, MockERC20["new"]("", "", 18, sa.dummy1, 1)];
                            case 4:
                                mockToken3 = _a.sent();
                                return [4 /*yield*/, MockERC20["new"]("", "", 18, sa.dummy1, 1)];
                            case 5:
                                mockToken4 = _a.sent();
                                bassets = [mockToken1.address, mockToken2.address, mockToken3.address];
                                bridges = [constants_1.ZERO_ADDRESS, constants_1.ZERO_ADDRESS, constants_1.ZERO_ADDRESS];
                                factors = [1, 1, 1];
                                return [2 /*return*/];
                        }
                    });
                }); });
                context("should succeed", function () { return __awaiter(void 0, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        it("when given all the params", function () { return __awaiter(void 0, void 0, void 0, function () {
                            var inst;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, BasketManager["new"](bassets, factors, bridges)];
                                    case 1:
                                        inst = _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                        return [2 /*return*/];
                    });
                }); });
                context("should fail", function () { return __awaiter(void 0, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        it("when bassets missing", function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, (0, test_helpers_1.expectRevert)(BasketManager["new"]([], factors, bridges), "VM Exception while processing transaction: reverted with reason string 'some basset required'")];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                        it("when factors missing", function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, (0, test_helpers_1.expectRevert)(BasketManager["new"](bassets, [], bridges), "VM Exception while processing transaction: reverted with reason string 'factor array length mismatch'")];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                        return [2 /*return*/];
                    });
                }); });
                context("checking if bassets are valid", function () {
                    var inst;
                    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, BasketManager["new"](bassets, factors, bridges)];
                                case 1:
                                    inst = _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    }); });
                    context("isValidBasset", function () {
                        it("should return false if basset is in the basket", function () { return __awaiter(void 0, void 0, void 0, function () {
                            var _a, _b, _c;
                            return __generator(this, function (_d) {
                                switch (_d.label) {
                                    case 0:
                                        _a = expect;
                                        return [4 /*yield*/, inst.isValidBasset(mockToken1.address)];
                                    case 1:
                                        _a.apply(void 0, [_d.sent()]).to.equal(true);
                                        _b = expect;
                                        return [4 /*yield*/, inst.isValidBasset(mockToken2.address)];
                                    case 2:
                                        _b.apply(void 0, [_d.sent()]).to.equal(true);
                                        _c = expect;
                                        return [4 /*yield*/, inst.isValidBasset(mockToken3.address)];
                                    case 3:
                                        _c.apply(void 0, [_d.sent()]).to.equal(true);
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                        it("should return true if basset is not in the basket", function () { return __awaiter(void 0, void 0, void 0, function () {
                            var _a, _b;
                            return __generator(this, function (_c) {
                                switch (_c.label) {
                                    case 0:
                                        _a = expect;
                                        return [4 /*yield*/, inst.isValidBasset(constants_1.ZERO_ADDRESS)];
                                    case 1:
                                        _a.apply(void 0, [_c.sent()]).to.equal(false);
                                        _b = expect;
                                        return [4 /*yield*/, inst.isValidBasset(mockToken4.address)];
                                    case 2:
                                        _b.apply(void 0, [_c.sent()]).to.equal(false);
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                    });
                    context("checkBasketBalanceForDeposit", function () {
                        it("should return false if basset is in the basket", function () { return __awaiter(void 0, void 0, void 0, function () {
                            var _a, _b, _c;
                            return __generator(this, function (_d) {
                                switch (_d.label) {
                                    case 0:
                                        _a = expect;
                                        return [4 /*yield*/, inst.isValidBasset(mockToken1.address)];
                                    case 1:
                                        _a.apply(void 0, [_d.sent()]).to.equal(true);
                                        _b = expect;
                                        return [4 /*yield*/, inst.isValidBasset(mockToken2.address)];
                                    case 2:
                                        _b.apply(void 0, [_d.sent()]).to.equal(true);
                                        _c = expect;
                                        return [4 /*yield*/, inst.isValidBasset(mockToken3.address)];
                                    case 3:
                                        _c.apply(void 0, [_d.sent()]).to.equal(true);
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                        it("should return true if basset is not in the basket", function () { return __awaiter(void 0, void 0, void 0, function () {
                            var _a, _b;
                            return __generator(this, function (_c) {
                                switch (_c.label) {
                                    case 0:
                                        _a = expect;
                                        return [4 /*yield*/, inst.isValidBasset(constants_1.ZERO_ADDRESS)];
                                    case 1:
                                        _a.apply(void 0, [_c.sent()]).to.equal(false);
                                        _b = expect;
                                        return [4 /*yield*/, inst.isValidBasset(mockToken4.address)];
                                    case 2:
                                        _b.apply(void 0, [_c.sent()]).to.equal(false);
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                    });
                    context("checkBasketBalanceForWithdrawal", function () {
                        it("should return false if basset is in the basket", function () { return __awaiter(void 0, void 0, void 0, function () {
                            var _a, _b, _c;
                            return __generator(this, function (_d) {
                                switch (_d.label) {
                                    case 0:
                                        _a = expect;
                                        return [4 /*yield*/, inst.isValidBasset(mockToken1.address)];
                                    case 1:
                                        _a.apply(void 0, [_d.sent()]).to.equal(true);
                                        _b = expect;
                                        return [4 /*yield*/, inst.isValidBasset(mockToken2.address)];
                                    case 2:
                                        _b.apply(void 0, [_d.sent()]).to.equal(true);
                                        _c = expect;
                                        return [4 /*yield*/, inst.isValidBasset(mockToken3.address)];
                                    case 3:
                                        _c.apply(void 0, [_d.sent()]).to.equal(true);
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                        it("should return true if basset is not in the basket", function () { return __awaiter(void 0, void 0, void 0, function () {
                            var _a, _b;
                            return __generator(this, function (_c) {
                                switch (_c.label) {
                                    case 0:
                                        _a = expect;
                                        return [4 /*yield*/, inst.isValidBasset(constants_1.ZERO_ADDRESS)];
                                    case 1:
                                        _a.apply(void 0, [_c.sent()]).to.equal(false);
                                        _b = expect;
                                        return [4 /*yield*/, inst.isValidBasset(mockToken4.address)];
                                    case 2:
                                        _b.apply(void 0, [_c.sent()]).to.equal(false);
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                    });
                });
                return [2 /*return*/];
            });
        }); });
        return [2 /*return*/];
    });
}); });
