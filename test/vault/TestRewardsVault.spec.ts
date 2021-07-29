import { expectRevert } from "@openzeppelin/test-helpers";
import { toWei } from "web3-utils";

import { BN } from "@utils/tools";
import { StandardAccounts } from "@utils/standardAccounts";
import { TokenInstance, RewardsVaultInstance } from "types/generated";

const Token = artifacts.require("Token");
const RewardsVault = artifacts.require("RewardsVault");

const tokens = (amount: string | number): BN => toWei(new BN(amount), 'ether');

contract("RewardsVault", async (accounts) => {
    const sa = new StandardAccounts(accounts);

    let token: TokenInstance;
    let rewardsVault: RewardsVaultInstance;

    before("before all", async () => { });

    describe("initialize", async () => {
        beforeEach(async () => {
            token = await Token.new("Test Token", "TT", 18);
            rewardsVault = await RewardsVault.new({ from: sa.default });
        });

        context("should succeed", async () => {
            it("when it's called by first time", async () => {
                await rewardsVault.initialize({ from: sa.default }); //
                expect(await rewardsVault.isApprover(sa.default)).to.equal(true, "should give approver rolle to caller");
            });
        });

        context("should fail", async () => {
            it("when it's called for the second time", async () => {
                await rewardsVault.initialize({ from: sa.default });
                await expectRevert(rewardsVault.initialize({ from: sa.default }), "already initialized");
            });
        });
    });

    describe("getApproval", async () => {
        beforeEach(async () => {
            token = await Token.new("Test Token", "TT", 18);
            rewardsVault = await RewardsVault.new({ from: sa.default });
            await rewardsVault.initialize({ from: sa.default });
        });

        context("should succeed", async () => {
            it("when caller has proper role", async () => {
                const approver = sa.fundManager;
                const amount = tokens(10);

                await rewardsVault.addApprover(approver, { from: sa.default });
                await rewardsVault.getApproval(amount, token.address, { from: approver });

                expect(await token.allowance(rewardsVault.address, approver)).bignumber.to.eq(amount);
            });
        });

        context("should fail", async () => {
            it("when caller does not have proper role", async () => {
                await expectRevert(
                    rewardsVault.getApproval(tokens(10), token.address, { from: sa.other }),
                    "VM Exception while processing transaction: reverted with reason string 'ApproverRole: caller does not have the Approver role'"
                );
            });
        });
    });
});
