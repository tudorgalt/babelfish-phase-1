"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.logTx = exports.logAndSanitizeArgs = exports.logObject = exports.logSeparator = exports.logBlockTimestamp = void 0;
// eslint-disable-next-line import/no-extraneous-dependencies
var chalk_1 = require("chalk");
var time_1 = require("./time");
var logBlockTimestamp = function (web3, block) {
    if (block === void 0) { block = "latest"; }
    return __awaiter(void 0, void 0, void 0, function () {
        var timestamp;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, time_1.blockTimestampSimple)(web3, block)];
                case 1:
                    timestamp = _a.sent();
                    console.log("Current block timestamp: " + timestamp);
                    return [2 /*return*/];
            }
        });
    });
};
exports.logBlockTimestamp = logBlockTimestamp;
var logSeparator = function () {
    console.log(chalk_1["default"].gray("------------------------------------------------"));
};
exports.logSeparator = logSeparator;
var logObject = function (obj) {
    var keys = Object.keys(obj);
    console.table(keys.sort().reduce(function (acc, key) {
        var _a;
        return (__assign((_a = {}, _a[key] = obj[key].toString(), _a), acc));
    }, {}));
};
exports.logObject = logObject;
var logAndSanitizeArgs = function (args) {
    (0, exports.logObject)(sanitizeArgs(args));
};
exports.logAndSanitizeArgs = logAndSanitizeArgs;
var sanitizeArgs = function (args) {
    // Remove indexed keys, use named keys
    return Object.keys(args)
        .filter(function (key) { return key !== "__length__" && !Number.isInteger(parseInt(key, 10)); })
        .reduce(function (acc, key) {
        var _a;
        return (__assign(__assign({}, acc), (_a = {}, _a[key] = args[key], _a)));
    }, {});
};
var logTxResponse = function (_a) {
    var logs = _a.logs;
    logs.forEach(function (_a) {
        var event = _a.event, args = _a.args;
        console.log(chalk_1["default"].gray("Event ") + chalk_1["default"].italic(event));
        (0, exports.logAndSanitizeArgs)(args);
    });
};
var logTx = function (txPromise, description) { return __awaiter(void 0, void 0, void 0, function () {
    var response, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                (0, exports.logSeparator)();
                console.log(chalk_1["default"].blue("[tx]") + " " + description);
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, txPromise];
            case 2:
                response = _a.sent();
                return [3 /*break*/, 4];
            case 3:
                error_1 = _a.sent();
                console.log(chalk_1["default"].blue(" --> ") + chalk_1["default"].redBright("✘ Failed!"));
                throw error_1;
            case 4:
                console.log(chalk_1["default"].blue(" --> ") + chalk_1["default"].greenBright("✔ Success!"));
                if (Array.isArray(response)) {
                    response.map(logTxResponse);
                }
                else {
                    logTxResponse(response);
                }
                return [2 /*return*/, response];
        }
    });
}); };
exports.logTx = logTx;
// export const logTrancheData = async (forge: ForgeRewardsMUSDInstance, trancheNumber: string) => {
//     const [
//         startTime,
//         endTime,
//         claimEndTime,
//         unlockTime,
//         totalMintVolume,
//         totalRewardUnits,
//         unclaimedRewardUnits,
//         rewardees,
//     ] = await forge.getTrancheData(trancheNumber);
//     const data = {
//         startTime,
//         endTime,
//         claimEndTime,
//         unlockTime,
//         totalMintVolume,
//         totalRewardUnits,
//         unclaimedRewardUnits,
//         rewardees,
//     };
//     logSeparator();
//     console.log(`Tranche ${trancheNumber} data:`);
//     logObject(data);
//     return data;
// };
// export const logRewardeeData = async (
//     forge: ForgeRewardsMUSDInstance,
//     trancheNumber: string,
//     account: string,
// ): Promise<{
//     claimed: boolean;
//     claimWindowClosed: boolean;
//     mintVolume: BN;
//     mintWindowClosed: boolean;
//     redeemed: boolean;
//     rewardAllocation: BN;
//     unlocked: boolean;
// }> => {
//     const data: {
//         claimed: boolean;
//         claimWindowClosed: boolean;
//         mintVolume: string;
//         mintWindowClosed: boolean;
//         redeemed: boolean;
//         rewardAllocation: string;
//         unlocked: boolean;
//     } = await forge.contract.methods["getRewardeeData(uint256,address)"](
//         trancheNumber,
//         account,
//     ).call();
//     data.rewardAllocation = new BN(data.rewardAllocation);
//     data.mintVolume = new BN(data.mintVolume);
//     logSeparator();
//     console.log(`Rewardee data for ${account} in tranche ${trancheNumber}:`);
//     logAndSanitizeArgs(data);
//     return data;
// };
