/* eslint-disable no-loop-func */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-plusplus */
import { expectRevert } from "@openzeppelin/test-helpers";

import { BN } from "@utils/tools";
import { StandardAccounts } from "@utils/standardAccounts";
import { RewardsManagerInstance } from "types/generated";
import { SLOPE, RATIO_PRECISION, calculateReward, calculateDeviation } from "./utils";

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
                await rewardsManager.initialize(400, 1000, { from: sa.default });
                await expectRevert(rewardsManager.initialize(400, 1000, { from: sa.default }), "already initialized");
            });
            it("when slope is equal to zero", async () => {
                await expectRevert(rewardsManager.initialize(0, 1000, { from: sa.default }), "slope must be > 0");
            });
            it("when precision is not a power of 10", async () => {
                await expectRevert(rewardsManager.initialize(10, 55), "precision must be a power of 10");
            });
        });

        context("shoud succeed", async () => {
            it("with proper slope", async () => {
                await rewardsManager.initialize(400, 1000, { from: sa.default });
                expect(await rewardsManager.getSlope()).bignumber.to.eq("400");
            });
        });
    });

    describe("calculateReward", async () => {
        beforeEach(async () => {
            rewardsManager = await RewardsManager.new({ from: sa.default });
            await rewardsManager.initialize(SLOPE, RATIO_PRECISION, { from: sa.default });
        });

        context("should calculate for 2 assets in pool, unbalanced pool", async () => {
            const numberOfPoints = 8;
            const startingPoint = 0;
            const maxValue = 1600;
            const step = maxValue / numberOfPoints;

            let depositValue = startingPoint;

            const targetRatios = [new BN(500), new BN(500)];
            const checkIntegrateForPoint = (amount: BN) => {
                const asset1Amount = new BN(maxValue);
                const asset2Amount = new BN(700);

                const {
                    total,
                    deviation
                } = calculateDeviation(targetRatios, [asset1Amount, asset2Amount]);

                const {
                    total: totalAfter,
                    deviation: deviationAfter
                } = calculateDeviation(targetRatios, [asset1Amount.add(amount), asset2Amount]);

                const expectedValue = calculateReward(deviation, deviationAfter, total, totalAfter);

                it(`${!amount.isNeg() ? "Ascending" : "Descending"} deviation from ${deviation.toString()} to ${deviationAfter.toString()} should equal ${expectedValue.toString()}
                    (Assets amounts in pool: ${asset1Amount.add(amount).toString()}, ${asset2Amount.toString()}})
                    `, async () => {
                    expect(await rewardsManager.calculateReward(deviation, deviationAfter, total, totalAfter)).bignumber.to.eq(
                        expectedValue,
                        "invalid value"
                    );
                });
            };

            // ----- deposit -----
            for (let i = 0; i <= numberOfPoints; i++) {
                checkIntegrateForPoint(new BN(depositValue));

                depositValue += step;
            }

            // ----- redeem -----
            let redeemValue = startingPoint;

            for (let i = 0; i <= numberOfPoints; i++) {
                checkIntegrateForPoint(new BN(redeemValue));

                redeemValue -= step;
            }
        });

        context("should calculate for 3 assets in pool, unbalanced pool", async () => {
            const numberOfPoints = 6;
            const startingPoint = 0;
            const maxValue = 600;
            const step = maxValue / numberOfPoints;

            let depositValue = startingPoint;

            const targetRatios = [new BN(300), new BN(300), new BN(400)];
            const checkIntegrateForPoint = (amount: BN) => {
                const asset1Amount = new BN(maxValue);
                const asset2Amount = new BN(700);
                const asset3Amount = new BN(800);

                const {
                    total,
                    deviation
                } = calculateDeviation(targetRatios, [asset1Amount, asset2Amount, asset3Amount]);

                const {
                    total: totalAfter,
                    deviation: deviationAfter
                } = calculateDeviation(targetRatios, [asset1Amount.add(amount), asset2Amount, asset3Amount]);

                const expectedValue = calculateReward(deviation, deviationAfter, total, totalAfter);

                it(`${!amount.isNeg() ? "Ascending" : "Descending"} deviation from ${deviation.toString()} to ${deviationAfter.toString()} should equal ${expectedValue.toString()}
                    (Assets amounts in pool: ${asset1Amount.add(amount).toString()}, ${asset2Amount.toString()}, ${asset3Amount.toString()})
                    `, async () => {
                    expect(await rewardsManager.calculateReward(deviation, deviationAfter, total, totalAfter)).bignumber.to.eq(
                        expectedValue,
                        "invalid value"
                    );
                });
            };

            // ----- deposit -----
            for (let i = 0; i <= numberOfPoints; i++) {
                checkIntegrateForPoint(new BN(depositValue));

                depositValue += step;
            }

            // ----- redeem -----
            let redeemValue = startingPoint;

            for (let i = 0; i <= numberOfPoints; i++) {
                checkIntegrateForPoint(new BN(redeemValue));

                redeemValue -= step;
            }
        });

        context("should fail", async () => {
            it("in case it's not initialized", async () => {
                const manager = await RewardsManager.new({ from: sa.default });
                await expectRevert(
                    manager.calculateReward(1, 2, 10, 11),
                    "not initialized"
                );
            });

            it("in case deviation is greater than 1", async () => {
                rewardsManager = await RewardsManager.new();
                await rewardsManager.initialize(SLOPE, 100);

                await expectRevert(
                    rewardsManager.calculateReward(50, 101, 100, 110),
                    "deviaiton must be less than 1"
                );
            });
        });
    });
});
