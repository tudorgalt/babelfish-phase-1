"use strict";
exports.__esModule = true;
exports.StandardAccounts = void 0;
/**
 * @dev Standard accounts
 */
var StandardAccounts = /** @class */ (function () {
    function StandardAccounts(accounts) {
        this.all = accounts;
        this["default"] = accounts[0], this.governor = accounts[1], this.other = accounts[2], this.dummy1 = accounts[3], this.dummy2 = accounts[4], this.dummy3 = accounts[5], this.dummy4 = accounts[6], this.fundManager = accounts[7], this.fundManager2 = accounts[8];
    }
    return StandardAccounts;
}());
exports.StandardAccounts = StandardAccounts;
exports["default"] = StandardAccounts;
