/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-use-before-define */
import { expectRevert, expectEvent } from "@openzeppelin/test-helpers";
import { BN, tokens } from "@utils/tools";
import envSetup from "@utils/env_setup";
import { ZERO_ADDRESS, FEE_PRECISION, ZERO } from "@utils/constants";
import { StandardAccounts } from "@utils/standardAccounts";
import { Fees } from "types";
import { MockBridgeInstance, MockERC20Instance, TokenInstance, FeesVaultInstance, MassetV4Instance, BasketManagerV4Instance, RewardsVaultInstance } from "types/generated";
import { calculateCurve, createBasketManagerV3, createToken, upgradeBasketManagerToV4 } from "./utils";

const { expect } = envSetup.configure();

const Token = artifacts.require("Token");
const MassetV3 = artifacts.require("MassetV3");
const MassetV4 = artifacts.require("MassetV4");
const MockERC20 = artifacts.require("MockERC20");
const MockBridge = artifacts.require("MockBridge");
const FeesVault = artifacts.require("FeesVault");
const FeesManager = artifacts.require("FeesManager");
const MassetProxy = artifacts.require("MassetProxy");
const RewardsVault = artifacts.require("RewardsVault");
const RewardsManager = artifacts.require("RewardsManager");
const BasketManagerProxy = artifacts.require("BasketManagerProxy");

let standardAccounts: StandardAccounts;

const A_CURVE_DENOMINATOR = new BN(1000);
const INITIAL_RATIOS = [500, 500];

const standardFees: Fees = {
    deposit: new BN(10),
    depositBridge: new BN(20),
    withdrawal: new BN(30),
    withdrawalBridge: new BN(40)
};

