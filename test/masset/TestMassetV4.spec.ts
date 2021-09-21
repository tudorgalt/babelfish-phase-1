/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-use-before-define */
import { expectRevert, expectEvent } from "@openzeppelin/test-helpers";
import { BN, tokens } from "@utils/tools";
import envSetup from "@utils/env_setup";
import { ZERO_ADDRESS, FEE_PRECISION, ZERO } from "@utils/constants";
import { StandardAccounts } from "@utils/standardAccounts";
import { MockBridgeInstance, MockERC20Instance, TokenInstance, FeesVaultInstance, MassetV4Instance, BasketManagerV4Instance, RewardsVaultInstance } from "types/generated";
import { createBasketManagerV3, upgradeBasketManagerToV4 } from "./utils";

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

const A_CURVE_DENOMINATOR = 1000;
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

    describe.only("mint", async () => {
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
            it("if all params are valid", async () => {
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

            it.only("proper rewards calculation with second deposit", async () => {
                await initializePool(initialBassets, masset, factors);

                const sum = tokens(500);

                const depositor = standardAccounts.dummy3;
                await initialBassets.mockToken1.mint(depositor, sum);

                const massetQuantity = sum.div(new BN(factors[0]));
                const expectedFee = massetQuantity.mul(standardFees.deposit).div(FEE_PRECISION);
                const expectedReward = ZERO; // TUTAJ INACZEJ
                const expectedMassetQuantity = massetQuantity.sub(expectedFee).sub(expectedReward);


                const poolBalanceBeforeDeposits = await basketManager.getTotalMassetBalance();
                console.log("poolBalanceBeforeDeposits", poolBalanceBeforeDeposits.toString());

                await initialBassets.mockToken1.approve(masset.address, sum, {
                    from: standardAccounts.dummy1,
                });

                await masset.mint(initialBassets.mockToken1.address, sum, {
                    from: standardAccounts.dummy1,
                });

                const poolBalanceAfterDeposits = await basketManager.getTotalMassetBalance();
                console.log("poolBalanceAfterDeposits", poolBalanceAfterDeposits.toString());

                // const balance = await token.balanceOf(standardAccounts.dummy1);
                // expect(balance).bignumber.to.eq(expectedMassetQuantity);

                const feesVaultBalance = await token.balanceOf(feesVault.address);
                expect(feesVaultBalance).bignumber.to.eq(expectedFee, "fee should be transfered to vault contract");

                const rewardsVaultBalance = await token.balanceOf(rewardsVault.address);
                expect(rewardsVaultBalance).bignumber.to.eq(expectedReward, "reward should be 0 after first deposit");
            });

            it("if all params are valid, amounts that don't divide evenly", async () => {
                const factor = new BN(1000);
                await basketManager.setFactor(initialBassets.mockToken1.address, factor);

                const sum = new BN(1024);

                const expectedReminder = sum.mod(factor);
                const bassetsLeft = sum.sub(expectedReminder);
                const massetsToMint = sum.sub(expectedReminder).div(factor);

                const expectedFee = massetsToMint.mul(standardFees.deposit).div(FEE_PRECISION);
                const expectedMassetQuantity = massetsToMint.sub(expectedFee);

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
                    bassetQuantity: bassetsLeft,
                });

                const balance = await token.balanceOf(standardAccounts.dummy1);
                expect(balance).bignumber.to.eq(expectedMassetQuantity);

                const vaultBalance = await token.balanceOf(feesVault.address);
                expect(vaultBalance).bignumber.to.eq(expectedFee, "fee should be transfered to vault contract");
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
                    "VM Exception while processing transaction: reverted with reason string 'SafeERC20: low-level call failed'",
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
            initialBassets = deployed.deployedInitialBassets;
            basketManager = deployed.deployedBasketManagerV4;

            mockTokenDummy = await MockERC20.new("", "", 12, standardAccounts.dummy1, 1);
        });
        context("should succeed", () => {
            it("if all params are valid", async () => {
                const sum = tokens(1);
                const expectedFee = sum.mul(standardFees.deposit).div(FEE_PRECISION);
                const expectedMassetQuantity = sum.sub(expectedFee);

                await initialBassets.mockToken1.approve(masset.address, sum, {
                    from: standardAccounts.dummy1,
                });
                const tx = await masset.mintTo(
                    initialBassets.mockToken1.address,
                    sum,
                    standardAccounts.dummy4,
                    { from: standardAccounts.dummy1 },
                );
                await expectEvent(tx.receipt, "Minted", {
                    minter: standardAccounts.dummy1,
                    recipient: standardAccounts.dummy4,
                    massetQuantity: expectedMassetQuantity,
                    bAsset: initialBassets.mockToken1.address,
                    bassetQuantity: sum,
                });
                const balance = await token.balanceOf(standardAccounts.dummy4);
                expect(balance).bignumber.to.eq(expectedMassetQuantity);

                const vaultBalance = await token.balanceOf(feesVault.address);
                expect(vaultBalance).bignumber.to.eq(expectedFee, "fee should be transfered to vault contract");
            });
        });
    });

    describe("redeem", async () => {
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

                let balance = await token.balanceOf(standardAccounts.dummy1);
                expect(balance).bignumber.to.equal(mintedMassets);

                balance = await initialBassets.mockToken1.balanceOf(standardAccounts.dummy1);
                expect(balance).bignumber.to.equal(initialBalance.sub(sum));

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

                balance = await token.balanceOf(standardAccounts.dummy1);
                expect(balance).bignumber.to.equal(tokens(0));

                balance = await initialBassets.mockToken1.balanceOf(standardAccounts.dummy1);
                expect(balance).bignumber.to.equal(initialBalance.sub(mintFee).sub(withdrawalFee));

                const vaultBalance = await token.balanceOf(feesVault.address);
                expect(vaultBalance).bignumber.to.eq(mintFee.add(withdrawalFee));
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
                const redeemReminder = massetsSubFee.mod(factor.abs());
                const massetsLeft = massetsSubFee.sub(redeemReminder);
                const withdrawnBassets = massetsLeft.div(factor.abs());

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

                balance = await token.balanceOf(standardAccounts.dummy1);
                expect(balance).bignumber.to.equal(redeemReminder);

                balance = await initialBassets.mockToken1.balanceOf(standardAccounts.dummy1);
                expect(balance).bignumber.to.equal(initialBalance.sub(sum.sub(withdrawnBassets)));

                const sumOfOperations = mintFee
                    .add(withdrawalFee)
                    .add(redeemReminder)
                    .div(factor.abs()) // convert to bassets
                    .add(withdrawnBassets);

                expect(sumOfOperations).bignumber.to.eq(
                    sum,
                    "check that sum of funds in system after deposit and redeem is the same as before"
                );

                const vaultBalance = await token.balanceOf(feesVault.address);
                expect(vaultBalance).bignumber.to.eq(mintFee.add(withdrawalFee));
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
                    "VM Exception while processing transaction: reverted with reason string 'basset balance is not sufficient'"
                );
            });
            it("if amount is greater than balance", async () => {
                const sum = 100;
                await initialBassets.mockToken1.approve(masset.address, sum, { from: standardAccounts.dummy1 });
                await masset.mint(initialBassets.mockToken1.address, sum, { from: standardAccounts.dummy1 });

                await token.approve(masset.address, sum, { from: standardAccounts.dummy1 });

                await expectRevert( // should revert because fee from minting was taken
                    masset.redeem(initialBassets.mockToken1.address, sum, { from: standardAccounts.dummy1 }),
                    "VM Exception while processing transaction: reverted with reason string 'ERC20: burn amount exceeds balance'"
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

    describe("setFeeAmount", async () => {
        let admin: string;

        beforeEach(async () => {
            admin = standardAccounts.default;

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
            it("when it's not called by admin", async () => {
                const revertMessage = "VM Exception while processing transaction: reverted with reason string 'InitializableOwnable: caller is not the owner'";

                await expectRevert(masset.setDepositFee(2, { from: standardAccounts.other }), revertMessage);
                await expectRevert(masset.setDepositBridgeFee(2, { from: standardAccounts.other }), revertMessage);
                await expectRevert(masset.setWithdrawalFee(2, { from: standardAccounts.other }), revertMessage);
                await expectRevert(masset.setWithdrawalBridgeFee(2, { from: standardAccounts.other }), revertMessage);
            });
        });

        context("should succeed", async () => {
            it("when amount is correct", async () => {
                let tx: Truffle.TransactionResponse<Truffle.AnyEvent>;

                tx = await masset.setDepositFee(standardFees.deposit, { from: admin });
                await expectEvent(tx.receipt, "DepositFeeChanged", { depositFee: standardFees.deposit });

                tx = await masset.setDepositBridgeFee(standardFees.depositBridge, { from: admin });
                await expectEvent(tx.receipt, "DepositBridgeFeeChanged", { depositBridgeFee: standardFees.depositBridge });

                tx = await masset.setWithdrawalFee(standardFees.withdrawal, { from: admin });
                await expectEvent(tx.receipt, "WithdrawalFeeChanged", { withdrawalFee: standardFees.withdrawal });

                tx = await masset.setWithdrawalBridgeFee(standardFees.withdrawalBridge, { from: admin });
                await expectEvent(tx.receipt, "WithdrawalBridgeFeeChanged", { withdrawalBridgeFee: standardFees.withdrawalBridge });

                expect(await masset.getDepositFee()).bignumber.to.eq(standardFees.deposit);
                expect(await masset.getDepositBridgeFee()).bignumber.to.eq(standardFees.depositBridge);
                expect(await masset.getWithdrawalFee()).bignumber.to.eq(standardFees.withdrawal);
                expect(await masset.getWithdrawalBridgeFee()).bignumber.to.eq(standardFees.withdrawalBridge);
            });

            it("when amount is zero", async () => {
                await masset.setDepositFee(0, { from: admin });
                await masset.setDepositBridgeFee(0, { from: admin });
                await masset.setWithdrawalFee(0, { from: admin });
                await masset.setWithdrawalBridgeFee(0, { from: admin });

                expect(await masset.getDepositFee()).bignumber.to.eq(ZERO);
                expect(await masset.getDepositBridgeFee()).bignumber.to.eq(ZERO);
                expect(await masset.getWithdrawalFee()).bignumber.to.eq(ZERO);
                expect(await masset.getWithdrawalBridgeFee()).bignumber.to.eq(ZERO);
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

            await token.approve(masset.address, amount, { from: standardAccounts.dummy2 });
            await masset.redeem(initialBassets.mockToken2.address, amount, {
                from: standardAccounts.dummy2,
            });
            expect(await getBalance(token, standardAccounts.dummy2)).bignumber.to.equal(tokens(0));

            const withdrawalFee = amount.mul(standardFees.withdrawal).div(FEE_PRECISION);
            const expectedBalance = amount.sub(withdrawalFee).div(basset2Factor.neg());
            expect(await getBalance(initialBassets.mockToken2, standardAccounts.dummy2)).bignumber.to.equal(expectedBalance);

            const totalFee = fee.mul(new BN(2)).add(withdrawalFee); // 2 mints and one redeem
            const vaultBalance = await token.balanceOf(feesVault.address);
            expect(vaultBalance).bignumber.to.eq(totalFee);
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
        fees.deposit,
        fees.depositBridge,
        fees.withdrawal,
        fees.withdrawalBridge,
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
        feesManager.address,
        txDetails
    );

    return {
        deployedToken: token,
        deployedFeesVault: feesVault,
        deployedRewardsVault: rewardsVault,
        deployedMassetV4: massetV4Mock,
        deployedInitialBassets: initialBassets,
        deployedBasketManagerV4: basketManagerV4Mock
    };
}

async function initializePool(
    initialBassets: InitialBassets,
    masset: MassetV4Instance,
    factors: number[]
) {
    const basset1DepositAmount = tokens(INITIAL_RATIOS[0]);
    const basset2DepositAmount = tokens(INITIAL_RATIOS[1]);
    
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
}

async function createToken(massetAddress: string) {
    const token = await Token.new("Mock1", "MK1", 18);
    token.transferOwnership(massetAddress);
    return token;
}

async function getBalance(token: TokenInstance | MockERC20Instance, who: string): Promise<BN> {
    return token.balanceOf(who);
}

type InitialBassets = {
    mockToken1: MockERC20Instance;
    mockToken2: MockERC20Instance;
};

type Fees = Record<
    | "deposit"
    | "depositBridge"
    | "withdrawal"
    | "withdrawalBridge",
    BN
>;
