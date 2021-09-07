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
exports.waitForBlock = exports.timeTravel = exports.blockTimestampSimple = exports.blockTimestampExact = exports.nowExact = exports.nowSimple = void 0;
var node_logs_1 = require("node-logs");
var tools_1 = require("../../../test-utils/tools");
var logger = new node_logs_1["default"]().showInConsole(true);
var nowSimple = function () { return Math.ceil(Date.now() / 1000); };
exports.nowSimple = nowSimple;
var nowExact = function () { return new tools_1.BN((0, exports.nowSimple)()); };
exports.nowExact = nowExact;
var blockTimestampExact = function (web3, block) {
    if (block === void 0) { block = "latest"; }
    return __awaiter(void 0, void 0, void 0, function () {
        var timestamp;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, exports.blockTimestampSimple)(web3, block)];
                case 1:
                    timestamp = _a.sent();
                    return [2 /*return*/, new tools_1.BN(timestamp)];
            }
        });
    });
};
exports.blockTimestampExact = blockTimestampExact;
var blockTimestampSimple = function (web3, block) {
    if (block === void 0) { block = "latest"; }
    return __awaiter(void 0, void 0, void 0, function () {
        var timestamp;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, web3.eth.getBlock(block)];
                case 1:
                    timestamp = (_a.sent()).timestamp;
                    return [2 /*return*/, timestamp];
            }
        });
    });
};
exports.blockTimestampSimple = blockTimestampSimple;
var timeTravel = function (web3, seconds) { return __awaiter(void 0, void 0, void 0, function () {
    var timestamp, newTimestamp;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, exports.blockTimestampSimple)(web3)];
            case 1:
                timestamp = _a.sent();
                newTimestamp = timestamp + seconds;
                console.log("Advancing block time " + seconds + " seconds...");
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        web3.currentProvider.send({
                            jsonrpc: "2.0",
                            method: "evm_mine",
                            params: [newTimestamp],
                            id: new Date().getTime()
                        }, function (err, result) {
                            if (err) {
                                return reject(err);
                            }
                            return resolve(result);
                        });
                    })];
        }
    });
}); };
exports.timeTravel = timeTravel;
var waitForBlock = function (truffle, offset) { return __awaiter(void 0, void 0, void 0, function () {
    var web3, startingBlock;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                web3 = truffle.web3;
                return [4 /*yield*/, web3.eth.getBlock("latest")];
            case 1:
                startingBlock = _a.sent();
                logger.info("Current block: " + startingBlock.number);
                logger.info("Waiting for block: " + (startingBlock.number + offset) + " ...");
                return [4 /*yield*/, new Promise(function (resolve, revert) {
                        var interval = 0;
                        var check = function () { return __awaiter(void 0, void 0, void 0, function () {
                            var currentBlockNumber, e_1;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        _a.trys.push([0, 2, , 3]);
                                        return [4 /*yield*/, web3.eth.getBlock("latest")];
                                    case 1:
                                        currentBlockNumber = (_a.sent()).number;
                                        return [3 /*break*/, 3];
                                    case 2:
                                        e_1 = _a.sent();
                                        logger.error("Error in getting block number");
                                        console.log(e_1);
                                        revert(e_1);
                                        return [2 /*return*/];
                                    case 3:
                                        if (currentBlockNumber >= (startingBlock.number + offset)) {
                                            truffle.clearInterval(interval);
                                            interval = 0;
                                            resolve();
                                        }
                                        return [2 /*return*/];
                                }
                            });
                        }); };
                        interval = truffle.setInterval(check, 500);
                    })];
            case 2:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
exports.waitForBlock = waitForBlock;
