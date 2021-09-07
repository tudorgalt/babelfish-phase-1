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
var web3_utils_1 = require("web3-utils");
var test_helpers_1 = require("@openzeppelin/test-helpers");
var tools_1 = require("@utils/tools");
var env_setup_1 = require("@utils/env_setup");
var constants_1 = require("@utils/constants");
var standardAccounts_1 = require("@utils/standardAccounts");
var MockERC20 = artifacts.require("MockERC20");
var BasketManagerV3 = artifacts.require("BasketManagerV3");
var expect = env_setup_1["default"].configure().expect;
var tokens = function (amount) { return (0, web3_utils_1.toWei)(new tools_1.BN(amount), 'ether'); };
contract("BasketManagerV3", function (accounts) { return __awaiter(void 0, void 0, void 0, function () {
    var owner, user, massetMock, sa, factors, mins, maxs, pauses, bridges, basketManager, mockToken1, mockToken2;
    return __generator(this, function (_a) {
        owner = accounts[0], user = accounts[1], massetMock = accounts[2];
        sa = new standardAccounts_1.StandardAccounts(accounts);
        factors = [1, 1];
        mins = [10, 10];
        maxs = [100, 100];
        pauses = [false, false];
        bridges = [constants_1.ZERO_ADDRESS, constants_1.ZERO_ADDRESS];
        before("before all", function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, BasketManagerV3["new"]()];
                    case 1:
                        basketManager = _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        describe("checkBasketBalanceForDeposit", function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                beforeEach("before each", function () { return __awaiter(void 0, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, BasketManagerV3["new"]({ from: owner })];
                            case 1:
                                basketManager = _a.sent();
                                return [4 /*yield*/, MockERC20["new"]("", "", 18, sa.dummy1, tokens(100), { from: owner })];
                            case 2:
                                mockToken1 = _a.sent();
                                return [4 /*yield*/, MockERC20["new"]("", "", 18, sa.dummy1, tokens(100), { from: owner })];
                            case 3:
                                mockToken2 = _a.sent();
                                return [4 /*yield*/, basketManager.initialize(massetMock, { from: owner })];
                            case 4:
                                _a.sent();
                                return [2 /*return*/];
                        }
                    });
                }); });
                context("should fail", function () { return __awaiter(void 0, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        it("when Basset is not valid", function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, (0, test_helpers_1.expectRevert)(basketManager.checkBasketBalanceForDeposit(mockToken1.address, tokens(10)), "VM Exception while processing transaction: reverted with reason string 'invalid basset'")];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                        it("when Basset is paused", function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, basketManager.addBasset(mockToken1.address, 1, constants_1.ZERO_ADDRESS, 10, 100, true, { from: owner })];
                                    case 1:
                                        _a.sent();
                                        return [4 /*yield*/, (0, test_helpers_1.expectRevert)(basketManager.checkBasketBalanceForDeposit(mockToken1.address, tokens(10)), "VM Exception while processing transaction: reverted with reason string 'basset is paused'")];
                                    case 2:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                        return [2 /*return*/];
                    });
                }); });
                context("should succeed", function () { return __awaiter(void 0, void 0, void 0, function () {
                    var bassets;
                    return __generator(this, function (_a) {
                        beforeEach("before each", function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        bassets = [mockToken1.address, mockToken2.address];
                                        return [4 /*yield*/, basketManager.addBassets(bassets, factors, bridges, mins, maxs, pauses, { from: owner })];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                        context("should return true", function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                it("when basket balance is sufficient", function () { return __awaiter(void 0, void 0, void 0, function () {
                                    var result;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, mockToken1.giveMe(tokens(1), { from: massetMock })];
                                            case 1:
                                                _a.sent();
                                                return [4 /*yield*/, mockToken2.giveMe(tokens(100), { from: massetMock })];
                                            case 2:
                                                _a.sent();
                                                return [4 /*yield*/, basketManager.checkBasketBalanceForDeposit(bassets[0], tokens(1))];
                                            case 3:
                                                result = _a.sent();
                                                expect(result).to.equal(true);
                                                return [2 /*return*/];
                                        }
                                    });
                                }); });
                                return [2 /*return*/];
                            });
                        }); });
                        context("should return false", function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                it("when basket balance is not sufficient", function () { return __awaiter(void 0, void 0, void 0, function () {
                                    var result;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, basketManager.checkBasketBalanceForDeposit(bassets[0], 10)];
                                            case 1:
                                                result = _a.sent();
                                                expect(result).to.equal(false);
                                                return [2 /*return*/];
                                        }
                                    });
                                }); });
                                it("with ratio bigger than max", function () { return __awaiter(void 0, void 0, void 0, function () {
                                    var result;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, mockToken1.giveMe(tokens(10), { from: massetMock })];
                                            case 1:
                                                _a.sent();
                                                return [4 /*yield*/, mockToken2.giveMe(tokens(10), { from: massetMock })];
                                            case 2:
                                                _a.sent();
                                                return [4 /*yield*/, basketManager.checkBasketBalanceForDeposit(bassets[0], tokens(1))];
                                            case 3:
                                                result = _a.sent();
                                                expect(result).to.equal(false);
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
        describe("checkBasketBalanceForWithdrawal", function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                beforeEach("before each", function () { return __awaiter(void 0, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, MockERC20["new"]("", "", 18, sa.dummy1, tokens(100), { from: owner })];
                            case 1:
                                mockToken1 = _a.sent();
                                return [4 /*yield*/, MockERC20["new"]("", "", 18, sa.dummy1, tokens(100), { from: owner })];
                            case 2:
                                mockToken2 = _a.sent();
                                return [4 /*yield*/, BasketManagerV3["new"]({ from: owner })];
                            case 3:
                                basketManager = _a.sent();
                                return [4 /*yield*/, basketManager.initialize(massetMock, { from: owner })];
                            case 4:
                                _a.sent();
                                return [2 /*return*/];
                        }
                    });
                }); });
                context("should fail", function () { return __awaiter(void 0, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        it("when Basset is not valid", function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, (0, test_helpers_1.expectRevert)(basketManager.checkBasketBalanceForWithdrawal(mockToken1.address, tokens(10)), "VM Exception while processing transaction: reverted with reason string 'invalid basset'")];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                        it("when Basset is paused", function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, basketManager.addBasset(mockToken1.address, 1, constants_1.ZERO_ADDRESS, 10, 100, true, { from: owner })];
                                    case 1:
                                        _a.sent();
                                        return [4 /*yield*/, (0, test_helpers_1.expectRevert)(basketManager.checkBasketBalanceForWithdrawal(mockToken1.address, tokens(10)), "VM Exception while processing transaction: reverted with reason string 'basset is paused'")];
                                    case 2:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                        it("when Basset balance is not sufficient", function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, basketManager.addBasset(mockToken1.address, 1, constants_1.ZERO_ADDRESS, 10, 100, false, { from: owner })];
                                    case 1:
                                        _a.sent();
                                        return [4 /*yield*/, (0, test_helpers_1.expectRevert)(basketManager.checkBasketBalanceForWithdrawal(mockToken1.address, tokens(10)), "VM Exception while processing transaction: reverted with reason string 'basset balance is not sufficient'")];
                                    case 2:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                        return [2 /*return*/];
                    });
                }); });
                context("should succeed", function () { return __awaiter(void 0, void 0, void 0, function () {
                    var bassets;
                    return __generator(this, function (_a) {
                        beforeEach("before each", function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        bassets = [mockToken1.address, mockToken2.address];
                                        return [4 /*yield*/, basketManager.addBassets(bassets, factors, bridges, mins, maxs, pauses, { from: owner })];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                        context("should return true", function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                it("with proper calculated ratio", function () { return __awaiter(void 0, void 0, void 0, function () {
                                    var result;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, mockToken1.giveMe(tokens(1000), { from: massetMock })];
                                            case 1:
                                                _a.sent();
                                                return [4 /*yield*/, mockToken2.giveMe(tokens(10), { from: massetMock })];
                                            case 2:
                                                _a.sent();
                                                return [4 /*yield*/, basketManager.checkBasketBalanceForWithdrawal(bassets[0], tokens(10))];
                                            case 3:
                                                result = _a.sent();
                                                expect(result).to.equal(true);
                                                return [2 /*return*/];
                                        }
                                    });
                                }); });
                                it('with zero minimum and full withdrawal', function () { return __awaiter(void 0, void 0, void 0, function () {
                                    var result;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, mockToken1.giveMe(tokens(10), { from: massetMock })];
                                            case 1:
                                                _a.sent();
                                                return [4 /*yield*/, basketManager.setRange(bassets[0], 0, 1000, { from: owner })];
                                            case 2:
                                                _a.sent();
                                                return [4 /*yield*/, basketManager.checkBasketBalanceForWithdrawal(bassets[0], tokens(10))];
                                            case 3:
                                                result = _a.sent();
                                                expect(result).to.equal(true);
                                                return [2 /*return*/];
                                        }
                                    });
                                }); });
                                return [2 /*return*/];
                            });
                        }); });
                        context("should return false", function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                it("with ratio smaller than min", function () { return __awaiter(void 0, void 0, void 0, function () {
                                    var result;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, mockToken1.giveMe(tokens(10), { from: massetMock })];
                                            case 1:
                                                _a.sent();
                                                return [4 /*yield*/, mockToken2.giveMe(tokens(1000), { from: massetMock })];
                                            case 2:
                                                _a.sent();
                                                return [4 /*yield*/, basketManager.checkBasketBalanceForWithdrawal(bassets[0], tokens(10))];
                                            case 3:
                                                result = _a.sent();
                                                expect(result).to.equal(false);
                                                return [2 /*return*/];
                                        }
                                    });
                                }); });
                                it('with non-zero minimum and full withdrawal', function () { return __awaiter(void 0, void 0, void 0, function () {
                                    var result;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, mockToken1.giveMe(tokens(10), { from: massetMock })];
                                            case 1:
                                                _a.sent();
                                                return [4 /*yield*/, basketManager.setRange(bassets[0], 10, 1000, { from: owner })];
                                            case 2:
                                                _a.sent();
                                                return [4 /*yield*/, basketManager.checkBasketBalanceForWithdrawal(bassets[0], tokens(10))];
                                            case 3:
                                                result = _a.sent();
                                                expect(result).to.equal(false);
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
        describe("convertBassetToMassetQuantity", function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                context("should fail", function () { return __awaiter(void 0, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        it("when Basset is invalid", function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, MockERC20["new"]("", "", 18, sa.dummy1, tokens(100), { from: owner })];
                                    case 1:
                                        mockToken1 = _a.sent();
                                        return [4 /*yield*/, (0, test_helpers_1.expectRevert)(basketManager.convertBassetToMassetQuantity(mockToken1.address, tokens(10)), "VM Exception while processing transaction: reverted with reason string 'invalid basset'")];
                                    case 2:
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
                        beforeEach("before each", function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, MockERC20["new"]("", "", 18, sa.dummy1, tokens(100), { from: owner })];
                                    case 1:
                                        mockToken1 = _a.sent();
                                        return [4 /*yield*/, BasketManagerV3["new"]({ from: owner })];
                                    case 2:
                                        basketManager = _a.sent();
                                        return [4 /*yield*/, basketManager.initialize(massetMock, { from: owner })];
                                    case 3:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                        it("works fine with factor equal 1", function () { return __awaiter(void 0, void 0, void 0, function () {
                            var massetAmount, expectedMassetAmount;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, basketManager.addBasset(mockToken1.address, 1, constants_1.ZERO_ADDRESS, 10, 100, false, { from: owner })];
                                    case 1:
                                        _a.sent();
                                        return [4 /*yield*/, basketManager.convertBassetToMassetQuantity(mockToken1.address, tokens(10))];
                                    case 2:
                                        massetAmount = _a.sent();
                                        expectedMassetAmount = tokens(10);
                                        expect(massetAmount).bignumber.to.eq(expectedMassetAmount);
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                        it("works fine with positive factor", function () { return __awaiter(void 0, void 0, void 0, function () {
                            var factor, massetAmount, expectedMassetAmount;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        factor = 10;
                                        return [4 /*yield*/, basketManager.addBasset(mockToken1.address, factor, constants_1.ZERO_ADDRESS, 10, 100, false, { from: owner })];
                                    case 1:
                                        _a.sent();
                                        return [4 /*yield*/, basketManager.convertBassetToMassetQuantity(mockToken1.address, tokens(100))];
                                    case 2:
                                        massetAmount = _a.sent();
                                        expectedMassetAmount = tokens(100).div(new tools_1.BN(factor));
                                        expect(massetAmount).bignumber.to.eq(expectedMassetAmount);
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                        it("works fine with negative factor", function () { return __awaiter(void 0, void 0, void 0, function () {
                            var factor, massetAmount, expectedMassetAmount;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        factor = -10;
                                        return [4 /*yield*/, basketManager.addBasset(mockToken1.address, factor, constants_1.ZERO_ADDRESS, 10, 100, false, { from: owner })];
                                    case 1:
                                        _a.sent();
                                        return [4 /*yield*/, basketManager.convertBassetToMassetQuantity(mockToken1.address, tokens(100))];
                                    case 2:
                                        massetAmount = _a.sent();
                                        expectedMassetAmount = tokens(100).mul(new tools_1.BN(-factor));
                                        expect(massetAmount).bignumber.to.eq(expectedMassetAmount);
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
        describe("convertMassetToBassetQuantity", function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                context("should fail", function () { return __awaiter(void 0, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        it("when Basset is invalid", function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, MockERC20["new"]("", "", 18, sa.dummy1, tokens(100), { from: owner })];
                                    case 1:
                                        mockToken1 = _a.sent();
                                        return [4 /*yield*/, (0, test_helpers_1.expectRevert)(basketManager.convertMassetToBassetQuantity(mockToken1.address, tokens(10)), "VM Exception while processing transaction: reverted with reason string 'invalid basset'")];
                                    case 2:
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
                        beforeEach("before each", function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, MockERC20["new"]("", "", 18, sa.dummy1, tokens(100), { from: owner })];
                                    case 1:
                                        mockToken1 = _a.sent();
                                        return [4 /*yield*/, BasketManagerV3["new"]({ from: owner })];
                                    case 2:
                                        basketManager = _a.sent();
                                        return [4 /*yield*/, basketManager.initialize(massetMock, { from: owner })];
                                    case 3:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                        it("works fine with factor equal 1", function () { return __awaiter(void 0, void 0, void 0, function () {
                            var bassetAmount, expectedBassetAmount;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, basketManager.addBasset(mockToken1.address, 1, constants_1.ZERO_ADDRESS, 10, 100, false, { from: owner })];
                                    case 1:
                                        _a.sent();
                                        return [4 /*yield*/, basketManager.convertMassetToBassetQuantity(mockToken1.address, tokens(10))];
                                    case 2:
                                        bassetAmount = _a.sent();
                                        expectedBassetAmount = tokens(10);
                                        expect(bassetAmount).bignumber.to.eq(expectedBassetAmount);
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                        it("works fine with positive factor", function () { return __awaiter(void 0, void 0, void 0, function () {
                            var factor, bassetAmount, expectedBassetAmount;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        factor = 10;
                                        return [4 /*yield*/, basketManager.addBasset(mockToken1.address, factor, constants_1.ZERO_ADDRESS, 10, 100, false, { from: owner })];
                                    case 1:
                                        _a.sent();
                                        return [4 /*yield*/, basketManager.convertMassetToBassetQuantity(mockToken1.address, tokens(100))];
                                    case 2:
                                        bassetAmount = _a.sent();
                                        expectedBassetAmount = tokens(100).mul(new tools_1.BN(factor));
                                        expect(bassetAmount).bignumber.to.eq(expectedBassetAmount);
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                        it("works fine with negative factor", function () { return __awaiter(void 0, void 0, void 0, function () {
                            var factor, bassetAmount, expectedBassetAmount;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        factor = -10;
                                        return [4 /*yield*/, basketManager.addBasset(mockToken1.address, factor, constants_1.ZERO_ADDRESS, 10, 100, false, { from: owner })];
                                    case 1:
                                        _a.sent();
                                        return [4 /*yield*/, basketManager.convertMassetToBassetQuantity(mockToken1.address, tokens(100))];
                                    case 2:
                                        bassetAmount = _a.sent();
                                        expectedBassetAmount = tokens(100).div(new tools_1.BN(-factor));
                                        expect(bassetAmount).bignumber.to.eq(expectedBassetAmount);
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
        describe("getTotalMassetBalance", function () { return __awaiter(void 0, void 0, void 0, function () {
            var bassets;
            return __generator(this, function (_a) {
                beforeEach("before each", function () { return __awaiter(void 0, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, MockERC20["new"]("", "", 18, sa.dummy1, tokens(100), { from: owner })];
                            case 1:
                                mockToken1 = _a.sent();
                                return [4 /*yield*/, MockERC20["new"]("", "", 18, sa.dummy1, tokens(100), { from: owner })];
                            case 2:
                                mockToken2 = _a.sent();
                                bassets = [mockToken1.address, mockToken2.address];
                                return [4 /*yield*/, BasketManagerV3["new"]({ from: owner })];
                            case 3:
                                basketManager = _a.sent();
                                return [4 /*yield*/, basketManager.initialize(massetMock, { from: owner })];
                            case 4:
                                _a.sent();
                                return [2 /*return*/];
                        }
                    });
                }); });
                it("returns 0 with no bassets", function () { return __awaiter(void 0, void 0, void 0, function () {
                    var totalBalance;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, basketManager.getTotalMassetBalance()];
                            case 1:
                                totalBalance = _a.sent();
                                expect(totalBalance).bignumber.to.eq(constants_1.ZERO);
                                return [2 /*return*/];
                        }
                    });
                }); });
                it("returns 0 with empty balance of bassets", function () { return __awaiter(void 0, void 0, void 0, function () {
                    var totalBalance;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, basketManager.addBassets(bassets, factors, bridges, mins, maxs, pauses, { from: owner })];
                            case 1:
                                _a.sent();
                                return [4 /*yield*/, basketManager.getTotalMassetBalance()];
                            case 2:
                                totalBalance = _a.sent();
                                expect(totalBalance).bignumber.to.eq(constants_1.ZERO);
                                return [2 /*return*/];
                        }
                    });
                }); });
                it("properly calculates total Masset balance", function () { return __awaiter(void 0, void 0, void 0, function () {
                    var expectedTotalBalance, totalBalance;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, basketManager.addBassets(bassets, factors, bridges, mins, maxs, pauses, { from: owner })];
                            case 1:
                                _a.sent();
                                return [4 /*yield*/, mockToken1.giveMe(tokens(10), { from: massetMock })];
                            case 2:
                                _a.sent();
                                return [4 /*yield*/, mockToken2.giveMe(tokens(1000), { from: massetMock })];
                            case 3:
                                _a.sent();
                                expectedTotalBalance = tokens(10).add(tokens(1000));
                                return [4 /*yield*/, basketManager.getTotalMassetBalance()];
                            case 4:
                                totalBalance = _a.sent();
                                expect(totalBalance).bignumber.to.eq(expectedTotalBalance);
                                return [2 /*return*/];
                        }
                    });
                }); });
                return [2 /*return*/];
            });
        }); });
        describe("addBasset", function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                beforeEach("before each", function () { return __awaiter(void 0, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, MockERC20["new"]("", "", 18, sa.dummy1, tokens(100), { from: owner })];
                            case 1:
                                mockToken1 = _a.sent();
                                return [4 /*yield*/, BasketManagerV3["new"]({ from: owner })];
                            case 2:
                                basketManager = _a.sent();
                                return [4 /*yield*/, basketManager.initialize(massetMock, { from: owner })];
                            case 3:
                                _a.sent();
                                return [2 /*return*/];
                        }
                    });
                }); });
                context("should fail", function () { return __awaiter(void 0, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        it("when it's not called by the owner", function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, (0, test_helpers_1.expectRevert)(basketManager.addBasset(mockToken1.address, 1, constants_1.ZERO_ADDRESS, 10, 100, false, { from: user }), "VM Exception while processing transaction: reverted with reason string 'InitializableOwnable: caller is not the owner'")];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                        it("when basset is zero address", function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, (0, test_helpers_1.expectRevert)(basketManager.addBasset(constants_1.ZERO_ADDRESS, 1, constants_1.ZERO_ADDRESS, 10, 100, false, { from: owner }), "VM Exception while processing transaction: reverted with reason string 'invalid basset address'")];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                        it("when basset already exists", function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, basketManager.addBasset(mockToken1.address, 1, constants_1.ZERO_ADDRESS, 10, 100, false, { from: owner })];
                                    case 1:
                                        _a.sent();
                                        return [4 /*yield*/, (0, test_helpers_1.expectRevert)(basketManager.addBasset(mockToken1.address, 1, constants_1.ZERO_ADDRESS, 10, 100, false, { from: owner }), "VM Exception while processing transaction: reverted with reason string 'basset already exists'")];
                                    case 2:
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
                        it("with all valid params", function () { return __awaiter(void 0, void 0, void 0, function () {
                            var _a, min, max, _b, _c, _d;
                            return __generator(this, function (_e) {
                                switch (_e.label) {
                                    case 0: return [4 /*yield*/, basketManager.addBasset(mockToken1.address, 1, constants_1.ZERO_ADDRESS, 10, 100, false, { from: owner })];
                                    case 1:
                                        _e.sent();
                                        return [4 /*yield*/, basketManager.getRange(mockToken1.address)];
                                    case 2:
                                        _a = _e.sent(), min = _a[0], max = _a[1];
                                        expect(min.toString()).to.equal('10');
                                        expect(max.toString()).to.equal('100');
                                        _b = expect;
                                        return [4 /*yield*/, basketManager.getFactor(mockToken1.address)];
                                    case 3:
                                        _b.apply(void 0, [(_e.sent()).toString()]).to.equal('1');
                                        _c = expect;
                                        return [4 /*yield*/, basketManager.getBridge(mockToken1.address)];
                                    case 4:
                                        _c.apply(void 0, [(_e.sent()).toString()]).to.equal(constants_1.ZERO_ADDRESS);
                                        _d = expect;
                                        return [4 /*yield*/, basketManager.getPaused(mockToken1.address)];
                                    case 5:
                                        _d.apply(void 0, [(_e.sent())]).to.equal(false);
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
        describe("setFactor", function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                beforeEach("before each", function () { return __awaiter(void 0, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, BasketManagerV3["new"]({ from: owner })];
                            case 1:
                                basketManager = _a.sent();
                                return [4 /*yield*/, MockERC20["new"]("", "", 18, sa.dummy1, tokens(100), { from: owner })];
                            case 2:
                                mockToken1 = _a.sent();
                                return [4 /*yield*/, basketManager.initialize(massetMock, { from: owner })];
                            case 3:
                                _a.sent();
                                return [4 /*yield*/, basketManager.addBasset(mockToken1.address, 1, constants_1.ZERO_ADDRESS, 10, 100, false, { from: owner })];
                            case 4:
                                _a.sent();
                                return [2 /*return*/];
                        }
                    });
                }); });
                context("should fail", function () { return __awaiter(void 0, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        it("when factor is zero", function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, (0, test_helpers_1.expectRevert)(basketManager.setFactor(mockToken1.address, 0, { from: owner }), "VM Exception while processing transaction: reverted with reason string 'invalid factor'")];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                        it("when factor is not a power of 10", function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, (0, test_helpers_1.expectRevert)(basketManager.setFactor(mockToken1.address, 2, { from: owner }), "VM Exception while processing transaction: reverted with reason string 'factor must be power of 10'")];
                                    case 1:
                                        _a.sent();
                                        return [4 /*yield*/, (0, test_helpers_1.expectRevert)(basketManager.setFactor(mockToken1.address, 110, { from: owner }), "VM Exception while processing transaction: reverted with reason string 'factor must be power of 10'")];
                                    case 2:
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
                        it("when factor is 1", function () { return __awaiter(void 0, void 0, void 0, function () {
                            var factor, setFactor;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        factor = new tools_1.BN('1');
                                        return [4 /*yield*/, basketManager.setFactor(mockToken1.address, factor, { from: owner })];
                                    case 1:
                                        _a.sent();
                                        return [4 /*yield*/, basketManager.getFactor(mockToken1.address)];
                                    case 2:
                                        setFactor = _a.sent();
                                        expect(setFactor.eq(factor)).to.equal(true);
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                        it("when factor is a power of 10", function () { return __awaiter(void 0, void 0, void 0, function () {
                            var factor, setFactor;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        factor = new tools_1.BN('1000');
                                        return [4 /*yield*/, basketManager.setFactor(mockToken1.address, factor, { from: owner })];
                                    case 1:
                                        _a.sent();
                                        return [4 /*yield*/, basketManager.getFactor(mockToken1.address)];
                                    case 2:
                                        setFactor = _a.sent();
                                        expect(setFactor.eq(factor)).to.equal(true);
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                        it("when factor is negative", function () { return __awaiter(void 0, void 0, void 0, function () {
                            var factor, setFactor;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        factor = new tools_1.BN('-100000');
                                        return [4 /*yield*/, basketManager.setFactor(mockToken1.address, factor, { from: owner })];
                                    case 1:
                                        _a.sent();
                                        return [4 /*yield*/, basketManager.getFactor(mockToken1.address)];
                                    case 2:
                                        setFactor = _a.sent();
                                        expect(setFactor.eq(factor)).to.equal(true);
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
        describe("removeBasset", function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                beforeEach("before each", function () { return __awaiter(void 0, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, BasketManagerV3["new"]({ from: owner })];
                            case 1:
                                basketManager = _a.sent();
                                return [4 /*yield*/, MockERC20["new"]("", "", 18, sa.dummy1, tokens(100), { from: owner })];
                            case 2:
                                mockToken1 = _a.sent();
                                return [4 /*yield*/, basketManager.initialize(massetMock, { from: owner })];
                            case 3:
                                _a.sent();
                                return [4 /*yield*/, basketManager.addBasset(mockToken1.address, 1, constants_1.ZERO_ADDRESS, 10, 100, false, { from: owner })];
                            case 4:
                                _a.sent();
                                return [2 /*return*/];
                        }
                    });
                }); });
                context("should fail", function () { return __awaiter(void 0, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        it("when it's not called by the owner", function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, (0, test_helpers_1.expectRevert)(basketManager.removeBasset(mockToken1.address, { from: user }), "VM Exception while processing transaction: reverted with reason string 'InitializableOwnable: caller is not the owner'")];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                        it("when balance is not empty", function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, mockToken1.giveMe(tokens(10), { from: massetMock })];
                                    case 1:
                                        _a.sent();
                                        return [4 /*yield*/, (0, test_helpers_1.expectRevert)(basketManager.removeBasset(mockToken1.address, { from: owner }), "VM Exception while processing transaction: reverted with reason string 'balance not zero'")];
                                    case 2:
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
                        it("with all valid params", function () { return __awaiter(void 0, void 0, void 0, function () {
                            var isValid;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, basketManager.removeBasset(mockToken1.address, { from: owner })];
                                    case 1:
                                        _a.sent();
                                        return [4 /*yield*/, basketManager.isValidBasset(mockToken1.address)];
                                    case 2:
                                        isValid = _a.sent();
                                        expect(isValid).to.equal(false);
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
