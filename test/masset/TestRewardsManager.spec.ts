import { expectRevert, expectEvent } from "@openzeppelin/test-helpers";

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
                await rewardsManager.initialize(1, { from: sa.default });
                await expectRevert(rewardsManager.initialize(1, { from: sa.default }), "already initialized");
            });
            it("when aDenominator is less or equal to zero", async () => {
                await expectRevert(rewardsManager.initialize(-1, { from: sa.default }), "x^2/A: A must be greater than zero.");
            });
        });

        context("shoud succeed", async () => {
            it("with proper aDenominator", async () => {
                await rewardsManager.initialize(1, { from: sa.default });

                expect(await rewardsManager.getACurveDenominator()).bignumber.to.eq("1");
            });
        });
    });

    describe("pointOnCurve", async () => {
        beforeEach(async () => {
            rewardsManager = await RewardsManager.new({ from: sa.default });
            await rewardsManager.initialize(1, { from: sa.default });
        });

        context("should fail", async () => {
            it("when x is less than zero", async () => {
                await expectRevert(rewardsManager.valueOnCurve(-1), "x must be greater than equal to 0");
            });
        });

        context("should calculate", async () => {
            it("correct points for points on curve", async () => {
                expect(await rewardsManager.pointOnCurve(0)).bignumber.to.eq("0");
                expect(await rewardsManager.pointOnCurve(2)).bignumber.to.eq("4");
                expect(await rewardsManager.pointOnCurve(100)).bignumber.to.eq("10000");

                expect(await rewardsManager.pointOnCurve(-2)).bignumber.to.eq("-4");
                expect(await rewardsManager.pointOnCurve(-100)).bignumber.to.eq("-10000");
            });
        });
    });

    describe("integrateOnCurve", async () => {
        beforeEach(async () => {
            rewardsManager = await RewardsManager.new({ from: sa.default });
            await rewardsManager.initialize(1, { from: sa.default });
        });

        context("should fail", async () => {
            it("when x is less than zero", async () => {
                await expectRevert(rewardsManager.integrateOnCurve(-1), "x must be greater than equal to 0");
            });
        });

        context("should calculate", async () => {
            it("from 0 to 6", async () => {
                expect(await rewardsManager.integrateOnCurve(6)).bignumber.to.eq("72");
            });
            it("from 0 to 100", async () => {
                expect(await rewardsManager.integrateOnCurve(100)).bignumber.to.eq("333333");
            });
        });
    });

    describe("segmentOnCurve", async () => {
        beforeEach(async () => {
            rewardsManager = await RewardsManager.new({ from: sa.default });
            await rewardsManager.initialize(1, { from: sa.default });
        });

        context("should calculate segment on curve", async () => {
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

    describe("calculateReward", async () => {
        beforeEach(async () => {
            rewardsManager = await RewardsManager.new({ from: sa.default });
            await rewardsManager.initialize(1, { from: sa.default });
        });

        context("should calculate deposit reward, curve aDenominator=1", async () => {
            it("ratio deviation = 0", async () => {
                expect(await rewardsManager.calculateReward(0, 0, true)).bignumber.to.eq("0");
            });
            it("ratio deviation = 100", async () => {
                expect(await rewardsManager.calculateReward(100, 100, true)).bignumber.to.eq("-10000");
            });
            it("ratio deviation from 99 to 101", async () => {
                expect(await rewardsManager.calculateReward(100, 101, true)).bignumber.to.eq("-10100");
            });
            it("ratio deviation from 0 to 100", async () => {
                expect(await rewardsManager.calculateReward(0, 100, true)).bignumber.to.eq("-333333");
            });
            it("ratio deviation from -100 to 0", async () => {
                expect(await rewardsManager.calculateReward(-100, 0, true)).bignumber.to.eq("333333");
            });
            it("ratio deviation from 2 to 4", async () => {
                expect(await rewardsManager.calculateReward(2, 4, true)).bignumber.to.eq("-19");
            });
            it("ratio deviation from -4 to -2", async () => {
                expect(await rewardsManager.calculateReward(-4, -2, true)).bignumber.to.eq("19");
            });
            it("ratio deviation from -2 to 2", async () => {
                expect(await rewardsManager.calculateReward(-2, 2, true)).bignumber.to.eq("0");
            });
            it("ratio deviation from -2 to 4", async () => {
                expect(await rewardsManager.calculateReward(-2, 4, true)).bignumber.to.eq("-19");
            });
            it("ratio deviation from -4 to 2", async () => {
                expect(await rewardsManager.calculateReward(-4, 2, true)).bignumber.to.eq("19");
            });
        });

        context("should calculate withdrawal reward, curve aDenominator=1", async () => {
            it("ratio deviation = 0", async () => {
                expect(await rewardsManager.calculateReward(0, 0, false)).bignumber.to.eq("0");
            });
            it("ratio deviation = 100", async () => {
                expect(await rewardsManager.calculateReward(100, 100, false)).bignumber.to.eq("10000");
            });
            it("ratio deviation from 99 to 101", async () => {
                expect(await rewardsManager.calculateReward(100, 101, false)).bignumber.to.eq("10100");
            });
            it("ratio deviation from 0 to 100", async () => {
                expect(await rewardsManager.calculateReward(0, 100, false)).bignumber.to.eq("333333");
            });
            it("ratio deviation from -100 to 0", async () => {
                expect(await rewardsManager.calculateReward(-100, 0, false)).bignumber.to.eq("-333333");
            });
            it("ratio deviation from 2 to 4", async () => {
                expect(await rewardsManager.calculateReward(2, 4, false)).bignumber.to.eq("19");
            });
            it("ratio deviation from -4 to -2", async () => {
                expect(await rewardsManager.calculateReward(-4, -2, false)).bignumber.to.eq("-19");
            });
            it("ratio deviation from -2 to 2", async () => {
                expect(await rewardsManager.calculateReward(-2, 2, false)).bignumber.to.eq("0");
            });
            it("ratio deviation from -2 to 4", async () => {
                expect(await rewardsManager.calculateReward(-2, 4, false)).bignumber.to.eq("19");
            });
            it("ratio deviation from -4 to 2", async () => {
                expect(await rewardsManager.calculateReward(-4, 2, false)).bignumber.to.eq("-19");
            });
        });
        
        context("should fail", async () => {
            it("in case it's not initialized", async () => {
                const manager = await RewardsManager.new({ from: sa.default });
                await expectRevert(
                    manager.calculateReward(0, 4, true),
                    "not initialized"
                );
            });
        });
    });

    describe("calculateReward", async () => {
        beforeEach(async () => {
            rewardsManager = await RewardsManager.new({ from: sa.default });
            await rewardsManager.initialize(340, { from: sa.default });
        });

        context("should calculate deposit reward, curve aDenominator=340", async () => {
            it("ratio deviation = 1024", async () => {
                expect(await rewardsManager.calculateReward(1024, 1024, true)).bignumber.to.eq("-3084");
            });

            it("ratio deviation from 0 to 1", async () => {
                expect(await rewardsManager.calculateReward(0, 1, true)).bignumber.to.eq("0");
            });
            it("ratio deviation from 0 to 100", async () => {
                expect(await rewardsManager.calculateReward(0, 100, true)).bignumber.to.eq("-980");
            });
        });

        context("should calculate withdrawal reward, curve aDenominator=340", async () => {
            it("ratio deviation = 1024", async () => {
                expect(await rewardsManager.calculateReward(1024, 1024, false)).bignumber.to.eq("3084");
            });

            it("ratio deviation from 0 to 1", async () => {
                expect(await rewardsManager.calculateReward(0, 1, false)).bignumber.to.eq("0");
            });
            it("ratio deviation from 0 to 100", async () => {
                expect(await rewardsManager.calculateReward(0, 100, false)).bignumber.to.eq("980");
            });
        });
    });

    describe("setACurveDenominator", async () => {
        let admin: string;

        beforeEach(async () => {
            admin = sa.governor;
            rewardsManager = await RewardsManager.new({ from: admin });
            await rewardsManager.initialize(340, { from: admin });
        });

        context("should fail", async () => {
            it("when it's not called by admin", async () => {
                await expectRevert(
                    rewardsManager.setACurveDenominator("123"),
                    "VM Exception while processing transaction: reverted with reason string 'InitializableOwnable: caller is not the owner'"
                );
            });

            it("when aDominator is not valid", async () => {
                await expectRevert(
                    rewardsManager.setACurveDenominator(0, { from: admin }),
                    "VM Exception while processing transaction: reverted with reason string 'x^2/A: A must be greater than zero.'"
                );
            });
        });

        context("should succeed", async () => {
            it("when it's called by admin", async () => {
                const aDominator = new BN("123");

                const tx = await rewardsManager.setACurveDenominator(aDominator, { from: admin });
                expect (await rewardsManager.getACurveDenominator()).bignumber.to.eq(aDominator);

                await expectEvent(tx.receipt, "ADenominatorChanged", { aDominator });
            });
        });
    });
});
