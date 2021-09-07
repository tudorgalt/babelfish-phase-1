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
/* eslint-disable no-await-in-loop */
/* eslint-disable no-plusplus */
/* eslint-disable no-continue */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-restricted-syntax */
var tools_1 = require("@utils/tools");
var state_1 = require("migrations/state");
var node_logs_1 = require("node-logs");
var assert_1 = require("./utils/assert");
var logger = new node_logs_1["default"]().showInConsole(true);
var batchSize = 150;
var main = function (truffle, networkName) { return __awaiter(void 0, void 0, void 0, function () {
    var Sender, Fish, sender, fishToken, total, totalValue, initialBalance, currentIndex, totalGasUsed, receipt, e_1, finalBalance, expectedBalance;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                (0, state_1.setNetwork)(networkName);
                Sender = truffle.artifacts.require("Sender");
                Fish = truffle.artifacts.require("Fish");
                return [4 /*yield*/, (0, state_1.getDeployed)(Sender, "Sender")];
            case 1:
                sender = _a.sent();
                return [4 /*yield*/, (0, state_1.getDeployed)(Fish, "FishToken")];
            case 2:
                fishToken = _a.sent();
                return [4 /*yield*/, sender.totalLength()];
            case 3:
                total = _a.sent();
                return [4 /*yield*/, sender.totalAmount()];
            case 4:
                totalValue = _a.sent();
                return [4 /*yield*/, fishToken.balanceOf(sender.address)];
            case 5:
                initialBalance = _a.sent();
                logger.warn("Total value of tokens to send: " + totalValue);
                return [4 /*yield*/, sender.index()];
            case 6:
                currentIndex = _a.sent();
                if (currentIndex.eq(new tools_1.BN(0))) {
                    logger.info("Starting sending tokens");
                }
                else {
                    logger.info("Resuming sending from: " + currentIndex.toString());
                }
                totalGasUsed = 0;
                _a.label = 7;
            case 7:
                _a.trys.push([7, 12, , 13]);
                _a.label = 8;
            case 8:
                if (!currentIndex.lt(total)) return [3 /*break*/, 11];
                return [4 /*yield*/, sender.sendTokens(batchSize)];
            case 9:
                receipt = (_a.sent()).receipt;
                totalGasUsed += receipt.gasUsed;
                return [4 /*yield*/, sender.index()];
            case 10:
                currentIndex = _a.sent();
                logger.info("Sent to " + batchSize + " addresses. Index: " + currentIndex.toString() + ". Gas used: " + receipt.gasUsed);
                return [3 /*break*/, 8];
            case 11: return [3 /*break*/, 13];
            case 12:
                e_1 = _a.sent();
                logger.err("ERROR");
                console.log(e_1);
                return [3 /*break*/, 13];
            case 13: return [4 /*yield*/, fishToken.balanceOf(sender.address)];
            case 14:
                finalBalance = _a.sent();
                expectedBalance = initialBalance.sub(totalValue);
                (0, assert_1["default"])(finalBalance.eq(expectedBalance), "final balance is not valid");
                logger.success("Sending completed. Total gas used: " + totalGasUsed);
                return [2 /*return*/];
        }
    });
}); };
exports["default"] = main;
