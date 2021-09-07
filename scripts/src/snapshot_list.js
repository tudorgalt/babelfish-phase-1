"use strict";
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable no-plusplus */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
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
var fs_1 = require("fs");
var tools_1 = require("@utils/tools");
var constants_1 = require("@utils/constants");
var process_1 = require("process");
var stakingContractAddress = "0x5684a06CaB22Db16d901fEe2A5C081b4C91eA40e";
var logger = new node_logs_1["default"]().showInConsole(true);
var fd;
var lastBlockfd;
function snapshot(truffle, networkName) {
    return __awaiter(this, void 0, void 0, function () {
        var web3, artifacts, defaultAccount, Staking, staking, addressMap, originalFromBlock, fromBlock, toBlock, batchSize, startTimestamp, csvContent, content, pointer, events, _i, events_1, event_1, stakerAddress;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    web3 = truffle.web3;
                    artifacts = truffle.artifacts;
                    return [4 /*yield*/, web3.eth.getAccounts()];
                case 1:
                    defaultAccount = (_a.sent())[0];
                    Staking = artifacts.require("Staking");
                    return [4 /*yield*/, Staking.at(stakingContractAddress)];
                case 2:
                    staking = _a.sent();
                    addressMap = {};
                    originalFromBlock = 3070260;
                    fromBlock = originalFromBlock;
                    toBlock = 3454083;
                    batchSize = 10;
                    return [4 /*yield*/, staking.kickoffTS()];
                case 3:
                    startTimestamp = _a.sent();
                    return [4 /*yield*/, fs_1.promises.open("addressList_1", "a+")];
                case 4:
                    fd = _a.sent();
                    return [4 /*yield*/, fd.readFile()];
                case 5:
                    csvContent = _a.sent();
                    if (csvContent.length === 0) {
                        fd.write("Address,VotingPower\n");
                        logger.info("Initializing CSV");
                    }
                    return [4 /*yield*/, fs_1.promises.open("last_block", "r+")];
                case 6:
                    lastBlockfd = _a.sent();
                    return [4 /*yield*/, lastBlockfd.readFile()];
                case 7:
                    content = _a.sent();
                    if (content.length > 0) {
                        fromBlock = parseInt(content.toString());
                        fromBlock += batchSize;
                        logger.info("Resuming from block " + fromBlock);
                    }
                    if (fromBlock > toBlock) {
                        logger.info('Finished!');
                        (0, process_1.exit)(0);
                    }
                    pointer = fromBlock;
                    _a.label = 8;
                case 8:
                    if (!(pointer <= toBlock)) return [3 /*break*/, 15];
                    return [4 /*yield*/, staking.getPastEvents("TokensStaked", {
                            fromBlock: pointer,
                            toBlock: pointer + batchSize
                        })];
                case 9:
                    events = _a.sent();
                    _i = 0, events_1 = events;
                    _a.label = 10;
                case 10:
                    if (!(_i < events_1.length)) return [3 /*break*/, 13];
                    event_1 = events_1[_i];
                    stakerAddress = event_1.returnValues.staker;
                    if (!(addressMap[stakerAddress] !== 1)) return [3 /*break*/, 12];
                    addressMap[stakerAddress] = 1;
                    return [4 /*yield*/, saveStaker(stakerAddress, toBlock, startTimestamp, staking, web3)];
                case 11:
                    _a.sent();
                    _a.label = 12;
                case 12:
                    _i++;
                    return [3 /*break*/, 10];
                case 13:
                    logger.info("current block: " + pointer + " events: " + events.length + " progress: " + ((pointer - originalFromBlock) / (toBlock - originalFromBlock)).toFixed(3));
                    lastBlockfd.write(pointer.toString(), 0);
                    _a.label = 14;
                case 14:
                    pointer += batchSize;
                    return [3 /*break*/, 8];
                case 15: return [2 /*return*/];
            }
        });
    });
}
exports["default"] = snapshot;
function saveStaker(address, fromBlock, date, staking, web3) {
    return __awaiter(this, void 0, void 0, function () {
        var code, votingPower;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, web3.eth.getCode(address)];
                case 1:
                    code = _a.sent();
                    if (code.length > 3) {
                        return [2 /*return*/];
                    }
                    if (address === constants_1.ZERO_ADDRESS) {
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, staking.getPriorVotes(address, fromBlock, date)];
                case 2:
                    votingPower = _a.sent();
                    if (!votingPower.gt(new tools_1.BN(0))) {
                        return [2 /*return*/];
                    }
                    fd.write(address + "," + votingPower.toString() + "\n");
                    logger.info("New staker: " + address + ". VotingPower: " + votingPower.toString());
                    return [2 /*return*/];
            }
        });
    });
}
