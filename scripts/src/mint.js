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
var walletAddress = '0x94e907f6B903A393E14FE549113137CA6483b5ef';
var esethAddress = '0x4f2fc8d55c1888a5aca2503e2f3e5d74eef37c33';
var mock1Address = '0xe4578D40080893D82b9dDfC3C419c46D1BC2E10A';
var massetAddress = '0x90527Db0F9b828dF852820CBEAB84090dD5A9Cc6';
function mint(truffle) {
    return __awaiter(this, void 0, void 0, function () {
        var wallet, artifacts;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    wallet = truffle.provider;
                    artifacts = truffle.artifacts;
                    return [4 /*yield*/, approve(wallet, artifacts)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, _mint(wallet, artifacts)];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports["default"] = mint;
function approve(wallet, artifacts) {
    return __awaiter(this, void 0, void 0, function () {
        var c_mock1, d_mock1, c_masset, d_masset, r;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    c_mock1 = artifacts.require('MockERC20');
                    return [4 /*yield*/, c_mock1.at(mock1Address)];
                case 1:
                    d_mock1 = _a.sent();
                    c_masset = artifacts.require('Masset');
                    return [4 /*yield*/, c_masset.at(massetAddress)];
                case 2:
                    d_masset = _a.sent();
                    return [4 /*yield*/, d_mock1.approve.sendTransaction(d_masset.address, '100000000000000000')];
                case 3:
                    r = _a.sent();
                    console.log(r);
                    return [2 /*return*/];
            }
        });
    });
}
function _mint(wallet, artifacts) {
    return __awaiter(this, void 0, void 0, function () {
        var c_masset, d_masset, r;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    c_masset = artifacts.require('Masset');
                    return [4 /*yield*/, c_masset.at(massetAddress)];
                case 1:
                    d_masset = _a.sent();
                    return [4 /*yield*/, d_masset.mintTo.sendTransaction(mock1Address, '100000000000000000', walletAddress)];
                case 2:
                    r = _a.sent();
                    console.log(r);
                    return [2 /*return*/];
            }
        });
    });
}
