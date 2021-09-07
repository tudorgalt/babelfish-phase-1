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
var state_1 = require("../state");
var addresses_1 = require("../addresses");
var constants_1 = require("@utils/constants");
var MAX_VALUE = 1000;
var BassetInstanceDetails = /** @class */ (function () {
    function BassetInstanceDetails() {
    }
    return BassetInstanceDetails;
}());
exports["default"] = (function (_a, deployer, network, accounts) {
    var artifacts = _a.artifacts;
    return __awaiter(void 0, void 0, void 0, function () {
        function upgradeInstance(symbol, addressesForInstance) {
            return __awaiter(this, void 0, void 0, function () {
                var massetFake, massetVersion, tokenAddress, basketManager, basketManagerProxy, initAbi, basketManagerFake, ERC20, _a, _b, promises, existingAssets, addAsset, _loop_1, i, masset, abiInner, massetProxy, abi;
                var _this = this;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0: return [4 /*yield*/, (0, state_1.getDeployed)(MassetV3, symbol + "_MassetProxy")];
                        case 1:
                            massetFake = _c.sent();
                            return [4 /*yield*/, massetFake.getVersion()];
                        case 2:
                            massetVersion = _c.sent();
                            console.log(symbol, ' Masset version: ', massetVersion);
                            if (massetVersion >= '3.0') {
                                console.log('Skipping...');
                                return [2 /*return*/];
                            }
                            return [4 /*yield*/, massetFake.getToken()];
                        case 3:
                            tokenAddress = _c.sent();
                            return [4 /*yield*/, (0, state_1.conditionalDeploy)(BasketManagerV3, symbol + "_BasketManagerV3", function () { return deployer.deploy(BasketManagerV3); })];
                        case 4:
                            basketManager = _c.sent();
                            return [4 /*yield*/, (0, state_1.conditionalDeploy)(BasketManagerProxy, symbol + "_BasketManagerProxy", function () { return deployer.deploy(BasketManagerProxy); })];
                        case 5:
                            basketManagerProxy = _c.sent();
                            initAbi = basketManager.contract.methods['initialize(address)'](massetFake.address).encodeABI();
                            return [4 /*yield*/, (0, state_1.conditionalInitialize)(symbol + "_BasketManagerProxy", function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                                    return [2 /*return*/, basketManagerProxy.initialize(basketManager.address, _admin, initAbi)];
                                }); }); })];
                        case 6:
                            _c.sent();
                            return [4 /*yield*/, BasketManagerV3.at(basketManagerProxy.address)];
                        case 7:
                            basketManagerFake = _c.sent();
                            if (!(network === 'development')) return [3 /*break*/, 11];
                            ERC20 = artifacts.require("ERC20");
                            _a = addressesForInstance;
                            return [4 /*yield*/, ERC20["new"]()];
                        case 8:
                            _b = [(_c.sent()).address];
                            return [4 /*yield*/, ERC20["new"]()];
                        case 9:
                            _b = _b.concat([(_c.sent()).address]);
                            return [4 /*yield*/, ERC20["new"]()];
                        case 10:
                            _a.bassets = _b.concat([(_c.sent()).address]);
                            addressesForInstance.factors = [1, 1, 1];
                            addressesForInstance.bridges = [constants_1.ZERO_ADDRESS, constants_1.ZERO_ADDRESS, constants_1.ZERO_ADDRESS];
                            _c.label = 11;
                        case 11:
                            promises = [];
                            return [4 /*yield*/, basketManagerProxy.admin()];
                        case 12:
                            if (!((_c.sent()) === _admin)) return [3 /*break*/, 19];
                            return [4 /*yield*/, basketManagerFake.getBassets()];
                        case 13:
                            existingAssets = _c.sent();
                            addAsset = function (index) {
                                console.log('adding asset: ', addressesForInstance.bassets[index], addressesForInstance.factors[index], addressesForInstance.bridges[index]);
                                promises.push(basketManagerFake.addBasset(addressesForInstance.bassets[index], addressesForInstance.factors[index], addressesForInstance.bridges[index], 0, MAX_VALUE, false));
                            };
                            _loop_1 = function (i) {
                                if (!existingAssets.find(function (ta) { return ta === addressesForInstance.bassets[i]; })) {
                                    addAsset(i);
                                }
                            };
                            for (i = 0; i < addressesForInstance.bassets.length; i++) {
                                _loop_1(i);
                            }
                            return [4 /*yield*/, Promise.all(promises)];
                        case 14:
                            _c.sent();
                            if (!(network !== 'development')) return [3 /*break*/, 19];
                            return [4 /*yield*/, basketManagerFake.owner()];
                        case 15:
                            if (!((_c.sent()) == default_)) return [3 /*break*/, 17];
                            return [4 /*yield*/, basketManagerFake.transferOwnership(addressesForInstance.multisig)];
                        case 16:
                            _c.sent();
                            _c.label = 17;
                        case 17: return [4 /*yield*/, basketManagerProxy.changeAdmin(addressesForInstance.multisig, { from: _admin })];
                        case 18:
                            _c.sent();
                            _c.label = 19;
                        case 19: return [4 /*yield*/, (0, state_1.conditionalDeploy)(MassetV3, symbol + "_MassetV3", function () { return deployer.deploy(MassetV3); })];
                        case 20:
                            masset = _c.sent();
                            abiInner = masset.contract.methods['upgradeToV3(address,address)'](basketManager.address, tokenAddress).encodeABI();
                            return [4 /*yield*/, MassetProxy.at(massetFake.address)];
                        case 21:
                            massetProxy = _c.sent();
                            abi = massetProxy.contract.methods['upgradeToAndCall(address,bytes)'](masset.address, abiInner).encodeABI();
                            console.log('ABI for upgrade: ', abi);
                            return [2 /*return*/];
                    }
                });
            });
        }
        var BasketManagerV3, BasketManagerProxy, MassetV3, MassetProxy, default_, _admin, addressesForNetwork;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    BasketManagerV3 = artifacts.require("BasketManagerV3");
                    BasketManagerProxy = artifacts.require("BasketManagerProxy");
                    MassetV3 = artifacts.require("MassetV3");
                    MassetProxy = artifacts.require("MassetProxy");
                    default_ = accounts[0], _admin = accounts[1];
                    addressesForNetwork = addresses_1["default"][deployer.network];
                    return [4 /*yield*/, upgradeInstance('ETHs', addressesForNetwork.ETHs)];
                case 1:
                    _b.sent();
                    return [4 /*yield*/, upgradeInstance('XUSD', addressesForNetwork.XUSD)];
                case 2:
                    _b.sent();
                    return [4 /*yield*/, upgradeInstance('BNBs', addressesForNetwork.BNBs)];
                case 3:
                    _b.sent();
                    (0, state_1.printState)();
                    return [2 /*return*/];
            }
        });
    });
});
