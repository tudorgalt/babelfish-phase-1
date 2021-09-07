"use strict";
/* eslint-disable prefer-destructuring */
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
var node_logs_1 = require("node-logs");
var constants_1 = require("@utils/constants");
var state_1 = require("../../migrations/state");
var time_1 = require("./utils/time");
var assert_1 = require("./utils/assert");
var ProposalState;
(function (ProposalState) {
    ProposalState[ProposalState["Pending"] = 0] = "Pending";
    ProposalState[ProposalState["Active"] = 1] = "Active";
    ProposalState[ProposalState["Canceled"] = 2] = "Canceled";
    ProposalState[ProposalState["Defeated"] = 3] = "Defeated";
    ProposalState[ProposalState["Succeeded"] = 4] = "Succeeded";
    ProposalState[ProposalState["Queued"] = 5] = "Queued";
    ProposalState[ProposalState["Expired"] = 6] = "Expired";
    ProposalState[ProposalState["Executed"] = 7] = "Executed";
})(ProposalState || (ProposalState = {}));
var logger = new node_logs_1["default"]().showInConsole(true);
function e2e(truffle, networkName) {
    return __awaiter(this, void 0, void 0, function () {
        var web3, artifacts, _a, owner, voter1, voter2, BasketManagerV3, GovernorAlpha, Staking, Fish, Token, governorAlpha, basketManager, staking, fish, votingDelay, votingPeriod, stakeAddress, basketManagerAddress, stakeAmount, stakeUntilDate, stake, targets, values, newBasset, signatures, calldatas, latestProposal, proposalState, _b, startBlock, forVotes, againstVotes, startTime, ownerForVotes, voter1ForVotes, voter2AgainstVotes, bassetsList;
        var _this = this;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    web3 = truffle.web3;
                    artifacts = truffle.artifacts;
                    return [4 /*yield*/, web3.eth.getAccounts()];
                case 1:
                    _a = (_c.sent()), owner = _a[0], voter1 = _a[1], voter2 = _a[2];
                    (0, state_1.setNetwork)(networkName);
                    BasketManagerV3 = artifacts.require("BasketManagerV3");
                    GovernorAlpha = artifacts.require("GovernorAlpha");
                    Staking = artifacts.require("Staking");
                    Fish = artifacts.require("Fish");
                    Token = artifacts.require("Token");
                    return [4 /*yield*/, (0, state_1.getDeployed)(GovernorAlpha, "GovernorAlpha")];
                case 2:
                    governorAlpha = _c.sent();
                    return [4 /*yield*/, (0, state_1.getDeployed)(BasketManagerV3, "XUSD_BasketManagerProxy")];
                case 3:
                    basketManager = _c.sent();
                    return [4 /*yield*/, (0, state_1.getDeployed)(Staking, "StakingProxy")];
                case 4:
                    staking = _c.sent();
                    return [4 /*yield*/, (0, state_1.getDeployed)(Fish, "Fish")];
                case 5:
                    fish = _c.sent();
                    return [4 /*yield*/, governorAlpha.votingDelay()];
                case 6:
                    votingDelay = _c.sent();
                    return [4 /*yield*/, governorAlpha.votingPeriod()];
                case 7:
                    votingPeriod = _c.sent();
                    return [4 /*yield*/, (0, state_1.getInfo)("StakingProxy", "address")];
                case 8:
                    stakeAddress = _c.sent();
                    return [4 /*yield*/, (0, state_1.getInfo)("XUSD_BasketManagerProxy", "address")];
                case 9:
                    basketManagerAddress = _c.sent();
                    stakeAmount = 1000000;
                    stakeUntilDate = Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7 * 3);
                    stake = function (address, amount) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, fish.transfer(address, amount, { from: owner })];
                                case 1:
                                    _a.sent();
                                    return [4 /*yield*/, fish.approve(stakeAddress, amount, { from: address })];
                                case 2:
                                    _a.sent();
                                    return [4 /*yield*/, staking.stake(amount, stakeUntilDate, constants_1.ZERO_ADDRESS, constants_1.ZERO_ADDRESS, { from: address })];
                                case 3:
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    }); };
                    return [4 /*yield*/, fish.approve(stakeAddress, stakeAmount)];
                case 10:
                    _c.sent();
                    return [4 /*yield*/, staking.stake(stakeAmount, stakeUntilDate, constants_1.ZERO_ADDRESS, constants_1.ZERO_ADDRESS)];
                case 11:
                    _c.sent();
                    return [4 /*yield*/, stake(voter1, stakeAmount / 500)];
                case 12:
                    _c.sent();
                    return [4 /*yield*/, stake(voter2, stakeAmount)];
                case 13:
                    _c.sent();
                    targets = [basketManagerAddress];
                    values = [0];
                    return [4 /*yield*/, Token["new"]("TEST", "TST", 18)];
                case 14:
                    newBasset = _c.sent();
                    signatures = ["addBasset(address,int256,address,uint256,uint256,bool)"];
                    calldatas = [web3.eth.abi.encodeParameters(["address", "int256", "address", "uint256", "uint256", "bool"], [newBasset.address, 1, constants_1.ZERO_ADDRESS, 0, 1000, false])];
                    return [4 /*yield*/, governorAlpha.propose(targets, values, signatures, calldatas, "test propsal")];
                case 15:
                    _c.sent();
                    return [4 /*yield*/, governorAlpha.latestProposalIds(owner)];
                case 16:
                    latestProposal = _c.sent();
                    return [4 /*yield*/, governorAlpha.state(latestProposal)];
                case 17:
                    proposalState = (_c.sent()).toNumber();
                    (0, assert_1["default"])(proposalState === ProposalState.Pending, "proposal should be pending");
                    return [4 /*yield*/, (0, time_1.waitForBlock)(truffle, votingDelay.toNumber() + 1)];
                case 18:
                    _c.sent();
                    return [4 /*yield*/, governorAlpha.state(latestProposal)];
                case 19:
                    proposalState = (_c.sent()).toNumber();
                    (0, assert_1["default"])(proposalState === ProposalState.Active, "proposal should be active");
                    return [4 /*yield*/, governorAlpha.castVote(latestProposal, true)];
                case 20:
                    _c.sent();
                    return [4 /*yield*/, governorAlpha.castVote(latestProposal, true, { from: voter1 })];
                case 21:
                    _c.sent();
                    return [4 /*yield*/, governorAlpha.castVote(latestProposal, false, { from: voter2 })];
                case 22:
                    _c.sent();
                    return [4 /*yield*/, governorAlpha.proposals(latestProposal)];
                case 23:
                    _b = _c.sent(), startBlock = _b[1], forVotes = _b[3], againstVotes = _b[4], startTime = _b[8];
                    return [4 /*yield*/, staking.getPriorVotes(owner, startBlock, startTime)];
                case 24:
                    ownerForVotes = _c.sent();
                    return [4 /*yield*/, staking.getPriorVotes(voter1, startBlock, startTime)];
                case 25:
                    voter1ForVotes = _c.sent();
                    return [4 /*yield*/, staking.getPriorVotes(voter2, startBlock, startTime)];
                case 26:
                    voter2AgainstVotes = _c.sent();
                    (0, assert_1["default"])(forVotes.eq(ownerForVotes.add(voter1ForVotes)), "not a proper number of for votes");
                    (0, assert_1["default"])(againstVotes.eq(voter2AgainstVotes), "not a proper number of against votes");
                    return [4 /*yield*/, governorAlpha.state(latestProposal)];
                case 27:
                    proposalState = (_c.sent()).toNumber();
                    (0, assert_1["default"])(proposalState === ProposalState.Active, "proposal should be active until the end of voting period");
                    return [4 /*yield*/, (0, time_1.waitForBlock)(truffle, votingPeriod.toNumber())];
                case 28:
                    _c.sent();
                    return [4 /*yield*/, governorAlpha.state(latestProposal)];
                case 29:
                    proposalState = (_c.sent()).toNumber();
                    (0, assert_1["default"])(proposalState === ProposalState.Succeeded, "proposal should be succeeded");
                    return [4 /*yield*/, governorAlpha.queue(latestProposal)];
                case 30:
                    _c.sent();
                    return [4 /*yield*/, governorAlpha.state(latestProposal)];
                case 31:
                    proposalState = (_c.sent()).toNumber();
                    (0, assert_1["default"])(proposalState === ProposalState.Queued, "proposal should be queued");
                    return [4 /*yield*/, governorAlpha.execute(latestProposal)];
                case 32:
                    _c.sent();
                    return [4 /*yield*/, governorAlpha.state(latestProposal)];
                case 33:
                    proposalState = (_c.sent()).toNumber();
                    (0, assert_1["default"])(proposalState === ProposalState.Executed, "proposal should be executed");
                    return [4 /*yield*/, basketManager.getBassets()];
                case 34:
                    bassetsList = _c.sent();
                    (0, assert_1["default"])(bassetsList.includes(newBasset.address), "new basset should be added");
                    logger.success("Test Completed!");
                    return [2 /*return*/];
            }
        });
    });
}
exports["default"] = e2e;
