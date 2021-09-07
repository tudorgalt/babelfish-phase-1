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
var node_logs_1 = require("node-logs");
var state_1 = require("../../migrations/state");
var logger = new node_logs_1["default"]().showInConsole(true);
function transferAdmin(truffle, networkName) {
    return __awaiter(this, void 0, void 0, function () {
        var artifacts, web3, Timelock, GovernorAlpha, timelock, governorAlpha, eta, currentTime, etaTime, signature, abiParameters, admin;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    (0, state_1.setNetwork)(networkName);
                    artifacts = truffle.artifacts;
                    web3 = truffle.web3;
                    Timelock = artifacts.require("Timelock");
                    GovernorAlpha = artifacts.require("GovernorAlpha");
                    return [4 /*yield*/, (0, state_1.getDeployed)(Timelock, "Timelock")];
                case 1:
                    timelock = _a.sent();
                    return [4 /*yield*/, (0, state_1.getDeployed)(GovernorAlpha, "GovernorAlpha")];
                case 2:
                    governorAlpha = _a.sent();
                    return [4 /*yield*/, (0, state_1.getInfo)("Timelock", "setAdminEta")];
                case 3:
                    eta = _a.sent();
                    currentTime = Date.now() / 1000;
                    if (eta > currentTime) {
                        etaTime = new Date(eta * 1000).toString();
                        logger.error("Invalid time for transfering admin. ETA FOR ADMIN TRANSFER: " + etaTime);
                    }
                    signature = "setPendingAdmin(address)";
                    abiParameters = web3.eth.abi.encodeParameter("address", governorAlpha.address);
                    return [4 /*yield*/, timelock.executeTransaction(timelock.address, 0, signature, abiParameters, eta)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, timelock.pendingAdmin()];
                case 5:
                    _a.sent();
                    // eslint-disable-next-line no-underscore-dangle
                    return [4 /*yield*/, governorAlpha.__acceptAdmin()];
                case 6:
                    // eslint-disable-next-line no-underscore-dangle
                    _a.sent();
                    return [4 /*yield*/, timelock.admin()];
                case 7:
                    admin = _a.sent();
                    logger.info("admin: " + admin);
                    return [2 /*return*/];
            }
        });
    });
}
exports["default"] = transferAdmin;
