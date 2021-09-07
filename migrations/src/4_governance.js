"use strict";
/* eslint-disable @typescript-eslint/triple-slash-reference,spaced-comment */
/// <reference path="../../types/generated/index.d.ts" />
/// <reference path="../../types/generated/types.d.ts" />
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
var tools_1 = require("@utils/tools");
var state_1 = require("../state");
exports["default"] = (function (_a, deployer, network, accounts) {
    var artifacts = _a.artifacts, web3 = _a.web3;
    return __awaiter(void 0, void 0, void 0, function () {
        var default_, FishToken, MultiSigWallet, Staking, StakingProxy, VestingLogic, VestingFactory, VestingRegistry3, Timelock, TimelockMock, GovernorAlpha, GovernorAlphaMock, initialAmount, timelockDelay, quorumPercentageVotes, majorityPercentageVotes, feeSharingAddress, multiSigWalletOwners, multiSigWalletRequiredConfirmations, fishToken, multiSigWallet, stakingLogic, stakingProxy, staking, vestingLogic, vestingFactory, timelockContract, timelock, governorAlphaContract, governorAlpha;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    default_ = accounts[0];
                    FishToken = artifacts.require("Fish");
                    MultiSigWallet = artifacts.require("MultiSigWallet");
                    Staking = artifacts.require("Staking");
                    StakingProxy = artifacts.require("StakingProxy");
                    VestingLogic = artifacts.require("VestingLogic");
                    VestingFactory = artifacts.require("VestingFactory");
                    VestingRegistry3 = artifacts.require("VestingRegistry3");
                    Timelock = artifacts.require("Timelock");
                    TimelockMock = artifacts.require("TimelockMock");
                    GovernorAlpha = artifacts.require("GovernorAlpha");
                    GovernorAlphaMock = artifacts.require("GovernorAlphaMock");
                    initialAmount = new tools_1.BN(1000000000);
                    timelockDelay = 1;
                    quorumPercentageVotes = 1;
                    majorityPercentageVotes = 20;
                    feeSharingAddress = "0x0000000000000000000000000000000000000001";
                    multiSigWalletOwners = [default_];
                    multiSigWalletRequiredConfirmations = 1;
                    return [4 /*yield*/, (0, state_1.conditionalDeploy)(FishToken, "Fish", function () { return deployer.deploy(FishToken, initialAmount); })];
                case 1:
                    fishToken = _b.sent();
                    return [4 /*yield*/, (0, state_1.conditionalDeploy)(MultiSigWallet, "MultiSigWallet", function () { return deployer.deploy(MultiSigWallet, multiSigWalletOwners, multiSigWalletRequiredConfirmations); })];
                case 2:
                    multiSigWallet = _b.sent();
                    return [4 /*yield*/, (0, state_1.conditionalInitialize)("MultiSigWallet", function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                            return [2 /*return*/, fishToken.transferOwnership(multiSigWallet.address)];
                        }); }); })];
                case 3:
                    _b.sent();
                    return [4 /*yield*/, (0, state_1.conditionalDeploy)(Staking, "StakingLogic", function () { return deployer.deploy(Staking); })];
                case 4:
                    stakingLogic = _b.sent();
                    return [4 /*yield*/, (0, state_1.conditionalDeploy)(StakingProxy, "StakingProxy", function () { return deployer.deploy(StakingProxy, fishToken.address); })];
                case 5:
                    stakingProxy = _b.sent();
                    return [4 /*yield*/, (0, state_1.conditionalInitialize)("StakingProxy", function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                            return [2 /*return*/, stakingProxy.setImplementation(stakingLogic.address)];
                        }); }); })];
                case 6:
                    _b.sent();
                    return [4 /*yield*/, Staking.at(stakingProxy.address)];
                case 7:
                    staking = _b.sent();
                    return [4 /*yield*/, (0, state_1.conditionalInitialize)("Staking", function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                            return [2 /*return*/, staking.setFeeSharing(feeSharingAddress)];
                        }); }); })];
                case 8:
                    _b.sent();
                    return [4 /*yield*/, (0, state_1.conditionalDeploy)(VestingLogic, "VestingLogic", function () { return deployer.deploy(VestingLogic); })];
                case 9:
                    vestingLogic = _b.sent();
                    return [4 /*yield*/, (0, state_1.conditionalDeploy)(VestingFactory, "VestingFactory", function () { return deployer.deploy(VestingFactory, vestingLogic.address); })];
                case 10:
                    vestingFactory = _b.sent();
                    return [4 /*yield*/, (0, state_1.conditionalDeploy)(VestingRegistry3, "VestingRegistry3", function () { return deployer.deploy(VestingRegistry3, vestingFactory.address, fishToken.address, staking.address, feeSharingAddress, multiSigWallet.address); })];
                case 11:
                    _b.sent();
                    if (network === 'development') {
                        TimelockMock.contractName = "Timelock";
                        timelockContract = TimelockMock;
                    }
                    else {
                        timelockContract = Timelock;
                    }
                    return [4 /*yield*/, (0, state_1.conditionalDeploy)(timelockContract, "Timelock", function () { return deployer.deploy(timelockContract, default_, timelockDelay); })];
                case 12:
                    timelock = _b.sent();
                    if (network === 'development') {
                        GovernorAlphaMock.contractName = "GovernorAlpha";
                        governorAlphaContract = GovernorAlphaMock;
                    }
                    else {
                        governorAlphaContract = GovernorAlpha;
                    }
                    return [4 /*yield*/, (0, state_1.conditionalDeploy)(governorAlphaContract, "GovernorAlpha", function () { return deployer.deploy(governorAlphaContract, timelock.address, staking.address, default_, quorumPercentageVotes, majorityPercentageVotes); })];
                case 13:
                    governorAlpha = _b.sent();
                    return [4 /*yield*/, (0, state_1.conditionalInitialize)("GovernorAlpha", function () { return __awaiter(void 0, void 0, void 0, function () {
                            var recentBlock, blockTimestamp, signature, abiParameters, etaTime;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, web3.eth.getBlock("latest")];
                                    case 1:
                                        recentBlock = _a.sent();
                                        blockTimestamp = Number(recentBlock.timestamp) + 1 + timelockDelay;
                                        signature = "setPendingAdmin(address)";
                                        abiParameters = web3.eth.abi.encodeParameter("address", governorAlpha.address);
                                        return [4 /*yield*/, timelock.queueTransaction(timelock.address, 0, signature, abiParameters, blockTimestamp)];
                                    case 2:
                                        _a.sent();
                                        return [4 /*yield*/, (0, state_1.setInfo)("Timelock", "setAdminEta", blockTimestamp)];
                                    case 3:
                                        _a.sent();
                                        etaTime = new Date(blockTimestamp * 1000).toString();
                                        console.log("ETA FOR ADMIN TRANSFER: ", etaTime);
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                case 14:
                    _b.sent();
                    (0, state_1.printState)();
                    return [2 /*return*/];
            }
        });
    });
});