contract("MassetV4", async (accounts) => {
    let masset: MassetV4Instance;
    let basketManager: BasketManagerV4Instance;
    let initialBassets: InitialBassets;
    let token: TokenInstance;
    let feesVault: FeesVaultInstance;
    let rewardsVault: RewardsVaultInstance;
    let mockTokenDummy: MockERC20Instance;
    let mockBridge: MockBridgeInstance;

    standardAccounts = new StandardAccounts(accounts);

    before("before all", async () => { });

    describe("initialization", async () => {
        it("sets proper initial state", async () => {
            const { deployedMassetV4, ...deployed } = await initSystem({
                massetConfig: { fees: standardFees },
                basketManagerConfig: { decimals: [18, 18], factors: [1, 1] }
            });

            expect(await deployedMassetV4.getFeesVault()).to.eq(deployed.deployedFeesVault.address);
            expect(await deployedMassetV4.getRewardsVault()).to.eq(deployed.deployedRewardsVault.address);
            expect(await deployedMassetV4.getFeesManager()).to.eq(deployed.deployedFeesManager.address);
            expect(await deployedMassetV4.getRewardsManager()).to.eq(deployed.deployedRewardsManager.address);
            expect(await deployedMassetV4.getVersion()).to.eq("4.0");
            expect(await deployedMassetV4.getToken()).to.eq(deployed.deployedToken.address);
            expect(await deployedMassetV4.getBasketManager()).to.eq(deployed.deployedBasketManagerV4.address);
        });
    });

    describe("mint", async () => {
        const factors = [1, 1];

        beforeEach(async () => {
            const deployed = await initSystem({
                massetConfig: { fees: standardFees },
                basketManagerConfig: { decimals: [18, 18], factors }
            });

            token = deployed.deployedToken;
            masset = deployed.deployedMassetV4;
            feesVault = deployed.deployedFeesVault;
            rewardsVault = deployed.deployedRewardsVault;
            initialBassets = deployed.deployedInitialBassets;
            basketManager = deployed.deployedBasketManagerV4;

            mockTokenDummy = await MockERC20.new("", "", 12, standardAccounts.dummy1, 1);
        });

        context("should succeed", () => {
            it("deposit to empty pool", async () => {
                const sum = tokens(1024);
                const massetQuantity = sum.div(new BN(factors[0]));
                const expectedFee = massetQuantity.mul(standardFees.deposit).div(FEE_PRECISION);
                const expectedReward = ZERO;
                const expectedMassetQuantity = massetQuantity.sub(expectedFee);

                await initialBassets.mockToken1.approve(masset.address, sum, {
                    from: standardAccounts.dummy1,
                });
                const tx = await masset.mint(initialBassets.mockToken1.address, sum, {
                    from: standardAccounts.dummy1,
                });

                await expectEvent(tx.receipt, "Minted", {
                    minter: standardAccounts.dummy1,
                    recipient: standardAccounts.dummy1,
                    massetQuantity: expectedMassetQuantity,
                    bAsset: initialBassets.mockToken1.address,
                    bassetQuantity: sum,
                });

                const balance = await token.balanceOf(standardAccounts.dummy1);
                expect(balance).bignumber.to.eq(expectedMassetQuantity);

                const feesVaultBalance = await token.balanceOf(feesVault.address);
                expect(feesVaultBalance).bignumber.to.eq(expectedFee, "fee should be transfered to vault contract");

                const rewardsVaultBalance = await token.balanceOf(rewardsVault.address);
                expect(rewardsVaultBalance).bignumber.to.eq(expectedReward, "reward should be 0 after first deposit");
            });

            it("deposit to pool with perfect ratio", async () => {
                const { initialFeesVaultBalance } = await initializePool(initialBassets, masset, factors, feesVault, rewardsVault);

                const sum = tokens(INITIAL_RATIOS[0]);

                const depositor = standardAccounts.dummy3;
                await initialBassets.mockToken1.mint(depositor, sum);

                const massetQuantity = sum.div(new BN(factors[0]));
                const expectedFee = massetQuantity.mul(standardFees.deposit).div(FEE_PRECISION);
                /*
                    target ratio: 500%%
                    final ratio: 666%% // 2:1 = 666%%
                    deviation after = 166 // final ratio - target ratio
                */
                const deviationAfter = new BN(166);
                const expectedReward = calculateCurve(deviationAfter); // 1524
                const expectedMassetQuantity = massetQuantity.sub(expectedFee).sub(expectedReward);

                await initialBassets.mockToken1.approve(masset.address, sum, {
                    from: depositor,
                });

                await masset.mint(initialBassets.mockToken1.address, sum, {
                    from: depositor,
                });

                const balance = await token.balanceOf(depositor);
                expect(balance).bignumber.to.eq(expectedMassetQuantity);

                const feesVaultBalance = await token.balanceOf(feesVault.address);
                expect(feesVaultBalance).bignumber.to.eq(
                    initialFeesVaultBalance.add(expectedFee),
                    "fee should be transfered to vault contract"
                );

                const rewardsVaultBalance = await token.balanceOf(rewardsVault.address);
                expect(rewardsVaultBalance).bignumber.to.eq(expectedReward, "reward should be taken");
            });

            it("if all params are valid, amounts that don't divide evenly", async () => {
                const depositor = standardAccounts.dummy3;

                const factor = new BN(1000);
                await basketManager.setFactor(initialBassets.mockToken1.address, factor);
                const { initialFeesVaultBalance } = await initializePool(initialBassets, masset, [factor.toNumber(), 1], feesVault, rewardsVault);

                const sum = new BN(1024);
                await initialBassets.mockToken1.mint(depositor, sum);

                const expectedReminder = sum.mod(factor);
                const bassetsLeft = sum.sub(expectedReminder);
                const massetsToMint = sum.sub(expectedReminder).div(factor);

                const expectedReward = ZERO; // deposit amount is so small use should not get any reward
                const expectedFee = massetsToMint.mul(standardFees.deposit).div(FEE_PRECISION);
                const expectedMassetQuantity = massetsToMint.sub(expectedFee).sub(expectedReward);

                await initialBassets.mockToken1.approve(masset.address, sum, {
                    from: depositor
                });
                const tx = await masset.mint(initialBassets.mockToken1.address, sum, {
                    from: depositor
                });

                await expectEvent(tx.receipt, "Minted", {
                    minter: depositor,
                    recipient: depositor,
                    massetQuantity: expectedMassetQuantity,
                    bAsset: initialBassets.mockToken1.address,
                    bassetQuantity: bassetsLeft,
                });

                const balance = await token.balanceOf(depositor);
                expect(balance).bignumber.to.eq(expectedMassetQuantity);

                const feesvaultBalance = await token.balanceOf(feesVault.address);
                expect(feesvaultBalance).bignumber.to.eq(
                    initialFeesVaultBalance.add(expectedFee),
                    "fee should be transfered to vault contract"
                );

                const rewardsvaultBalance = await token.balanceOf(rewardsVault.address);
                expect(rewardsvaultBalance).bignumber.to.eq(
                    expectedReward,
                    "rewards vault should be empty"
                );
            });
        });

        context("should fail", () => {
            it("if basset is invalid", async () => {
                await expectRevert(
                    masset.mint(ZERO_ADDRESS, 10),
                    "VM Exception while processing transaction: reverted with reason string 'invalid basset'",
                );
            });
            it("if basset is not in the basket", async () => {
                await expectRevert(
                    masset.mint(mockTokenDummy.address, 10),
                    "VM Exception while processing transaction: reverted with reason string 'invalid basset'",
                );
            });
            it("if amount is greater than the balance", async () => {
                await expectRevert(
                    masset.mint(initialBassets.mockToken1.address, 100000),
                    "VM Exception while processing transaction: reverted with reason string 'insufficient balance'",
                );
            });
        });
    });

    describe("mintTo", async () => {
        beforeEach(async () => {
            const deployed = await initSystem({
                massetConfig: { fees: standardFees },
                basketManagerConfig: { decimals: [18, 18], factors: [1, 1] }
            });

            token = deployed.deployedToken;
            masset = deployed.deployedMassetV4;
            feesVault = deployed.deployedFeesVault;
            rewardsVault = deployed.deployedRewardsVault;
            initialBassets = deployed.deployedInitialBassets;
            basketManager = deployed.deployedBasketManagerV4;

            mockTokenDummy = await MockERC20.new("", "", 12, standardAccounts.dummy1, 1);
        });
        context("should succeed", () => {
            it("if all params are valid", async () => {
                const {
                    initialFeesVaultBalance,
                    initialRewardsVaultBalance
                } = await initializePool(initialBassets, masset, [1, 1], feesVault, rewardsVault, [600, 400]);

                const depositor = standardAccounts.dummy3;
                const recipient = standardAccounts.dummy4;

                const sum = tokens(133);
                const expectedFee = sum.mul(standardFees.deposit).div(FEE_PRECISION);
                /*
                    ratioBefore = 600
                    ratioAfter = 646 // 733/1133
                    deviationBefore = 100 // 600 - 500
                    deviationAfter = 146 // 646 - 500
                */
                const deviationBefore = new BN(100); // 600 - 500
                const deviationAfter = new BN(146); // 646 - 500
                const expectedReward = calculateCurve(deviationAfter).sub(calculateCurve(deviationBefore)); // 704
                const expectedMassetQuantity = sum.sub(expectedFee).sub(expectedReward);

                await initialBassets.mockToken1.mint(depositor, sum);

                await initialBassets.mockToken1.approve(masset.address, sum, {
                    from: depositor
                });
                const tx = await masset.mintTo(initialBassets.mockToken1.address, sum, recipient, { from: depositor });

                await expectEvent(tx.receipt, "Minted", {
                    minter: depositor,
                    recipient,
                    massetQuantity: expectedMassetQuantity,
                    bAsset: initialBassets.mockToken1.address,
                    bassetQuantity: sum,
                });

                const depositorMassetBalance = await token.balanceOf(depositor);
                expect(depositorMassetBalance).bignumber.to.eq(ZERO, "depositor should not get any funds");

                const recipientMassetBalance = await token.balanceOf(recipient);
                expect(recipientMassetBalance).bignumber.to.eq(expectedMassetQuantity, "all funds should go to recipient");

                const feesVaultBalance = await token.balanceOf(feesVault.address);
                expect(feesVaultBalance).bignumber.to.eq(
                    initialFeesVaultBalance.add(expectedFee),
                    "fee should be transfered to vault contract"
                );

                const rewardsVaultBalance = await token.balanceOf(rewardsVault.address);
                expect(rewardsVaultBalance).bignumber.to.eq(
                    initialRewardsVaultBalance.add(expectedReward),
                    "should transfer proper amount of reward"
                );
            });
        });
    });

    describe("calculateMint", async () => {
        type CalculateMintResult = Record<"fee" | "reward" | "massetsToMint" | "bassetsToTake", BN>;
        type CheckCalculateMintResultsConfig = {
            massetInstance: MassetV4Instance;
            expected: CalculateMintResult;
            params: Parameters<MassetV4Instance['calculateMint']>;
        };

        const checkCalculateMintResults = async ({ massetInstance, params, expected }: CheckCalculateMintResultsConfig) => {
            const [fee, reward, massetsToMint, bassetsToTake] = await massetInstance.calculateMint(...params);

            expect(fee).bignumber.to.eq(expected.fee, "fee amount is invalid");
            expect(reward).bignumber.to.eq(expected.reward, "reward amount is invalid");
            expect(massetsToMint).bignumber.to.eq(expected.massetsToMint, "massetsToMint amount is invalid");
            expect(bassetsToTake).bignumber.to.eq(expected.bassetsToTake, "bassetsToTake amount is invalid");
        };

        beforeEach(async () => {
            const deployed = await initSystem({
                massetConfig: { fees: standardFees },
                basketManagerConfig: { decimals: [18, 18], factors: [1, 1] }
            });

            masset = deployed.deployedMassetV4;
            feesVault = deployed.deployedFeesVault;
            rewardsVault = deployed.deployedRewardsVault;
            initialBassets = deployed.deployedInitialBassets;
            basketManager = deployed.deployedBasketManagerV4;
        });

        it("to empty pool, equal factors", async () => {
            const mintAmount = tokens(100);
            const fee = mintAmount.mul(standardFees.deposit).div(FEE_PRECISION);

            await checkCalculateMintResults({
                massetInstance: masset,
                params: [initialBassets.mockToken2.address, tokens(100), false],
                expected: {
                    fee,
                    reward: ZERO,
                    bassetsToTake: mintAmount,
                    massetsToMint: mintAmount.sub(fee)
                }
            });
        });

        it("to empty pool, diffrent factors", async () => {
            const factor = new BN(100);
            await basketManager.setFactor(initialBassets.mockToken1.address, factor);

            const bassetsAmount = new BN(9999);
            const reminder = new BN(99);
            const massetsAmount = bassetsAmount.div(factor);
            const fee = massetsAmount.mul(standardFees.deposit).div(FEE_PRECISION);

            await checkCalculateMintResults({
                massetInstance: masset,
                params: [initialBassets.mockToken1.address, bassetsAmount, false],
                expected: {
                    fee,
                    reward: ZERO,
                    bassetsToTake: bassetsAmount.sub(reminder),
                    massetsToMint: massetsAmount.sub(fee)
                }
            });
        });

        it("to balanced pool, equal factors", async () => {
            await initializePool(initialBassets, masset, [1, 1], feesVault, rewardsVault);

            const amount = tokens(79);
            const fee = amount.mul(standardFees.deposit).div(FEE_PRECISION);

            // ratioBefore = 500;
            // deviationBefore = 0;
            // ratioAfter = 536 // 579 / 1079
            const deviationAfter = new BN(36);
            const punishment = calculateCurve(deviationAfter);

            await checkCalculateMintResults({
                massetInstance: masset,
                params: [initialBassets.mockToken1.address, amount, false],
                expected: {
                    fee,
                    reward: punishment.neg(),
                    bassetsToTake: amount,
                    massetsToMint: amount.sub(fee).sub(punishment)
                }
            });
        });

        it("to balanced pool, diffrent factors", async () => {
            const factor = -1000;
            await basketManager.setFactor(initialBassets.mockToken1.address, factor);
            await initializePool(initialBassets, masset, [factor, 1], feesVault, rewardsVault);

            const bassetsAmount = tokens(10);
            const massetsAmount = bassetsAmount.mul(new BN(factor).neg());
            const fee = massetsAmount.mul(standardFees.deposit).div(FEE_PRECISION);

            // ratioBefore = 500;
            // deviationBefore = 0;
            // ratioAfter = 954 // 10500 : 1100
            const deviationAfter = new BN(454);
            const punishment = calculateCurve(deviationAfter);

            await checkCalculateMintResults({
                massetInstance: masset,
                params: [initialBassets.mockToken1.address, bassetsAmount, false],
                expected: {
                    fee,
                    reward: punishment.neg(),
                    bassetsToTake: bassetsAmount,
                    massetsToMint: massetsAmount.sub(fee).sub(punishment)
                }
            });
        });

        it("to unbalanced pool, equal factors", async () => {
            await initializePool(initialBassets, masset, [1, 1], feesVault, rewardsVault, [750, 250]);

            const amount = tokens(100);
            const fee = amount.mul(standardFees.deposit).div(FEE_PRECISION);

            // ratioBefore = 750;
            // ratioAfter = 772 // 850 : 1100
            const deviationBefore = new BN(250);
            const deviationAfter = new BN(272);
            const punishment = calculateCurve(deviationAfter).sub(calculateCurve(deviationBefore));

            await checkCalculateMintResults({
                massetInstance: masset,
                params: [initialBassets.mockToken1.address, amount, false],
                expected: {
                    fee,
                    reward: punishment.neg(),
                    bassetsToTake: amount,
                    massetsToMint: amount.sub(fee).sub(punishment)
                }
            });
        });

        it("to extremly unbalanced pool", async () => {
            await initialBassets.mockToken1.mint(standardAccounts.default, tokens(100));
            await initialBassets.mockToken1.approve(masset.address, tokens(100));
            await masset.mint(initialBassets.mockToken1.address, tokens(100));

            const amount = new BN("100");
            const fee = amount.mul(standardFees.deposit).div(FEE_PRECISION);
            const reward = new BN(0);

            await checkCalculateMintResults({
                massetInstance: masset,
                params: [initialBassets.mockToken2.address, amount, false],
                expected: {
                    fee,
                    reward,
                    bassetsToTake: amount,
                    massetsToMint: amount.sub(fee)
                }
            });
        });

        it("with bridge", async () => {
            await initializePool(initialBassets, masset, [1, 1], feesVault, rewardsVault, [750, 250]);

            const amount = tokens(100);
            const fee = amount.mul(standardFees.depositBridge).div(FEE_PRECISION);
            const punishment = new BN(0); // no rewards through bridge

            await checkCalculateMintResults({
                massetInstance: masset,
                params: [initialBassets.mockToken1.address, amount, true],
                expected: {
                    fee,
                    reward: punishment.neg(),
                    bassetsToTake: amount,
                    massetsToMint: amount.sub(fee).sub(punishment)
                }
            });
        });
    });

    describe("calculateMintRatio", async () => {
        beforeEach(async () => {
            const deployed = await initSystem({
                massetConfig: { fees: standardFees },
                basketManagerConfig: { decimals: [18, 18], factors: [1, 1] }
            });

            masset = deployed.deployedMassetV4;
            initialBassets = deployed.deployedInitialBassets;
            basketManager = deployed.deployedBasketManagerV4;
        });

        it("proper calculations", async () => {
            const factor = new BN(100);
            await basketManager.setFactor(initialBassets.mockToken1.address, factor);

            const bassetAmount = tokens(100);
            const converted = bassetAmount.div(factor);
            const fee = converted.mul(standardFees.deposit).div(FEE_PRECISION);

            const [massetAmount, bassetsTaken] = await masset.calculateMintRatio(initialBassets.mockToken1.address, bassetAmount);

            expect(massetAmount).bignumber.to.eq(converted.sub(fee));
            expect(bassetsTaken).bignumber.to.eq(bassetAmount);
        });
    });

    describe("redeem", async () => {
        const factors = [1, 1];

        beforeEach(async () => {
            const deployed = await initSystem({
                massetConfig: { fees: standardFees },
                basketManagerConfig: { decimals: [18, 18], factors: [1, 1] }
            });

            token = deployed.deployedToken;
            masset = deployed.deployedMassetV4;
            feesVault = deployed.deployedFeesVault;
            rewardsVault = deployed.deployedRewardsVault;
            initialBassets = deployed.deployedInitialBassets;
            basketManager = deployed.deployedBasketManagerV4;

            mockTokenDummy = await MockERC20.new("", "", 12, standardAccounts.dummy1, 1);
        });

        context("should succeed", () => {
            it("if all params are valid", async () => {
                const initialBalance = await initialBassets.mockToken1.balanceOf(standardAccounts.dummy1);
                const sum = new BN(123123).pow(new BN(2));
                const mintFee = sum.mul(standardFees.deposit).div(FEE_PRECISION);

                await initialBassets.mockToken1.approve(masset.address, sum, {
                    from: standardAccounts.dummy1,
                });

                await masset.mint(initialBassets.mockToken1.address, sum, {
                    from: standardAccounts.dummy1,
                });

                const calculated = await basketManager.convertBassetToMassetQuantity(initialBassets.mockToken1.address, sum);
                let mintedMassets = calculated[0];

                mintedMassets = mintedMassets.sub(mintFee);

                const withdrawalFee = mintedMassets.mul(standardFees.withdrawal).div(FEE_PRECISION);
                const withdrawnBassets = mintedMassets.sub(withdrawalFee);

                await token.approve(masset.address, mintedMassets, {
                    from: standardAccounts.dummy1,
                });

                const tx = await masset.redeem(initialBassets.mockToken1.address, mintedMassets, {
                    from: standardAccounts.dummy1,
                });
                await expectEvent(tx.receipt, "Redeemed", {
                    redeemer: standardAccounts.dummy1,
                    recipient: standardAccounts.dummy1,
                    massetQuantity: mintedMassets,
                    bAsset: initialBassets.mockToken1.address,
                    bassetQuantity: withdrawnBassets,
                });

                const massetsBalance = await token.balanceOf(standardAccounts.dummy1);
                expect(massetsBalance).bignumber.to.equal(ZERO);

                const bassetsBalance = await initialBassets.mockToken1.balanceOf(standardAccounts.dummy1);
                expect(bassetsBalance).bignumber.to.equal(initialBalance.sub(mintFee).sub(withdrawalFee));

                const feesVaultBalance = await token.balanceOf(feesVault.address);
                expect(feesVaultBalance).bignumber.to.eq(mintFee.add(withdrawalFee));

                const rewardsVaultBalance = await token.balanceOf(rewardsVault.address);
                expect(rewardsVaultBalance).bignumber.to.eq(ZERO);
            });

            it("redeem from pool with perfect ratio", async () => {
                const { initialFeesVaultBalance } = await initializePool(initialBassets, masset, factors, feesVault, rewardsVault);

                const sum = tokens(INITIAL_RATIOS[0] / 2);

                const depositor = standardAccounts.dummy1;
                await initialBassets.mockToken1.mint(depositor, sum);

                const expectedFee = sum.mul(standardFees.withdrawal).div(FEE_PRECISION);
                /*
                    target ratio: 500%%
                    final ratio: 333%% // 1:2 = 333%%
                */
                const deviationAfter = new BN(167);
                const expectedReward = calculateCurve(deviationAfter);

                const expectedBassetQuantityInMasset = sum.sub(expectedFee).sub(expectedReward);
                const expectedBassetQuantity = expectedBassetQuantityInMasset.mul(new BN(factors[0]));

                const initialMassetBalance = await getBalance(token, depositor);
                const initialBassetBalance = await getBalance(initialBassets.mockToken1, depositor);

                await token.approve(masset.address, sum, {
                    from: depositor,
                });

                await masset.redeem(initialBassets.mockToken1.address, sum, {
                    from: depositor,
                });

                const massetBalance = await token.balanceOf(depositor);
                expect(massetBalance).bignumber.to.eq(initialMassetBalance.sub(sum), "proper amount of massets should be taken");

                const bassetBalance = await initialBassets.mockToken1.balanceOf(depositor);
                expect(bassetBalance).bignumber.to.eq(initialBassetBalance.add(expectedBassetQuantity), "should get proper amount of bassets");

                const feesVaultBalance = await token.balanceOf(feesVault.address);
                expect(feesVaultBalance).bignumber.to.eq(
                    initialFeesVaultBalance.add(expectedFee),
                    "fee should be transfered to vault contract"
                );

                const rewardsVaultBalance = await token.balanceOf(rewardsVault.address);
                expect(rewardsVaultBalance).bignumber.to.eq(expectedReward, "reward should be 0 after first deposit");
            });

            it("redeem from unbalanced pool", async () => {
                await initializePool(initialBassets, masset, factors, feesVault, rewardsVault);
                const depositor = standardAccounts.dummy1;

                const deposit1Sum = tokens(INITIAL_RATIOS[0] / 2);
                await initialBassets.mockToken1.mint(depositor, deposit1Sum);

                await initialBassets.mockToken1.approve(masset.address, deposit1Sum, {
                    from: depositor,
                });

                await masset.mint(initialBassets.mockToken1.address, deposit1Sum, {
                    from: depositor,
                });

                const feesVaultBalanceAfterDeposit = await token.balanceOf(feesVault.address);
                const rewardsVaultBalanceAfterDeposit = await token.balanceOf(rewardsVault.address);
                const massetBalanceAfterDeposit = await getBalance(token, depositor);
                const bassetBalanceAfterDeposit = await getBalance(initialBassets.mockToken1, depositor);

                const redeemSum = tokens(INITIAL_RATIOS[0] / 4);

                const expectedFee = redeemSum.mul(standardFees.withdrawal).div(FEE_PRECISION);
                
                const deviationBefore = new BN(100);
                const deviationAfter = new BN(55);
                const expectedReward = calculateCurve(deviationAfter).sub(calculateCurve(deviationBefore)).neg();

                const expectedBassetQuantityInMasset = redeemSum.sub(expectedFee).add(expectedReward);
                const expectedBassetQuantity = expectedBassetQuantityInMasset.mul(new BN(factors[0]));

                await token.approve(masset.address, redeemSum, { from: depositor });
                await masset.redeem(initialBassets.mockToken1.address, redeemSum, { from: depositor });

                const massetBalance = await token.balanceOf(depositor);
                expect(massetBalance).bignumber.to.eq(
                    massetBalanceAfterDeposit.sub(redeemSum),
                    "proper amount of massets should be taken"
                );

                const bassetBalance = await initialBassets.mockToken1.balanceOf(depositor);
                expect(bassetBalance).bignumber.to.eq(
                    bassetBalanceAfterDeposit.add(expectedBassetQuantity),
                    "should get proper amount of bassets"
                );

                const feesVaultBalance = await token.balanceOf(feesVault.address);
                expect(feesVaultBalance).bignumber.to.eq(
                    feesVaultBalanceAfterDeposit.add(expectedFee),
                    "fee should be transfered to vault contract"
                );

                const rewardsVaultBalance = await token.balanceOf(rewardsVault.address);
                expect(rewardsVaultBalance).bignumber.to.eq(
                    rewardsVaultBalanceAfterDeposit.sub(expectedReward),
                    "reward should be 0 after first deposit"
                );
            });

            it("if all params are valid, amounts that don't divide evenly", async () => {
                const factor = new BN(-10);
                await basketManager.setFactor(initialBassets.mockToken1.address, factor);

                const initialBalance = await initialBassets.mockToken1.balanceOf(standardAccounts.dummy1);
                const sum = new BN(123123);
                const bassetsLeft = sum;
                const massetsToMint = sum.mul(factor.abs());

                const mintFee = massetsToMint.mul(standardFees.deposit).div(FEE_PRECISION);

                await initialBassets.mockToken1.approve(masset.address, sum, {
                    from: standardAccounts.dummy1,
                });

                await masset.mint(initialBassets.mockToken1.address, sum, {
                    from: standardAccounts.dummy1,
                });

                const calculated = await basketManager.convertBassetToMassetQuantity(initialBassets.mockToken1.address, sum);
                let mintedMassets = calculated[0];

                mintedMassets = mintedMassets.sub(mintFee);
                
                let balance = await token.balanceOf(standardAccounts.dummy1);
                expect(balance).bignumber.to.equal(mintedMassets);

                
                balance = await initialBassets.mockToken1.balanceOf(standardAccounts.dummy1);
                expect(balance).bignumber.to.equal(initialBalance.sub(bassetsLeft));
                
                const withdrawalFee = mintedMassets.mul(standardFees.withdrawal).div(FEE_PRECISION);
                const massetsSubFee = mintedMassets.sub(withdrawalFee);
                const withdrawnBassets = massetsSubFee.div(factor.abs());

                const redeemReminder = massetsSubFee.mod(factor.abs());
                const roundedRedeemAmount = massetsSubFee.sub(redeemReminder);

                await token.approve(masset.address, mintedMassets, {
                    from: standardAccounts.dummy1,
                });

                const tx = await masset.redeem(initialBassets.mockToken1.address, mintedMassets, {
                    from: standardAccounts.dummy1,
                });
                await expectEvent(tx.receipt, "Redeemed", {
                    redeemer: standardAccounts.dummy1,
                    recipient: standardAccounts.dummy1,
                    massetQuantity: roundedRedeemAmount.add(withdrawalFee),
                    bAsset: initialBassets.mockToken1.address,
                    bassetQuantity: withdrawnBassets,
                });

                balance = await token.balanceOf(standardAccounts.dummy1);
                expect(balance).bignumber.to.equal(redeemReminder);

                balance = await initialBassets.mockToken1.balanceOf(standardAccounts.dummy1);
                expect(balance).bignumber.to.equal(initialBalance.sub(sum.sub(withdrawnBassets)));

                const feesVaultBalance = await token.balanceOf(feesVault.address);
                expect(feesVaultBalance).bignumber.to.eq(mintFee.add(withdrawalFee));

                const sumOfOperations = mintFee
                    .add(withdrawalFee)
                    .add(redeemReminder)
                    .div(factor.abs()) // convert to bassets
                    .add(withdrawnBassets);

                expect(sumOfOperations).bignumber.to.eq(
                    sum,
                    "check that sum of funds in system after deposit and redeem is the same as before"
                );
            });
        });
        context("should fail", () => {
            it("if basset is invalid", async () => {
                await expectRevert(
                    masset.redeem(ZERO_ADDRESS, 10),
                    "VM Exception while processing transaction: reverted with reason string 'invalid basset'",
                );
            });
            it("if basset is not in the basket", async () => {
                await expectRevert(
                    masset.redeem(mockTokenDummy.address, 10),
                    "VM Exception while processing transaction: reverted with reason string 'invalid basset'",
                );
            });
            it("if amount is greater than the balance", async () => {
                await initialBassets.mockToken1.approve(masset.address, 100, { from: standardAccounts.dummy1 });
                await masset.mint(initialBassets.mockToken1.address, 100, { from: standardAccounts.dummy1 });

                await token.approve(masset.address, 100, { from: standardAccounts.dummy1 });

                await expectRevert(
                    masset.redeem(initialBassets.mockToken1.address, 1000, { from: standardAccounts.dummy1 }),
                    "VM Exception while processing transaction: reverted with reason string 'insufficient balance'"
                );
            });
            it("if amount is greater than balance", async () => {
                const sum = 100;
                await initialBassets.mockToken1.approve(masset.address, sum, { from: standardAccounts.dummy1 });
                await masset.mint(initialBassets.mockToken1.address, sum, { from: standardAccounts.dummy1 });

                await token.approve(masset.address, sum, { from: standardAccounts.dummy1 });

                await expectRevert( // should revert because fee from minting was taken
                    masset.redeem(initialBassets.mockToken1.address, sum, { from: standardAccounts.dummy1 }),
                    "VM Exception while processing transaction: reverted with reason string 'insufficient balance'"
                );
            });
        });
    });

    describe("redeemTo", async () => {
        beforeEach(async () => {
            const deployed = await initSystem({
                massetConfig: { fees: standardFees },
                basketManagerConfig: { decimals: [18, 18], factors: [1, 1] }
            });

            token = deployed.deployedToken;
            masset = deployed.deployedMassetV4;
            feesVault = deployed.deployedFeesVault;
            initialBassets = deployed.deployedInitialBassets;
            basketManager = deployed.deployedBasketManagerV4;
        });

        context("should fail", () => {
            it("when recipient is not valid", async () => {
                await expectRevert(
                    masset.redeemTo(initialBassets.mockToken1.address, tokens(10), ZERO_ADDRESS, { from: standardAccounts.dummy1 }),
                    "VM Exception while processing transaction: reverted with reason string 'must be a valid recipient'"
                );
            });
        });

        context("should succeed", () => {
            it("if all params are valid", async () => {
                const sum = new BN(10).pow(new BN(3));
                const mintFee = sum.mul(standardFees.deposit).div(FEE_PRECISION);
                const withdrawAmount = sum.sub(mintFee);
                const withdrawalFee = withdrawAmount.mul(standardFees.withdrawal).div(FEE_PRECISION);
                const recipient = standardAccounts.dummy2;

                await initialBassets.mockToken1.approve(masset.address, sum, { from: standardAccounts.dummy1 });
                await masset.mint(initialBassets.mockToken1.address, sum, { from: standardAccounts.dummy1 });

                await token.approve(masset.address, withdrawAmount, { from: standardAccounts.dummy1 });

                await masset.redeemTo(initialBassets.mockToken1.address, withdrawAmount, recipient, { from: standardAccounts.dummy1 });

                const tokenBalance = await token.balanceOf(standardAccounts.dummy1);
                expect(tokenBalance).bignumber.to.eq("0");

                const balance = await initialBassets.mockToken1.balanceOf(recipient);
                expect(balance).bignumber.to.equal(withdrawAmount.sub(withdrawalFee), "should transfer bassets to correct recipient");

                const vaultBalance = await token.balanceOf(feesVault.address);
                expect(vaultBalance).bignumber.to.eq(mintFee.add(withdrawalFee));
            });
        });
    });

    describe("redeemToBridge", async () => {
        const mintAmount = tokens(1);
        const mintFee = mintAmount.mul(standardFees.deposit).div(FEE_PRECISION);
        const mintedMassets = mintAmount.sub(mintFee);

        beforeEach(async () => {
            mockBridge = await MockBridge.new();

            const deployed = await initSystem({
                massetConfig: {
                    fees: standardFees,
                    txDetails: { from: standardAccounts.default }
                },
                basketManagerConfig: {
                    factors: [1, 1],
                    decimals: [18, 18],
                    bridges: [mockBridge.address, mockBridge.address]
                }
            });

            token = deployed.deployedToken;
            masset = deployed.deployedMassetV4;
            feesVault = deployed.deployedFeesVault;
            initialBassets = deployed.deployedInitialBassets;
            basketManager = deployed.deployedBasketManagerV4;

            await initialBassets.mockToken1.approve(masset.address, mintAmount, { from: standardAccounts.dummy1 });
            await masset.mint(initialBassets.mockToken1.address, mintAmount, { from: standardAccounts.dummy1 });
            await token.approve(masset.address, mintAmount, { from: standardAccounts.dummy1 });
        });

        context("should fail", () => {
            it("when bridge is not valid", async () => {
                await basketManager.setBridge(
                    initialBassets.mockToken1.address,
                    ZERO_ADDRESS,
                    { from: standardAccounts.default }
                );

                await expectRevert(
                    masset.methods["redeemToBridge(address,uint256,address)"](
                        initialBassets.mockToken1.address,
                        mintedMassets,
                        standardAccounts.dummy2,
                        { from: standardAccounts.dummy1 }
                    ),
                    "VM Exception while processing transaction: reverted with reason string 'invalid bridge'"
                );
            });
        });

        context("should succeed", () => {
            it("if all params are valid", async () => {
                const withdrawalFee = mintedMassets.mul(standardFees.withdrawalBridge).div(FEE_PRECISION);

                await masset.methods["redeemToBridge(address,uint256,address)"](
                    initialBassets.mockToken1.address,
                    mintedMassets,
                    standardAccounts.dummy2,
                    { from: standardAccounts.dummy1 }
                );

                const bridgeBalance = await getBalance(initialBassets.mockToken1, mockBridge.address);
                expect(bridgeBalance).to.bignumber.eq(mintedMassets.sub(withdrawalFee), "should transfer bassets to bridge");

                const vaultBalance = await token.balanceOf(feesVault.address);
                expect(vaultBalance).bignumber.to.eq(mintFee.add(withdrawalFee));
            });
        });
    });

    describe("calculateRedeem", async () => {
        type CalculateRedeemResult = Record<"fee" | "reward" | "bassetsToTransfer" | "massetsToTake", BN>;
        type CheckCalculateRedeemResultsConfig = {
            massetInstance: MassetV4Instance;
            expected: CalculateRedeemResult;
            params: Parameters<MassetV4Instance['calculateRedeem']>;
        };

        const checkCalculateRedeemResults = async ({ massetInstance, params, expected }: CheckCalculateRedeemResultsConfig) => {
            const [fee, reward, bassetsToTransfer, massetsToTake] = await massetInstance.calculateRedeem(...params);

            expect(fee).bignumber.to.eq(expected.fee, "fee amount is invalid");
            expect(reward).bignumber.to.eq(expected.reward, "reward amount is invalid");
            expect(bassetsToTransfer).bignumber.to.eq(expected.bassetsToTransfer, "bassetsToTransfer amount is invalid");
            expect(massetsToTake).bignumber.to.eq(expected.massetsToTake, "massetsToTake amount is invalid");
        };

        beforeEach(async () => {
            const deployed = await initSystem({
                massetConfig: { fees: standardFees },
                basketManagerConfig: { decimals: [18, 18], factors: [1, 1] }
            });

            masset = deployed.deployedMassetV4;
            feesVault = deployed.deployedFeesVault;
            rewardsVault = deployed.deployedRewardsVault;
            initialBassets = deployed.deployedInitialBassets;
            basketManager = deployed.deployedBasketManagerV4;
        });

        it("to balanced pool, equal factors", async () => {
            await initializePool(initialBassets, masset, [1, 1], feesVault, rewardsVault);

            const amount = tokens(79);
            const fee = amount.mul(standardFees.withdrawal).div(FEE_PRECISION);

            // ratioBefore = 500;
            // deviationBefore = 0;
            // ratioAfter = 457 // 421 / 921
            const deviationAfter = new BN(43);
            const punishment = calculateCurve(deviationAfter);

            await checkCalculateRedeemResults({
                massetInstance: masset,
                params: [initialBassets.mockToken1.address, amount, false],
                expected: {
                    fee,
                    reward: punishment.neg(),
                    bassetsToTransfer: amount.sub(fee).sub(punishment),
                    massetsToTake: amount.sub(fee).sub(punishment)
                }
            });
        });

        it("to balanced pool, diffrent factors", async () => {
            const factor = -1000;
            await basketManager.setFactor(initialBassets.mockToken1.address, factor);
            await initializePool(initialBassets, masset, [factor, 1], feesVault, rewardsVault);

            const massetsAmount = tokens(30);
            const fee = massetsAmount.mul(standardFees.withdrawal).div(FEE_PRECISION);

            const deviationAfter = new BN(16);
            const punishment = calculateCurve(deviationAfter);

            const massetsToTake = massetsAmount.sub(fee).sub(punishment);
            const reminder = massetsToTake.mod(new BN(factor).neg());
            const bassetsAmount = massetsToTake.div(new BN(factor).neg());

            await checkCalculateRedeemResults({
                massetInstance: masset,
                params: [initialBassets.mockToken1.address, massetsAmount, false],
                expected: {
                    fee,
                    reward: punishment.neg(),
                    bassetsToTransfer: bassetsAmount,
                    massetsToTake: massetsToTake.sub(reminder)
                }
            });
        });

        it("with bridge", async () => {
            await initializePool(initialBassets, masset, [1, 1], feesVault, rewardsVault, [750, 250]);

            const amount = tokens(100);
            const fee = amount.mul(standardFees.withdrawalBridge).div(FEE_PRECISION);
            const reward = new BN(0); // no rewards through bridge

            await checkCalculateRedeemResults({
                massetInstance: masset,
                params: [initialBassets.mockToken1.address, amount, true],
                expected: {
                    fee,
                    reward,
                    bassetsToTransfer: amount.sub(fee),
                    massetsToTake: amount.sub(fee)
                }
            });
        });
    });

    describe("calculateRedeemRatio", async () => {
        beforeEach(async () => {
            const deployed = await initSystem({
                massetConfig: { fees: standardFees },
                basketManagerConfig: { decimals: [18, 18], factors: [1, 1] }
            });

            masset = deployed.deployedMassetV4;
            feesVault = deployed.deployedFeesVault;
            rewardsVault = deployed.deployedRewardsVault;
            initialBassets = deployed.deployedInitialBassets;
            basketManager = deployed.deployedBasketManagerV4;
        });

        it("proper calculations", async () => {
            const factor = new BN(-10);
            await initializePool(initialBassets, masset, [factor.toNumber(), 1], feesVault, rewardsVault, [500, 500]);
            await basketManager.setFactor(initialBassets.mockToken1.address, factor);

            // make deposit to get some funds in vault
            await initialBassets.mockToken1.mint(standardAccounts.default, tokens(10));
            await initialBassets.mockToken1.approve(masset.address, tokens(10));
            await masset.mint(initialBassets.mockToken1.address, tokens(10));

            { // ----- redeem of 1 basset (should get reward) -----
                const massetAmount = tokens(3);
                const fee = massetAmount.mul(standardFees.withdrawal).div(FEE_PRECISION);
                const deviationBefore = new BN(45);
                const deviationAfter = new BN(44);
                const reward = calculateCurve(deviationBefore).sub(calculateCurve(deviationAfter));
                const massetsToTake = massetAmount.sub(fee);

                const converted = (massetsToTake.add(reward)).div(factor.neg());
                const reminder = (massetsToTake.add(reward)).mod(factor.neg());

                const [bassetAmount, massetsTaken] = await masset.calculateRedeemRatio(initialBassets.mockToken1.address, massetAmount);

                expect(massetsTaken).bignumber.to.eq(massetAmount.sub(reminder));
                expect(bassetAmount).bignumber.to.eq(converted);
            }
            { // ----- redeem of 2 basset (should be punished) -----
                const amount = tokens(3);
                const fee = amount.mul(standardFees.withdrawal).div(FEE_PRECISION);
                const deviationBefore = new BN(45);
                const deviationAfter = new BN(44); // 503/1103
                const punishment = calculateCurve(deviationAfter).sub(calculateCurve(deviationBefore)).neg();

                const [bassetAmount, massetsTaken] = await masset.calculateRedeemRatio(initialBassets.mockToken2.address, amount);

                expect(massetsTaken).bignumber.to.eq(amount);
                expect(bassetAmount).bignumber.to.eq(amount.sub(punishment).sub(fee));
            }
        });
    });

    describe("onTokensMinted", async () => {
        beforeEach(async () => {
            mockBridge = await MockBridge.new();

            const deployed = await initSystem({
                massetConfig: { fees: standardFees },
                basketManagerConfig: {
                    factors: [1, 1],
                    decimals: [18, 18],
                    bridges: [mockBridge.address, mockBridge.address]
                }
            });

            token = deployed.deployedToken;
            masset = deployed.deployedMassetV4;
            feesVault = deployed.deployedFeesVault;
            initialBassets = deployed.deployedInitialBassets;
            basketManager = deployed.deployedBasketManagerV4;
        });

        context("should fail", async () => {
            it("when it's not called by bridge", async () => {
                await expectRevert(
                    masset.onTokensMinted(
                        tokens(1),
                        initialBassets.mockToken1.address,
                        web3.eth.abi.encodeParameters(['bytes'], [standardAccounts.dummy1]),
                        { from: standardAccounts.default }
                    ),
                    "VM Exception while processing transaction: reverted with reason string 'only bridge may call'"
                );
            });

            it("when recipient address is invalid", async () => {
                await expectRevert(
                    mockBridge.callOnTokensMinted(
                        masset.address,
                        tokens(1),
                        initialBassets.mockToken1.address,
                        ZERO_ADDRESS,
                        { from: standardAccounts.default }
                    ),
                    "VM Exception while processing transaction: reverted with reason string 'Converter: Error decoding extraData'"
                );
            });

            it("when amount is zero", async () => {
                await expectRevert(
                    mockBridge.callOnTokensMinted(
                        masset.address,
                        tokens(0),
                        initialBassets.mockToken1.address,
                        standardAccounts.dummy1,
                        { from: standardAccounts.default }
                    ),
                    "VM Exception while processing transaction: reverted with reason string 'amount must be > 0'"
                );
            });

            it("when basset is invalid", async () => {
                await expectRevert(
                    mockBridge.callOnTokensMinted(
                        masset.address,
                        tokens(1),
                        standardAccounts.other,
                        standardAccounts.dummy1,
                        { from: standardAccounts.default }
                    ),
                    "VM Exception while processing transaction: reverted with reason string 'invalid basset'"
                );
            });


            it("when basket is out of balance", async () => {
                await basketManager.setRange(initialBassets.mockToken1.address, 0, 10, { from: standardAccounts.default });

                await expectRevert(
                    mockBridge.callOnTokensMinted(
                        masset.address,
                        tokens(10000),
                        initialBassets.mockToken1.address,
                        standardAccounts.dummy1,
                        { from: standardAccounts.default }
                    ),
                    "VM Exception while processing transaction: reverted with reason string 'basket out of balance'"
                );
            });
        });

        context("should succeed", async () => {
            it("whit all valid params", async () => {
                const amount = tokens(1);
                const expectedFee = amount.mul(standardFees.depositBridge).div(FEE_PRECISION);
                const expectedMassetQuantity = amount.sub(expectedFee);

                const recipient = standardAccounts.dummy1;

                const recepit = await mockBridge.callOnTokensMinted(
                    masset.address,
                    amount,
                    initialBassets.mockToken1.address,
                    recipient,
                    { from: standardAccounts.default }
                );

                await expectEvent.inTransaction(recepit.tx, MassetV3, "Minted", {
                    minter: mockBridge.address,
                    recipient,
                    massetQuantity: expectedMassetQuantity,
                    bAsset: initialBassets.mockToken1.address,
                    bassetQuantity: amount,
                }, {});

                const balance = await token.balanceOf(recipient);
                expect(balance).bignumber.to.eq(expectedMassetQuantity, "should mint proper amount of tokens to recipient");

                const vaultBalance = await token.balanceOf(feesVault.address);
                expect(vaultBalance).bignumber.to.eq(expectedFee, "should mint proper amount of tokens to recipient");
            });
        });
    });

    describe("precision conversion", async () => {
        const basset1Factor = new BN(100);
        const basset2Factor = new BN(-1000000);

        beforeEach(async () => {
            const deployed = await initSystem({
                massetConfig: { fees: standardFees },
                basketManagerConfig: {
                    factors: [basset1Factor, basset2Factor],
                    decimals: [20, 12]
                }
            });

            token = deployed.deployedToken;
            masset = deployed.deployedMassetV4;
            feesVault = deployed.deployedFeesVault;
            rewardsVault = deployed.deployedRewardsVault;
            initialBassets = deployed.deployedInitialBassets;
            basketManager = deployed.deployedBasketManagerV4;
        });

        it("works both ways", async () => {
            const amount = tokens(10000);
            const initialToken1Balance = (await initialBassets.mockToken1.balanceOf(standardAccounts.dummy1));
            const initialToken2Balance = (await initialBassets.mockToken2.balanceOf(standardAccounts.dummy1));

            await initialBassets.mockToken1.approve(masset.address, initialToken1Balance, {
                from: standardAccounts.dummy1,
            });
            await masset.mint(initialBassets.mockToken1.address, initialToken1Balance, {
                from: standardAccounts.dummy1,
            });
            await initialBassets.mockToken2.approve(masset.address, initialToken2Balance, {
                from: standardAccounts.dummy1,
            });
            await masset.mint(initialBassets.mockToken2.address, initialToken2Balance, {
                from: standardAccounts.dummy1,
            });

            const fee = amount.mul(standardFees.deposit).div(FEE_PRECISION);

            const account1BalanceAfterMint = amount.sub(fee).mul(new BN(2));

            expect(await getBalance(token, standardAccounts.dummy1)).bignumber.to.equal(account1BalanceAfterMint);
            expect(await getBalance(initialBassets.mockToken1, standardAccounts.dummy1)).bignumber.to.equal(tokens(0));
            expect(await getBalance(initialBassets.mockToken2, standardAccounts.dummy1)).bignumber.to.equal(tokens(0));

            await token.transfer(standardAccounts.dummy2, amount, {
                from: standardAccounts.dummy1,
            });
            expect(await getBalance(token, standardAccounts.dummy1)).bignumber.to.equal(account1BalanceAfterMint.sub(amount));
            expect(await getBalance(token, standardAccounts.dummy2)).bignumber.to.equal(amount);

            await token.approve(masset.address, amount, { from: standardAccounts.dummy2 });
            await masset.redeem(initialBassets.mockToken2.address, amount, {
                from: standardAccounts.dummy2,
            });

            const reward = new BN(41666); // punishment for withdrawal that will run pool out of balance
            const withdrawalFee = amount.mul(standardFees.withdrawal).div(FEE_PRECISION);

            const expectedReminder = amount.sub(withdrawalFee).sub(reward).mod(basset2Factor);

            expect(await getBalance(token, standardAccounts.dummy2)).bignumber.to.equal(expectedReminder);

            const expectedBalance = amount.sub(withdrawalFee).sub(reward).div(basset2Factor.neg());
            expect(await getBalance(initialBassets.mockToken2, standardAccounts.dummy2)).bignumber.to.equal(expectedBalance);

            const totalFee = fee.mul(new BN(2)).add(withdrawalFee); // 2 mints and one redeem

            const feesVaultBalance = await token.balanceOf(feesVault.address);
            expect(feesVaultBalance).bignumber.to.eq(totalFee);

            const rewardsVaultBalance = await token.balanceOf(rewardsVault.address);
            expect(rewardsVaultBalance).bignumber.to.eq(reward);
        });
    });
});

