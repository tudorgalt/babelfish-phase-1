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
var massetProxyAddress = '0x04D92DaA8f3Ef7bD222195e8D1DbE8D89A8CebD3';
// const thresholdProxyAdminAddress = '0x1300F936e46bd4d318feE9fF45AF8d5DFE7220d5';
var thresholdProxyAdminAddress = '0x20bdB7607092C88b52f6E6ceCD6Dc6F226bAb570';
var admin1 = '0x94e907f6B903A393E14FE549113137CA6483b5ef';
var admin2 = '0x78514Eedd8678b8055Ca19b55c2711a6AACc09F8';
var admin3 = '0xfa82e8Bb8517BE31f64fe517E1E63B87183414Ad';
function mint(truffle) {
    return __awaiter(this, void 0, void 0, function () {
        var wallet, artifacts, Masset, MassetProxy, ThresholdProxyAdmin, fake, masset, thresholdProxyAdmin, ex_1, ex_2, _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
        return __generator(this, function (_m) {
            switch (_m.label) {
                case 0:
                    wallet = truffle.provider;
                    artifacts = truffle.artifacts;
                    Masset = artifacts.require("Masset");
                    MassetProxy = artifacts.require("MassetProxy");
                    ThresholdProxyAdmin = artifacts.require("ThresholdProxyAdmin");
                    return [4 /*yield*/, Masset.at(massetProxyAddress)];
                case 1:
                    fake = _m.sent();
                    /*
                    let abi = masset.contract.methods['migrateFromV1ToV2()'].encodeABI();
                    console.log('abi for upgrade: ', abi);
                
                    abi = masset.contract.methods['migrateFromV1ToV2()'].encodeABI();
                    console.log('abi for migrate: ', abi);
                */
                    console.log(1);
                    return [4 /*yield*/, Masset["new"]()];
                case 2:
                    masset = _m.sent();
                    // const masset = await Masset.at('0x4AAEF06E9ED7FC42Cf86e5029ca742fd01f39F98');
                    // const masset = await Masset.at('0x175A264f3808cFb2EFDa7D861a09b4EeBEF339EF'); // old on testnet
                    console.log("new masset: ", masset.address);
                    //console.log('current version: ', await fake.getVersion());
                    console.log(2);
                    return [4 /*yield*/, ThresholdProxyAdmin.at(thresholdProxyAdminAddress)];
                case 3:
                    thresholdProxyAdmin = _m.sent();
                    console.log(3);
                    try {
                        //await thresholdProxyAdmin.retract({ from: admin1 });
                    }
                    catch (ex) {
                        console.log(ex);
                    }
                    console.log(4);
                    _m.label = 4;
                case 4:
                    _m.trys.push([4, 6, , 7]);
                    return [4 /*yield*/, thresholdProxyAdmin.propose(1, masset.address, '0x', { from: admin1 })];
                case 5:
                    _m.sent();
                    return [3 /*break*/, 7];
                case 6:
                    ex_1 = _m.sent();
                    console.log(ex_1);
                    return [3 /*break*/, 7];
                case 7:
                    console.log(5);
                    try {
                        //await thresholdProxyAdmin.retract({ from: admin2 });
                    }
                    catch (ex) {
                        console.log(ex);
                    }
                    console.log(6);
                    _m.label = 8;
                case 8:
                    _m.trys.push([8, 10, , 11]);
                    return [4 /*yield*/, thresholdProxyAdmin.propose(1, masset.address, '0x', { from: admin2 })];
                case 9:
                    _m.sent();
                    return [3 /*break*/, 11];
                case 10:
                    ex_2 = _m.sent();
                    console.log(ex_2);
                    return [3 /*break*/, 11];
                case 11:
                    console.log(7);
                    return [4 /*yield*/, thresholdProxyAdmin.accept({ from: admin1 })];
                case 12:
                    _m.sent();
                    _b = (_a = console).log;
                    _c = ['current version: '];
                    return [4 /*yield*/, fake.getVersion()];
                case 13:
                    _b.apply(_a, _c.concat([_m.sent()]));
                    _e = (_d = console).log;
                    return [4 /*yield*/, fake.geBasketManager()];
                case 14:
                    _e.apply(_d, [_m.sent()]);
                    _g = (_f = console).log;
                    return [4 /*yield*/, fake.getToken()];
                case 15:
                    _g.apply(_f, [_m.sent()]);
                    return [4 /*yield*/, fake.migrateFromV1ToV2()];
                case 16:
                    _m.sent();
                    _j = (_h = console).log;
                    return [4 /*yield*/, fake.geBasketManager()];
                case 17:
                    _j.apply(_h, [_m.sent()]);
                    _l = (_k = console).log;
                    return [4 /*yield*/, fake.getToken()];
                case 18:
                    _l.apply(_k, [_m.sent()]);
                    return [2 /*return*/];
            }
        });
    });
}
exports["default"] = mint;
