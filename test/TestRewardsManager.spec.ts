import { expectRevert } from "@openzeppelin/test-helpers";
import { toWei } from "web3-utils";

import { BN } from "@utils/tools";
import { StandardAccounts } from "@utils/standardAccounts";
import { RewardsManagerInstance } from "types/generated";

const RewardsManager = artifacts.require("RewardsManager");


contract("RewardsManager", async (accounts) => {
    const sa = new StandardAccounts(accounts);

    let rewardsManager: RewardsManagerInstance;

    before("before all", async () => { });

    describe("initialize", async () => {
        beforeEach(async () => {
            rewardsManager = await RewardsManager.new({ from: sa.default });
        });

        context("should fail", async () => {
            it("when it's called for the second time", async () => {
                await rewardsManager.initialize({ from: sa.default });
                await expectRevert(rewardsManager.initialize({ from: sa.default }), "already initialized");
            });
        });
    });

    describe("Curve calculation", async () => {
        beforeEach(async () => {
            rewardsManager = await RewardsManager.new({ from: sa.default });
            await rewardsManager.initialize({ from: sa.default });
        });

        context("should return", async () => {
            it("correct points for points on curve", async () => {
                expect(await rewardsManager.pointOnCurve(0)).bignumber.to.eq("0");
                expect(await rewardsManager.pointOnCurve(2)).bignumber.to.eq("4");
            });
        });

        context("should integrate", async () => {
            it("from 0 to 6", async () => {
                expect(await rewardsManager.integrateOnCurve(6)).bignumber.to.eq("72");
            });
            it("from 0 to 100", async () => {
                expect(await rewardsManager.integrateOnCurve(100)).bignumber.to.eq("333333");
            });
        });

        context("should return segment on curve", async () => {
            it("positive part of curve from 0 to 100", async () => {
                expect(await rewardsManager.segmentOnCurve(0, 100)).bignumber.to.eq("333333");
            });
            it("negative part of curve from -100 to 0", async () => {
                expect(await rewardsManager.segmentOnCurve(-100, 0)).bignumber.to.eq("-333333");
            });
            it("positive part of curve from 2 to 4", async () => {
                expect(await rewardsManager.segmentOnCurve(2, 4)).bignumber.to.eq("19");
            });
            it("negative part of curve from -4 to -2", async () => {
                expect(await rewardsManager.segmentOnCurve(-4, -2)).bignumber.to.eq("-19");
            });
            it("crossing y axis part of curve from -2 to 2", async () => {
                expect(await rewardsManager.segmentOnCurve(-2, 2)).bignumber.to.eq("0");
            });
            it("crossing y axis part of curve from -2 to 4", async () => {
                expect(await rewardsManager.segmentOnCurve(-2, 4)).bignumber.to.eq("19");
            });
            it("crossing y axis part of curve from -4 to 2", async () => {
                expect(await rewardsManager.segmentOnCurve(-4, 2)).bignumber.to.eq("-19");
            });
        });
        
    });

    describe("reward calculation", async () => {
        beforeEach(async () => {
            rewardsManager = await RewardsManager.new({ from: sa.default });
            await rewardsManager.initialize({ from: sa.default });
        });

        context("should calculate reward", async () => {
            it("deviation from 0 to 100", async () => {
                expect(await rewardsManager.calculateReward(0, 100)).bignumber.to.eq("333333");
            });
            it("deviation from -100 to 0", async () => {
                expect(await rewardsManager.calculateReward(-100, 0)).bignumber.to.eq("-333333");
            });
            it("deviation from 2 to 4", async () => {
                expect(await rewardsManager.calculateReward(2, 4)).bignumber.to.eq("19");
            });
            it("deviation from -4 to -2", async () => {
                expect(await rewardsManager.calculateReward(-4, -2)).bignumber.to.eq("-19");
            });
            it("deviation from -2 to 2", async () => {
                expect(await rewardsManager.calculateReward(-2, 2)).bignumber.to.eq("0");
            });
            it("deviation from -2 to 4", async () => {
                expect(await rewardsManager.calculateReward(-2, 4)).bignumber.to.eq("19");
            });
            it("deviation from -4 to 2", async () => {
                expect(await rewardsManager.calculateReward(-4, 2)).bignumber.to.eq("-19");
            });
        });
        
    });
});