const zeroBridges = [ZERO_ADDRESS, ZERO_ADDRESS];

type BasketManagerConfig = {
    decimals: Array<number | BN>,
    factors: Array<number | BN>,
    bridges?: string[]
};

async function addInitialBassets(
    basketManager: BasketManagerV4Instance,
    config: BasketManagerConfig
) {
    const {
        decimals,
        factors,
        bridges = zeroBridges
    } = config;

    const mockToken1 = await MockERC20.new("", "", decimals[0], standardAccounts.dummy1, 10000, { from: standardAccounts.default });
    const mockToken2 = await MockERC20.new("", "", decimals[1], standardAccounts.dummy1, 10000, { from: standardAccounts.default });

    const bassets = [mockToken1.address, mockToken2.address];

    const mins = [0, 0];
    const maxs = [1000, 1000];
    const pauses = [false, false];
    const ratios = INITIAL_RATIOS;

    await basketManager.addBassets(bassets, factors, bridges, mins, maxs, ratios, pauses, { from: standardAccounts.default });

    return {
        mockToken1,
        mockToken2
    };
}

type MassetConfig = {
    fees: Fees,
    txDetails?: Truffle.TransactionDetails
};

type InitSystemArg = {
    massetConfig: MassetConfig,
    basketManagerConfig: BasketManagerConfig
};

