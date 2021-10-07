/* eslint-disable no-loop-func */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-plusplus */
import { expectRevert } from "@openzeppelin/test-helpers";

import { BN } from "@utils/tools";
import { StandardAccounts } from "@utils/standardAccounts";
import { RewardsManagerInstance } from "types/generated";
import { SLOPE, DEVIATION_PRECISION, calculateReward } from "./utils";

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
                await expectRevert(rewardsManager.initialize(0, 1000, { from: sa.default }), "max value must be greater than 0");
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
            await rewardsManager.initialize(SLOPE, DEVIATION_PRECISION, { from: sa.default });
        });

        context("should calculate deposit reward", async () => {
            const numberOfPoints = 8;
            const startingPoint = Math.floor(Math.random() * -2 * MAX_VALUE.toNumber());
            const step = Math.floor(4 * MAX_VALUE.toNumber() / numberOfPoints);

            let point = startingPoint;

            const checkIntegrateForPoint = (_point: number, isAsc: boolean) => {
                let point2 = 0;
                if (isAsc) {
                    point2 = Math.floor(_point + Math.random() * step * 2);
                } else {
                    point2 = Math.floor(_point - Math.random() * step * 2);
                }

                const deviaion = 
                const total =
                const deviationAfter =
                const totalAfter = 

                const expectedValue = calculateReward(deviaion, deviationAfter, total, totalAfter);

                it(`${isAsc ? "Ascending" : "Descending"} deviation from (${_point} to ${point2}) should equal ${expectedValue.toString()}`, async () => {
                    expect(await rewardsManager.calculateReward(deviaion, deviationAfter, total, totalAfter)).bignumber.to.eq(
                        expectedValue,
                        `invalid value for (${_point} to ${point2})`
                    );
                });
            };

            for (let i = 0; i < numberOfPoints; i++) {
                checkIntegrateForPoint(point, true);

                point += step;
            }

            let reversePoint = startingPoint * -1;

            for (let i = 0; i < numberOfPoints; i++) {
                checkIntegrateForPoint(reversePoint, false);

                reversePoint -= step;
            }
        });

        //     context("should calculate deposit reward; deviationBefore == deviationAfter", async () => {
        //         const numberOfPoints = 8;
        //         const startingPoint = Math.floor(Math.random() * -2 * MAX_VALUE.toNumber());
        //         const step = Math.floor(4 * MAX_VALUE.toNumber() / numberOfPoints);

        //         let point = startingPoint;

        //         const checkValueForPoint = (_point: number) => {
        //             const expectedValue = calculateCurveValue(new BN(_point), MAX_VALUE, SLOPE, 1000).neg();

        //             it(`Point ${_point} should equal ${expectedValue.toString()}`, async () => {
        //                 expect(await rewardsManager.calculateReward(_point, _point, true)).bignumber.to.eq(
        //                     expectedValue,
        //                     `invalid value for ${_point}`
        //                 );
        //             });
        //         };

        //         for (let i = 0; i < numberOfPoints; i++) {
        //             checkValueForPoint(point);

        //             point += step;
        //         }
        //     });

        //     context("should calculate redeem reward", async () => {
        //         const numberOfPoints = 8;
        //         const startingPoint = Math.floor(Math.random() * -2 * MAX_VALUE.toNumber());
        //         const step = Math.floor(4 * MAX_VALUE.toNumber() / numberOfPoints);

        //         let point = startingPoint;

        //         const checkIntegrateForPoint = (_point: number, isAsc: boolean) => {
        //             let point2 = 0;
        //             if (isAsc) {
        //                 point2 = Math.floor(_point + Math.random() * step * 2);
        //             } else {
        //                 point2 = Math.floor(_point - Math.random() * step * 2);
        //             }
        //             let expectedValue = calculateCurve(new BN(point2), MAX_VALUE, SLOPE, 1000).sub(calculateCurve(new BN(_point), MAX_VALUE, SLOPE, 1000));
        //             if (!isAsc) {
        //                 expectedValue = expectedValue.neg();
        //             }

        //             it(`${isAsc ? "Ascending" : "Descending"} deviation from (${_point} to ${point2}) should equal ${expectedValue.toString()}`, async () => {
        //                 expect(await rewardsManager.calculateReward(_point, point2, false)).bignumber.to.eq(
        //                     expectedValue,
        //                     `invalid value for (${_point} to ${point2})`
        //                 );
        //             });
        //         };

        //         for (let i = 0; i < numberOfPoints; i++) {
        //             checkIntegrateForPoint(point, true);

        //             point += step;
        //         }

        //         let reversePoint = startingPoint * -1;

        //         for (let i = 0; i < numberOfPoints; i++) {
        //             checkIntegrateForPoint(reversePoint, false);

        //             reversePoint -= step;
        //         }
        //     });

        //     context("should calculate redeem reward; deviationBefore == deviationAfter", async () => {
        //         const numberOfPoints = 8;
        //         const startingPoint = Math.floor(Math.random() * -2 * MAX_VALUE.toNumber());
        //         const step = Math.floor(4 * MAX_VALUE.toNumber() / numberOfPoints);

        //         let point = startingPoint;

        //         const checkValueForPoint = (_point: number) => {
        //             const expectedValue = calculateCurveValue(new BN(_point), MAX_VALUE, SLOPE, 1000);

        //             it(`Point ${_point} should equal ${expectedValue.toString()}`, async () => {
        //                 expect(await rewardsManager.calculateReward(_point, _point, false)).bignumber.to.eq(
        //                     expectedValue,
        //                     `invalid value for ${_point}`
        //                 );
        //             });
        //         };

        //         for (let i = 0; i < numberOfPoints; i++) {
        //             checkValueForPoint(point);

        //             point += step;
        //         }
        //     });

        context("should fail", async () => {
            it("in case it's not initialized", async () => {
                const manager = await RewardsManager.new({ from: sa.default });
                await expectRevert(
                    manager.calculateReward(1, 2, 10, 11),
                    "not initialized"
                );
            });
        });
    });
});
