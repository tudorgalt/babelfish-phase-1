/* eslint-disable no-loop-func */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-plusplus */
import { expectRevert } from "@openzeppelin/test-helpers";

import { BN } from "@utils/tools";
import { StandardAccounts } from "@utils/standardAccounts";
import { RewardsManagerInstance } from "types/generated";
import { calculateCurve, calculateCurveValue, MAX_VALUE, SLOPE } from "./utils";

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
                await rewardsManager.initialize(1000, 900, 1000, { from: sa.default });
                await expectRevert(rewardsManager.initialize(1000, 900, 1000, { from: sa.default }), "already initialized");
            });
            it("when maxValue and slope is equal to zero", async () => {
                await expectRevert(rewardsManager.initialize(0, 0, 1000, { from: sa.default }), "max value must be greater than 0");
            });
        });

        context("shoud succeed", async () => {
            it("with proper aDenominator", async () => {
                await rewardsManager.initialize(1000, 900, 1000, { from: sa.default });

                expect(await rewardsManager.getMaxValue()).bignumber.to.eq("1000");
                expect(await rewardsManager.getSlope()).bignumber.to.eq("900");
            });
        });
    });

    describe("pointOnCurve", async () => {
        beforeEach(async () => {
            rewardsManager = await RewardsManager.new({ from: sa.default });
            await rewardsManager.initialize(MAX_VALUE, SLOPE, 1000, { from: sa.default });
        });

        context("should calculate point on curve", async () => {
            const numberOfPoints = 8;
            const startingPoint = Math.floor(Math.random() * -2 * MAX_VALUE.toNumber());

            const step = Math.floor(4 * MAX_VALUE.toNumber() / numberOfPoints);

            let point = startingPoint;

            const checkValueForPoint = (_point: number) => {
                const expectedValue = calculateCurveValue(new BN(_point), MAX_VALUE, SLOPE, 1000);
                it(`Point ${_point} should equal ${expectedValue.toString()}`, async () => {
                    expect(await rewardsManager.pointOnCurve(_point)).bignumber.to.eq(
                        expectedValue,
                        `invalid value for ${_point}`
                    );
                });
            };

            for (let i = 0; i < numberOfPoints; i++) {
                checkValueForPoint(point);

                point += step;
            }
        });
    });

    describe("integrateOnCurve", async () => {
        beforeEach(async () => {
            rewardsManager = await RewardsManager.new({ from: sa.default });
            await rewardsManager.initialize(MAX_VALUE, SLOPE, 1000, { from: sa.default });
        });

        context("should fail", async () => {
            it("when x is less than zero", async () => {
                await expectRevert(rewardsManager.integrateOnCurve(-1), "x must be greater than equal to 0");
            });
        });

        context("should calculate", async () => {
            const numberOfPoints = 8;
            const startingPoint = Math.floor(Math.random() * MAX_VALUE.toNumber());
            const step = Math.floor(2 * MAX_VALUE.toNumber() / numberOfPoints);

            let point = 0;

            const checkIntegrateForPoint = (_point: number) => {
                const expectedValue = calculateCurve(new BN(_point), MAX_VALUE, SLOPE, 1000);

                it(`Point ${_point} should equal ${expectedValue.toString()}`, async () => {
                    expect(await rewardsManager.integrateOnCurve(_point)).bignumber.to.eq(
                        expectedValue,
                        `invalid value for ${_point}`
                    );
                });
            };

            for (let i = 0; i < numberOfPoints; i++) {
                checkIntegrateForPoint(point);

                if (point === 0) {
                    point = startingPoint;
                } else {
                    point += step;
                }
            }
        });
    });

    describe("segmentOnCurve", async () => {
        beforeEach(async () => {
            rewardsManager = await RewardsManager.new({ from: sa.default });
            await rewardsManager.initialize(MAX_VALUE, SLOPE, 1000, { from: sa.default });
        });

        context("should calculate segment on curve", async () => {
            const numberOfPoints = 8;
            const startingPoint = Math.floor(Math.random() * -2 * MAX_VALUE.toNumber());
            const step = Math.floor(4 * MAX_VALUE.toNumber() / numberOfPoints);

            let point = startingPoint;

            const checkIntegrateForPoint = (_point: number) => {
                const point2 = Math.floor(_point + Math.random() * step * 2 + 1);
                const expectedValue = calculateCurve(new BN(point2), MAX_VALUE, SLOPE, 1000).sub(calculateCurve(new BN(_point), MAX_VALUE, SLOPE, 1000));

                it(`Segment from (${_point} to ${point2}) should equal ${expectedValue.toString()}`, async () => {
                    expect(await rewardsManager.segmentOnCurve(_point, point2)).bignumber.to.eq(
                        expectedValue,
                        `invalid value for (${_point} to ${point2})`
                    );
                });
            };

            for (let i = 0; i < numberOfPoints; i++) {
                checkIntegrateForPoint(point);

                point += step;
            }
        });
    });

    describe("calculateReward", async () => {
        beforeEach(async () => {
            rewardsManager = await RewardsManager.new({ from: sa.default });
            await rewardsManager.initialize(MAX_VALUE, SLOPE, 1000, { from: sa.default });
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
                let expectedValue = calculateCurve(new BN(point2), MAX_VALUE, SLOPE, 1000).sub(calculateCurve(new BN(_point), MAX_VALUE, SLOPE, 1000));
                if (isAsc) {
                    expectedValue = expectedValue.neg();
                }

                it(`${isAsc ? "Ascending" : "Descending"} deviation from (${_point} to ${point2}) should equal ${expectedValue.toString()}`, async () => {
                    expect(await rewardsManager.calculateReward(_point, point2, true)).bignumber.to.eq(
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

        context("should calculate deposit reward; deviationBefore == deviationAfter", async () => {
            const numberOfPoints = 8;
            const startingPoint = Math.floor(Math.random() * -2 * MAX_VALUE.toNumber());
            const step = Math.floor(4 * MAX_VALUE.toNumber() / numberOfPoints);

            let point = startingPoint;

            const checkValueForPoint = (_point: number) => {
                const expectedValue = calculateCurveValue(new BN(_point), MAX_VALUE, SLOPE, 1000).neg();

                it(`Point ${_point} should equal ${expectedValue.toString()}`, async () => {
                    expect(await rewardsManager.calculateReward(_point, _point, true)).bignumber.to.eq(
                        expectedValue,
                        `invalid value for ${_point}`
                    );
                });
            };

            for (let i = 0; i < numberOfPoints; i++) {
                checkValueForPoint(point);

                point += step;
            }
        });

        context("should calculate redeem reward", async () => {
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
                let expectedValue = calculateCurve(new BN(point2), MAX_VALUE, SLOPE, 1000).sub(calculateCurve(new BN(_point), MAX_VALUE, SLOPE, 1000));
                if (!isAsc) {
                    expectedValue = expectedValue.neg();
                }

                it(`${isAsc ? "Ascending" : "Descending"} deviation from (${_point} to ${point2}) should equal ${expectedValue.toString()}`, async () => {
                    expect(await rewardsManager.calculateReward(_point, point2, false)).bignumber.to.eq(
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

        context("should calculate redeem reward; deviationBefore == deviationAfter", async () => {
            const numberOfPoints = 8;
            const startingPoint = Math.floor(Math.random() * -2 * MAX_VALUE.toNumber());
            const step = Math.floor(4 * MAX_VALUE.toNumber() / numberOfPoints);

            let point = startingPoint;

            const checkValueForPoint = (_point: number) => {
                const expectedValue = calculateCurveValue(new BN(_point), MAX_VALUE, SLOPE, 1000);

                it(`Point ${_point} should equal ${expectedValue.toString()}`, async () => {
                    expect(await rewardsManager.calculateReward(_point, _point, false)).bignumber.to.eq(
                        expectedValue,
                        `invalid value for ${_point}`
                    );
                });
            };

            for (let i = 0; i < numberOfPoints; i++) {
                checkValueForPoint(point);

                point += step;
            }
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
});