async function initSystem({ massetConfig, basketManagerConfig }: InitSystemArg) {
    const {
        fees,
        txDetails = { from: standardAccounts.default }
    } = massetConfig;

    const proxyAdmin = standardAccounts.governor;

    // ----- deploy logic contracts -----

    const massetV3Logic = await MassetV3.new();
    const massetV4Logic = await MassetV4.new();
    const feesVault = await FeesVault.new();
    const rewardsVault = await RewardsVault.new();
    const rewardsManager = await RewardsManager.new();
    const feesManager = await FeesManager.new();

    await rewardsManager.initialize(A_CURVE_DENOMINATOR);
    await rewardsVault.initialize();
    await feesManager.initialize(
        fees.deposit,
        fees.depositBridge,
        fees.withdrawal,
        fees.withdrawalBridge,
    );

    // ----- create proxies -----

    const massetProxy = await MassetProxy.new();
    const basketManagerProxy = await BasketManagerProxy.new();

    const massetV3Mock = await MassetV3.at(massetProxy.address);
    const massetV4Mock = await MassetV4.at(massetProxy.address);

    await rewardsVault.addApprover(massetProxy.address);

    // ----- create token -----

    const token = await createToken(massetProxy.address);

    // ----- set basket manager to v3 -----

    await createBasketManagerV3(basketManagerProxy, {
        admin: proxyAdmin,
        massetAddress: massetProxy.address
    });

    // ----- initialize masset v3 -----

    await massetProxy.methods["initialize(address,address,bytes)"](massetV3Logic.address, proxyAdmin, "0x");

    await massetV3Mock.initialize(
        basketManagerProxy.address,
        token.address,
        false,
        txDetails
    );

    await massetV3Mock.upgradeToV3(
        basketManagerProxy.address,
        token.address,
        feesVault.address,
        feesManager.address,
        txDetails
    );

    // ----- upgrade basket manager to v4 -----

    const basketManagerV4Mock = await upgradeBasketManagerToV4(basketManagerProxy, { admin: proxyAdmin });

    // ----- add initial bassets to basket ----

    const initialBassets = await addInitialBassets(basketManagerV4Mock, basketManagerConfig);

    // ----- upgrade masset to v4 -----

    await massetProxy.upgradeTo(massetV4Logic.address, { from: proxyAdmin });

    await massetV4Mock.initialize(
        rewardsManager.address,
        rewardsVault.address,
        txDetails
    );

    return {
        deployedToken: token,
        deployedFeesVault: feesVault,
        deployedRewardsVault: rewardsVault,
        deployedMassetV4: massetV4Mock,
        deployedFeesManager: feesManager,
        deployedRewardsManager: rewardsManager,
        deployedInitialBassets: initialBassets,
        deployedBasketManagerV4: basketManagerV4Mock
    };
}

