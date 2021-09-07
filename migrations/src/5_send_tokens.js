"use strict";
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-plusplus */
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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
exports.__esModule = true;
var web3_utils_1 = require("web3-utils");
var fs_1 = require("fs");
var tools_1 = require("@utils/tools");
var state_1 = require("migrations/state");
var tokens = function (amount) { return (0, web3_utils_1.toWei)(new tools_1.BN(amount), 'ether'); };
exports["default"] = (function (_a, deployer, network, accounts) {
    var artifacts = _a.artifacts, web3 = _a.web3;
    return __awaiter(void 0, void 0, void 0, function () {
        var default_, tablesContracts, FishToken, Sender, numberOfTables, tables, _loop_1, i, token, sender, tablesContracts_1, tablesContracts_1_1, table, e_1_1;
        var e_1, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    default_ = accounts[0];
                    tablesContracts = [];
                    FishToken = artifacts.require("Fish");
                    Sender = artifacts.require("Sender");
                    return [4 /*yield*/, countTables()];
                case 1:
                    numberOfTables = _c.sent();
                    tables = [];
                    _loop_1 = function (i) {
                        var Name, TableContract, table;
                        return __generator(this, function (_d) {
                            switch (_d.label) {
                                case 0:
                                    Name = "Table_" + i;
                                    TableContract = artifacts.require(Name);
                                    return [4 /*yield*/, (0, state_1.conditionalDeploy)(TableContract, Name, function () { return deployer.deploy(TableContract); })];
                                case 1:
                                    table = _d.sent();
                                    tablesContracts.push(table);
                                    tables.push(table.address);
                                    return [2 /*return*/];
                            }
                        });
                    };
                    i = 1;
                    _c.label = 2;
                case 2:
                    if (!(i <= numberOfTables)) return [3 /*break*/, 5];
                    return [5 /*yield**/, _loop_1(i)];
                case 3:
                    _c.sent();
                    _c.label = 4;
                case 4:
                    i++;
                    return [3 /*break*/, 2];
                case 5: return [4 /*yield*/, (0, state_1.conditionalDeploy)(FishToken, "FishToken", function () { return deployer.deploy(FishToken, tokens("1000000000000000000")); })];
                case 6:
                    token = _c.sent();
                    return [4 /*yield*/, (0, state_1.conditionalDeploy)(Sender, "Sender", function () { return deployer.deploy(Sender, tables, token.address); })];
                case 7:
                    sender = _c.sent();
                    return [4 /*yield*/, token.mint(sender.address, tokens("1000000000000000000"))];
                case 8:
                    _c.sent();
                    _c.label = 9;
                case 9:
                    _c.trys.push([9, 15, 16, 21]);
                    tablesContracts_1 = __asyncValues(tablesContracts);
                    _c.label = 10;
                case 10: return [4 /*yield*/, tablesContracts_1.next()];
                case 11:
                    if (!(tablesContracts_1_1 = _c.sent(), !tablesContracts_1_1.done)) return [3 /*break*/, 14];
                    table = tablesContracts_1_1.value;
                    return [4 /*yield*/, table.transferOwnership(sender.address)];
                case 12:
                    _c.sent();
                    _c.label = 13;
                case 13: return [3 /*break*/, 10];
                case 14: return [3 /*break*/, 21];
                case 15:
                    e_1_1 = _c.sent();
                    e_1 = { error: e_1_1 };
                    return [3 /*break*/, 21];
                case 16:
                    _c.trys.push([16, , 19, 20]);
                    if (!(tablesContracts_1_1 && !tablesContracts_1_1.done && (_b = tablesContracts_1["return"]))) return [3 /*break*/, 18];
                    return [4 /*yield*/, _b.call(tablesContracts_1)];
                case 17:
                    _c.sent();
                    _c.label = 18;
                case 18: return [3 /*break*/, 20];
                case 19:
                    if (e_1) throw e_1.error;
                    return [7 /*endfinally*/];
                case 20: return [7 /*endfinally*/];
                case 21: return [2 /*return*/];
            }
        });
    });
});
var countTables = function () { return __awaiter(void 0, void 0, void 0, function () {
    var dir, count;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, fs_1.promises.readdir("contracts/airDrop/tables", { withFileTypes: true })];
            case 1:
                dir = _a.sent();
                count = dir.filter(function (file) { return file.name.includes("Table_"); }).length;
                return [2 /*return*/, count];
        }
    });
}); };
