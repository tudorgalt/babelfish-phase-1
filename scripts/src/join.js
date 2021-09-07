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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
exports.__esModule = true;
/* eslint-disable no-continue */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-restricted-syntax */
var fs_1 = require("fs");
var node_logs_1 = require("node-logs");
var readline_1 = require("readline");
var logger = new node_logs_1["default"]().showInConsole(true);
var fd;
var newStakersJoined = [];
var main = function () { return __awaiter(void 0, void 0, void 0, function () {
    var csvContent, newStakersInfo, fileStream, rl, rl_1, rl_1_1, line, _a, address, power, e_1_1, restOfStakers;
    var e_1, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0: return [4 /*yield*/, fs_1.promises.open("addressList_joined", "a+")];
            case 1:
                fd = _c.sent();
                return [4 /*yield*/, fd.readFile()];
            case 2:
                csvContent = _c.sent();
                if (csvContent.length === 0) {
                    fd.write("Address,VotingPower\n");
                    logger.info("Initializing CSV");
                }
                return [4 /*yield*/, readNewAddresses()];
            case 3:
                newStakersInfo = _c.sent();
                fileStream = fs_1["default"].createReadStream("addressList_2_unique_copy");
                rl = readline_1["default"].createInterface({
                    input: fileStream,
                    crlfDelay: Infinity
                });
                _c.label = 4;
            case 4:
                _c.trys.push([4, 10, 11, 16]);
                rl_1 = __asyncValues(rl);
                _c.label = 5;
            case 5: return [4 /*yield*/, rl_1.next()];
            case 6:
                if (!(rl_1_1 = _c.sent(), !rl_1_1.done)) return [3 /*break*/, 9];
                line = rl_1_1.value;
                _a = line.split(","), address = _a[0], power = _a[1];
                if (!isLineValid(address, power)) return [3 /*break*/, 8];
                return [4 /*yield*/, saveUpdatedStaker({ address: address, power: power }, newStakersInfo)];
            case 7:
                _c.sent();
                _c.label = 8;
            case 8: return [3 /*break*/, 5];
            case 9: return [3 /*break*/, 16];
            case 10:
                e_1_1 = _c.sent();
                e_1 = { error: e_1_1 };
                return [3 /*break*/, 16];
            case 11:
                _c.trys.push([11, , 14, 15]);
                if (!(rl_1_1 && !rl_1_1.done && (_b = rl_1["return"]))) return [3 /*break*/, 13];
                return [4 /*yield*/, _b.call(rl_1)];
            case 12:
                _c.sent();
                _c.label = 13;
            case 13: return [3 /*break*/, 15];
            case 14:
                if (e_1) throw e_1.error;
                return [7 /*endfinally*/];
            case 15: return [7 /*endfinally*/];
            case 16:
                restOfStakers = newStakersInfo.filter(function (_a) {
                    var address = _a.address;
                    return !newStakersJoined.includes(address);
                });
                logger.success("Found " + newStakersJoined.length + " stakers to update");
                logger.success("Appending rest of " + restOfStakers.length + " stakers");
                return [4 /*yield*/, appendRestOfNewStakers(restOfStakers)];
            case 17:
                _c.sent();
                return [2 /*return*/];
        }
    });
}); };
var readNewAddresses = function () { return __awaiter(void 0, void 0, void 0, function () {
    var stakersInfo, fileStream, rl, rl_2, rl_2_1, line, _a, address, power, e_2_1;
    var e_2, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                stakersInfo = [];
                fileStream = fs_1["default"].createReadStream("addressList_extend_unique_copy");
                rl = readline_1["default"].createInterface({
                    input: fileStream,
                    crlfDelay: Infinity
                });
                _c.label = 1;
            case 1:
                _c.trys.push([1, 6, 7, 12]);
                rl_2 = __asyncValues(rl);
                _c.label = 2;
            case 2: return [4 /*yield*/, rl_2.next()];
            case 3:
                if (!(rl_2_1 = _c.sent(), !rl_2_1.done)) return [3 /*break*/, 5];
                line = rl_2_1.value;
                _a = line.split(","), address = _a[0], power = _a[1];
                if (isLineValid(address, power)) {
                    stakersInfo.push({ address: address, power: power });
                }
                _c.label = 4;
            case 4: return [3 /*break*/, 2];
            case 5: return [3 /*break*/, 12];
            case 6:
                e_2_1 = _c.sent();
                e_2 = { error: e_2_1 };
                return [3 /*break*/, 12];
            case 7:
                _c.trys.push([7, , 10, 11]);
                if (!(rl_2_1 && !rl_2_1.done && (_b = rl_2["return"]))) return [3 /*break*/, 9];
                return [4 /*yield*/, _b.call(rl_2)];
            case 8:
                _c.sent();
                _c.label = 9;
            case 9: return [3 /*break*/, 11];
            case 10:
                if (e_2) throw e_2.error;
                return [7 /*endfinally*/];
            case 11: return [7 /*endfinally*/];
            case 12: return [2 /*return*/, stakersInfo];
        }
    });
}); };
var saveUpdatedStaker = function (oldData, newStakers) { return __awaiter(void 0, void 0, void 0, function () {
    var updatedStaker;
    return __generator(this, function (_a) {
        updatedStaker = newStakers.find(function (_a) {
            var address = _a.address;
            return address === oldData.address;
        });
        if (updatedStaker) {
            if (!newStakersJoined.includes(updatedStaker.address)) {
                fd.write(updatedStaker.address + "," + updatedStaker.power + "\n");
                logger.warn("Updating staker and adding old staker: " + updatedStaker.address);
                newStakersJoined.push(updatedStaker.address);
            }
            else {
                logger.err("Duplacate: " + updatedStaker.address);
            }
            return [2 /*return*/];
        }
        fd.write(oldData.address + "," + oldData.power + "\n");
        logger.info("Adding old staker: " + oldData.address);
        return [2 /*return*/];
    });
}); };
var appendRestOfNewStakers = function (restOfStakers) { return __awaiter(void 0, void 0, void 0, function () {
    var _i, restOfStakers_1, _a, address, power;
    return __generator(this, function (_b) {
        for (_i = 0, restOfStakers_1 = restOfStakers; _i < restOfStakers_1.length; _i++) {
            _a = restOfStakers_1[_i], address = _a.address, power = _a.power;
            fd.write(address + "," + power + "\n");
            logger.warn("Appending new staker: " + address);
        }
        return [2 /*return*/];
    });
}); };
var isLineValid = function (address, power) {
    if (!address || !power)
        return false; // ignore empty lines
    if (address === "Address")
        return false; // ignore header
    return true;
};
main();