async function initializePool(
    initialBassets: InitialBassets,
    masset: MassetV4Instance,
    factors: number[],
    feesVault: FeesVaultInstance,
    rewardsVault: RewardsVaultInstance,
    startRatios = INITIAL_RATIOS
) {
    const basset1DepositAmount = factors[0] > 0
        ? tokens(startRatios[0]).mul(new BN(factors[0]))
        : tokens(startRatios[0]).div(new BN(factors[0]).neg());

    const basset2DepositAmount = factors[1] > 0
        ? tokens(startRatios[1]).mul(new BN(factors[1]))
        : tokens(startRatios[1]).div(new BN(factors[1]).neg());

    await initialBassets.mockToken1.mint(
        standardAccounts.dummy1,
        basset1DepositAmount.add(basset2DepositAmount)
    );

    await initialBassets.mockToken1.approve(masset.address, basset1DepositAmount, {
        from: standardAccounts.dummy1,
    });
    await masset.mint(initialBassets.mockToken1.address, basset1DepositAmount, {
        from: standardAccounts.dummy1,
    });

    await initialBassets.mockToken2.approve(masset.address, basset2DepositAmount, {
        from: standardAccounts.dummy1,
    });
    await masset.mint(initialBassets.mockToken2.address, basset2DepositAmount, {
        from: standardAccounts.dummy1,
    });

    const mAssetTokenAddress = await masset.getToken();
    const mAssetToken = await Token.at(mAssetTokenAddress);

    const initialFeesVaultBalance = await getBalance(mAssetToken, feesVault.address);
    const initialRewardsVaultBalance = await getBalance(mAssetToken, rewardsVault.address);

    return {
        initialFeesVaultBalance,
        initialRewardsVaultBalance
    };
}

async function getBalance(token: TokenInstance | MockERC20Instance, who: string): Promise<BN> {
    return token.balanceOf(who);
}

type InitialBassets = {
    mockToken1: MockERC20Instance;
    mockToken2: MockERC20Instance;
};
