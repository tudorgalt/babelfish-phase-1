/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-use-before-define */
import { expectRevert, expectEvent } from "@openzeppelin/test-helpers";
import { toWei } from "web3-utils";
import { BN } from "@utils/tools";
import envSetup from "@utils/env_setup";
import { ZERO_ADDRESS, FEE_PRECISION } from "@utils/constants";
import { StandardAccounts } from "@utils/standardAccounts";
import { BasketManagerV3Instance, MassetV3Instance, MockBridgeInstance, MockERC20Instance, TokenInstance, VaultInstance } from "types/generated";

const { expect } = envSetup.configure();

const BasketManagerV3 = artifacts.require("BasketManagerV3");
const MassetV3 = artifacts.require("MassetV3");
const Token = artifacts.require("Token");
const MockERC20 = artifacts.require("MockERC20");
const MockBridge = artifacts.require("MockBridge");
const Vault = artifacts.require("Vault");

let standardAccounts: StandardAccounts;

const tokens = (amount: string | number): BN => toWei(new BN(amount), 'ether');

contract("MassetV3", async (accounts) => {

    standardAccounts = new StandardAccounts(accounts);

    before("before all", async () => { });

    describe("initialize", async () => {
        let masset: MassetV3Instance;
        let basketManagerObj: BasketManagerObj;
        let token: TokenInstance;
        let vault: VaultInstance;

        beforeEach(async () => {
            vault = await Vault.new();
            masset = await MassetV3.new();
            basketManagerObj = await createBasketManager(masset, [18, 18], [1, 1]);
            token = await createToken(masset);
        });

        context("should succeed", async () => {
            it("when given a valid basket manager", async () => {
                await masset.initialize(
                    basketManagerObj.basketManager.address,
                    token.address,
                    false,
                    1,
                    vault.address
                );

                const version = await masset.getVersion();
                expect(version).to.eq("1.0");

                const setToken = await masset.getToken();
                expect(setToken).to.eq(token.address);

                const setBasketManager = await masset.getBasketManager();
                expect(setBasketManager).to.eq(basketManagerObj.basketManager.address);

                const setFeeAmount = await masset.getFeeAmount();
                expect(setFeeAmount).bignumber.to.eq(new BN(1));
            });
        });
        context("should fail", async () => {
            it("when basket manager missing", async () => {
                await expectRevert(
                    masset.initialize(ZERO_ADDRESS, token.address, false, 1, vault.address),
                    "VM Exception while processing transaction: reverted with reason string 'invalid basket manager'",
                );
            });
            it("when vault address missing", async () => {
                await expectRevert(
                    masset.initialize(basketManagerObj.basketManager.address, token.address, false, 1, ZERO_ADDRESS),
                    "VM Exception while processing transaction: reverted with reason string 'invalid vault address'",    
                );
            });
            it("when token missing", async () => {
                await expectRevert(
                    masset.initialize(
                        basketManagerObj.basketManager.address,
                        ZERO_ADDRESS,
                        false,
                        1,
                        vault.address
                    ),
                    "VM Exception while processing transaction: reverted with reason string 'invalid token'",
                );
            });
            it("when already initialized", async () => {
                await masset.initialize(
                    basketManagerObj.basketManager.address,
                    token.address,
                    false,
                    1,
                    vault.address
                );
                await expectRevert(
                    masset.initialize(
                        basketManagerObj.basketManager.address,
                        token.address,
                        false,
                        1,
                        vault.address
                    ),
                    "VM Exception while processing transaction: reverted with reason string 'already initialized'",
                );
            });
        });
    });

    describe("mint", async () => {
        let masset: MassetV3Instance;
        let basketManagerObj: BasketManagerObj;
        let token: TokenInstance;
        let mockTokenDummy: MockERC20Instance;
        let vault: VaultInstance;

        const feeAmount = new BN(12);

        beforeEach(async () => {
            masset = await MassetV3.new();
            vault = await Vault.new();
            token = await createToken(masset);
            basketManagerObj = await createBasketManager(masset, [18, 18], [1, 1]);
            await masset.initialize(
                basketManagerObj.basketManager.address,
                token.address,
                false,
                feeAmount,
                vault.address
            );
            mockTokenDummy = await MockERC20.new("", "", 12, standardAccounts.dummy1, 1);
        });

        context("should succeed", () => {
            it("if all params are valid", async () => {
                const sum = tokens(1);
                const expectedFee = sum.mul(feeAmount).div(FEE_PRECISION);
                const expectedMassetQuantity = sum.sub(expectedFee);

                await basketManagerObj.mockToken1.approve(masset.address, sum, {
                    from: standardAccounts.dummy1,
                });
                const tx = await masset.mint(basketManagerObj.mockToken1.address, sum, {
                    from: standardAccounts.dummy1,
                });

                await expectEvent(tx.receipt, "Minted", {
                    minter: standardAccounts.dummy1,
                    recipient: standardAccounts.dummy1,
                    massetQuantity: expectedMassetQuantity,
                    bAsset: basketManagerObj.mockToken1.address,
                    bassetQuantity: sum,
                });

                const balance = await token.balanceOf(standardAccounts.dummy1);
                expect(balance).bignumber.to.eq(expectedMassetQuantity);

                const vaultBalance = await token.balanceOf(vault.address);
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
                    masset.mint(basketManagerObj.mockToken1.address, 100000),
                    "VM Exception while processing transaction: reverted with reason string 'ERC20: transfer amount exceeds balance'",
                );
            });
        });
    });
    describe("mintTo", async () => {
        let masset: MassetV3Instance;
        let basketManagerObj: BasketManagerObj;
        let token: TokenInstance;
        let vault: VaultInstance;

        const feeAmount = new BN(2);

        beforeEach(async () => {
            vault = await Vault.new();
            masset = await MassetV3.new();
            basketManagerObj = await createBasketManager(masset, [18, 18], [1, 1]);
            token = await createToken(masset);
            await masset.initialize(
                basketManagerObj.basketManager.address,
                token.address,
                false,
                feeAmount,
                vault.address
            );
        });
        context("should succeed", () => {
            it("if all params are valid", async () => {
                const sum = tokens(1);
                const expectedFee = sum.mul(feeAmount).div(FEE_PRECISION);
                const expectedMassetQuantity = sum.sub(expectedFee);

                await basketManagerObj.mockToken1.approve(masset.address, sum, {
                    from: standardAccounts.dummy1,
                });
                const tx = await masset.mintTo(
                    basketManagerObj.mockToken1.address,
                    sum,
                    standardAccounts.dummy4,
                    { from: standardAccounts.dummy1 },
                );
                await expectEvent(tx.receipt, "Minted", {
                    minter: standardAccounts.dummy1,
                    recipient: standardAccounts.dummy4,
                    massetQuantity: expectedMassetQuantity,
                    bAsset: basketManagerObj.mockToken1.address,
                    bassetQuantity: sum,
                });
                const balance = await token.balanceOf(standardAccounts.dummy4);
                expect(balance).bignumber.to.eq(expectedMassetQuantity);
                
                const vaultBalance = await token.balanceOf(vault.address);
                expect(vaultBalance).bignumber.to.eq(expectedFee, "fee should be transfered to vault contract");
            });
        });
    });

    describe("redeem", async () => {
        let masset: MassetV3Instance;
        let basketManagerObj: BasketManagerObj;
        let token: TokenInstance;
        let vault: VaultInstance;
        let mockTokenDummy: MockERC20Instance;

        const feeAmount = new BN(10);

        beforeEach(async () => {
            vault = await Vault.new();
            masset = await MassetV3.new();
            token = await createToken(masset);
            basketManagerObj = await createBasketManager(masset, [18, 18], [1, 1]);
            await masset.initialize(
                basketManagerObj.basketManager.address,
                token.address,
                false,
                10,
                vault.address
            );
            mockTokenDummy = await MockERC20.new("", "", 12, standardAccounts.dummy1, 1);
        });

        context("should succeed", () => {
            it("if all params are valid", async () => {
                const initialBalance = tokens(1);
                const sum = new BN(10).pow(new BN(2));
                const mintFee = sum.mul(feeAmount).div(FEE_PRECISION);
                
                await basketManagerObj.mockToken1.approve(masset.address, sum, {
                    from: standardAccounts.dummy1,
                });
                await masset.mint(basketManagerObj.mockToken1.address, sum, {
                    from: standardAccounts.dummy1,
                });

                const mintedMassets = sum.sub(mintFee);

                let balance = await token.balanceOf(standardAccounts.dummy1);
                expect(balance).bignumber.to.equal(mintedMassets);

                balance = await basketManagerObj.mockToken1.balanceOf(standardAccounts.dummy1);
                expect(balance).bignumber.to.equal(initialBalance.sub(sum));

                const withdrawFee = mintedMassets.mul(feeAmount).div(FEE_PRECISION);
                const withdrawnBassets = mintedMassets.sub(withdrawFee);

                await token.approve(masset.address, withdrawFee);

                const tx = await masset.redeem(basketManagerObj.mockToken1.address, mintedMassets, {
                    from: standardAccounts.dummy1,
                });
                await expectEvent(tx.receipt, "Redeemed", {
                    redeemer: standardAccounts.dummy1,
                    recipient: standardAccounts.dummy1,
                    massetQuantity: mintedMassets,
                    bAsset: basketManagerObj.mockToken1.address,
                    bassetQuantity: withdrawnBassets,
                });

                balance = await token.balanceOf(standardAccounts.dummy1);
                expect(balance).bignumber.to.equal(tokens(0));

                balance = await basketManagerObj.mockToken1.balanceOf(standardAccounts.dummy1);
                expect(balance).bignumber.to.equal(initialBalance.sub(mintFee).sub(withdrawFee));

                const vaultBalance = await token.balanceOf(vault.address);
                expect(vaultBalance).bignumber.to.eq(mintFee.add(withdrawFee));
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
                await basketManagerObj.mockToken1.approve(masset.address, 100, { from: standardAccounts.dummy1 });
                await masset.mint(basketManagerObj.mockToken1.address, 100, { from: standardAccounts.dummy1 });

                await token.approve(masset.address, 100, { from: standardAccounts.dummy1 });

                await expectRevert(
                    masset.redeem(basketManagerObj.mockToken1.address, 1000, { from: standardAccounts.dummy1 }),
                    "VM Exception while processing transaction: reverted with reason string 'basset balance is not sufficient'"
                );
            });
            it("if amount is greater than balance", async () => {
                const sum = 100;
                await basketManagerObj.mockToken1.approve(masset.address, sum, { from: standardAccounts.dummy1 });
                await masset.mint(basketManagerObj.mockToken1.address, sum, { from: standardAccounts.dummy1 });

                await token.approve(masset.address, sum, { from: standardAccounts.dummy1 });

                await expectRevert( // should revert because fee from minting was taken
                    masset.redeem(basketManagerObj.mockToken1.address, sum, { from: standardAccounts.dummy1 }),
                    "VM Exception while processing transaction: reverted with reason string 'ERC20: burn amount exceeds balance'"
                );
            });
        });
    });

    describe("redeemTo", async () => {
        let masset: MassetV3Instance;
        let basketManagerObj: BasketManagerObj;
        let token: TokenInstance;
        let vault: VaultInstance;

        const feeAmount = new BN(2);

        beforeEach(async () => {
            vault = await Vault.new();
            masset = await MassetV3.new();
            token = await createToken(masset);
            basketManagerObj = await createBasketManager(masset, [18, 18], [1, 1]);
            await masset.initialize(basketManagerObj.basketManager.address, token.address, false, feeAmount, vault.address);
        });

        context("should fail", () => {
            it("when recipient is not valid", async () => {
                await expectRevert(
                    masset.redeemTo(basketManagerObj.mockToken1.address, tokens(10), ZERO_ADDRESS, { from: standardAccounts.dummy1 }),
                    "VM Exception while processing transaction: reverted with reason string 'must be a valid recipient'"
                );
            });
        });

        context("should succeed", () => {
            it("if all params are valid", async () => {
                const sum = new BN(10).pow(new BN(3));
                const mintFee = sum.mul(feeAmount).div(FEE_PRECISION);
                const withdrawAmount = sum.sub(mintFee);
                const withdrawFee = withdrawAmount.mul(feeAmount).div(FEE_PRECISION);
                const recipient = standardAccounts.dummy2;

                await basketManagerObj.mockToken1.approve(masset.address, sum, { from: standardAccounts.dummy1 });
                await masset.mint(basketManagerObj.mockToken1.address, sum, { from: standardAccounts.dummy1 });

                await token.approve(masset.address, withdrawAmount, { from: standardAccounts.dummy1 });

                await masset.redeemTo(basketManagerObj.mockToken1.address, withdrawAmount, recipient, { from: standardAccounts.dummy1 });

                const balance = await basketManagerObj.mockToken1.balanceOf(recipient);
                expect(balance).bignumber.to.equal(withdrawAmount.sub(withdrawFee), "should transfer bassets to correct recipient");

                const vaultBalance = await token.balanceOf(vault.address);
                expect(vaultBalance).bignumber.to.eq(mintFee.add(withdrawFee));
            });
        });
    });

    describe("redeemToBridge", async () => {
        let masset: MassetV3Instance;
        let basketManagerObj: BasketManagerObj;
        let token: TokenInstance;
        let vault: VaultInstance;
        let mockBridge: MockBridgeInstance;

        const feeAmount = new BN(1);
        const mintAmount = tokens(1);
        const mintFee = mintAmount.mul(feeAmount).div(FEE_PRECISION);
        const mintedMassets = mintAmount.sub(mintFee);

        beforeEach(async () => {
            vault = await Vault.new();
            masset = await MassetV3.new();
            token = await createToken(masset);
            mockBridge = await MockBridge.new();

            basketManagerObj = await createBasketManager(
                masset,
                [18, 18],
                [1, 1],
                [mockBridge.address, mockBridge.address]
            );
            await masset.initialize(basketManagerObj.basketManager.address, token.address, false, feeAmount, vault.address, { from: standardAccounts.default });

            await basketManagerObj.mockToken1.approve(masset.address, mintAmount, { from: standardAccounts.dummy1 });
            await masset.mint(basketManagerObj.mockToken1.address, mintAmount, { from: standardAccounts.dummy1 });
            await token.approve(masset.address, mintAmount, { from: standardAccounts.dummy1 });
        });

        context("should fail", () => {
            it("when bridge is not valid", async () => {
                await basketManagerObj.basketManager.setBridge(
                    basketManagerObj.mockToken1.address,
                    ZERO_ADDRESS,
                    { from: standardAccounts.default }
                );

                await expectRevert(
                    masset.methods["redeemToBridge(address,uint256,address)"](
                        basketManagerObj.mockToken1.address,
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
                const withdrawFee = mintedMassets.mul(feeAmount).div(FEE_PRECISION);

                await masset.methods["redeemToBridge(address,uint256,address)"](
                    basketManagerObj.mockToken1.address,
                    mintedMassets,
                    standardAccounts.dummy2,
                    { from: standardAccounts.dummy1 }
                );

                const bridgeBalance = await getBalance(basketManagerObj.mockToken1, mockBridge.address);
                expect(bridgeBalance).to.bignumber.eq(mintedMassets.sub(withdrawFee), "should transfer bassets to bridge");

                const vaultBalance = await token.balanceOf(vault.address);
                expect(vaultBalance).bignumber.to.eq(mintFee.add(withdrawFee));
            });
        });
    });

    describe("onTokensMinted", async () => {
        let masset: MassetV3Instance;
        let basketManagerObj: BasketManagerObj;
        let token: TokenInstance;
        let vault: VaultInstance;
        let mockBridge: MockBridgeInstance;

        const feeAmount = new BN(1);

        beforeEach(async () => {
            vault = await Vault.new();
            masset = await MassetV3.new();
            token = await createToken(masset);
            mockBridge = await MockBridge.new();

            basketManagerObj = await createBasketManager(
                masset,
                [18, 18],
                [1, 1],
                [mockBridge.address, mockBridge.address]
            );

            await masset.initialize(
                basketManagerObj.basketManager.address,
                token.address,
                false,
                1,
                vault.address
            );
        });

        context("should fail", async () => {
            it("when it's not called by bridge", async () => {
                await expectRevert(
                    masset.onTokensMinted(
                        tokens(1),
                        basketManagerObj.mockToken1.address,
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
                        basketManagerObj.mockToken1.address,
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
                        basketManagerObj.mockToken1.address,
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
                await basketManagerObj.basketManager.setRange(basketManagerObj.mockToken1.address, 0, 10, { from: standardAccounts.default });

                await expectRevert(
                    mockBridge.callOnTokensMinted(
                        masset.address,
                        tokens(10000),
                        basketManagerObj.mockToken1.address,
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
                const expectedFee = amount.mul(feeAmount).div(FEE_PRECISION);
                const expectedMassetQuantity = amount.sub(expectedFee);

                const recipient = standardAccounts.dummy1;

                const recepit = await mockBridge.callOnTokensMinted(
                    masset.address,
                    amount,
                    basketManagerObj.mockToken1.address,
                    recipient,
                    { from: standardAccounts.default }
                );

                await expectEvent.inTransaction(recepit.tx, MassetV3, "Minted", {
                    minter: mockBridge.address,
                    recipient,
                    massetQuantity: expectedMassetQuantity,
                    bAsset: basketManagerObj.mockToken1.address,
                    bassetQuantity: amount,
                }, {});

                const balance = await token.balanceOf(recipient);
                expect(balance).bignumber.to.eq(expectedMassetQuantity, "should mint proper amount of tokens to recipient");

                const vaultBalance = await token.balanceOf(vault.address);
                expect(vaultBalance).bignumber.to.eq(expectedFee, "should mint proper amount of tokens to recipient");
            });
        });
    });

    describe("setFeeAmount", async () => {
        let masset: MassetV3Instance;
        let admin: string;

        beforeEach(async () => {
            masset = await MassetV3.new();
            admin = standardAccounts.default;
            
            await masset.initialize(
                standardAccounts.dummy1,
                standardAccounts.dummy2,
                false,
                1,
                standardAccounts.dummy3,
                { from: admin }
            );
        });

        context("should fail", async () => {
            it("when it's not called by admin", async () => {
                await expectRevert(
                    masset.setFeeAmount(2, { from: standardAccounts.other }),
                    "VM Exception while processing transaction: reverted with reason string 'InitializableOwnable: caller is not the owner'"
                );
            });

            it("when amount is less than zero", async () => {
                await expectRevert(
                    masset.setFeeAmount(0, { from: admin }),
                    "VM Exception while processing transaction: reverted with reason string 'fee amount should be greater than zero'"
                );
            });
        });

        context("should succeed", async () => {
            it("when amount is correct", async () => {
                const amount = new BN(2);
                await masset.setFeeAmount(amount, { from: admin });

                const setFeeAmount = await masset.getFeeAmount();
                expect(setFeeAmount).bignumber.to.eq(amount);
            });
        });
    });

    describe("precision conversion", async () => {
        let vault: VaultInstance;
        let masset: MassetV3Instance;
        let basketManagerObj: BasketManagerObj;
        let token: TokenInstance;

        const feeAmount = new BN(1);
        const basset1Factor = new BN(100);
        const basset2Factor = new BN(-1000000);

        beforeEach(async () => {
            vault = await Vault.new();
            masset = await MassetV3.new();
            token = await createToken(masset);
            basketManagerObj = await createBasketManager(masset, [20, 12], [basset1Factor, basset2Factor]);
            await masset.initialize(
                basketManagerObj.basketManager.address,
                token.address,
                false,
                feeAmount,
                vault.address
            );
        });
        it("works both ways", async () => {
            const initialToken1Balance = new BN(10).pow(new BN(20));
            const initialToken2Balance = new BN(10).pow(new BN(12));

            expect(await getBalance(basketManagerObj.mockToken1, standardAccounts.dummy1)).bignumber.to.equal(
                initialToken1Balance,
            );
            expect(await getBalance(basketManagerObj.mockToken2, standardAccounts.dummy1)).bignumber.to.equal(
                initialToken2Balance,
            );

            await basketManagerObj.mockToken1.approve(masset.address, initialToken1Balance, {
                from: standardAccounts.dummy1,
            });
            await masset.mint(basketManagerObj.mockToken1.address, initialToken1Balance, {
                from: standardAccounts.dummy1,
            });
            await basketManagerObj.mockToken2.approve(masset.address, initialToken2Balance, {
                from: standardAccounts.dummy1,
            });
            await masset.mint(basketManagerObj.mockToken2.address, initialToken2Balance, {
                from: standardAccounts.dummy1,
            });

            const fee = tokens(1).mul(feeAmount).div(FEE_PRECISION);

            const account1BalanceAfterMint = tokens(1).sub(fee).mul(new BN(2));

            expect(await getBalance(token, standardAccounts.dummy1)).bignumber.to.equal(account1BalanceAfterMint);
            expect(await getBalance(basketManagerObj.mockToken1, standardAccounts.dummy1)).bignumber.to.equal(tokens(0));
            expect(await getBalance(basketManagerObj.mockToken2, standardAccounts.dummy1)).bignumber.to.equal(tokens(0));

            await token.transfer(standardAccounts.dummy2, tokens(1), {
                from: standardAccounts.dummy1,
            });
            expect(await getBalance(token, standardAccounts.dummy1)).bignumber.to.equal(account1BalanceAfterMint.sub(tokens(1)));

            await token.approve(masset.address, tokens(1), { from: standardAccounts.dummy2 });
            await masset.redeem(basketManagerObj.mockToken2.address, tokens(1), {
                from: standardAccounts.dummy2,
            });
            expect(await getBalance(token, standardAccounts.dummy2)).bignumber.to.equal(tokens(0));
            
            const expectedBalance = tokens(1).sub(fee).div(basset2Factor.neg());
            expect(await getBalance(basketManagerObj.mockToken2, standardAccounts.dummy2)).bignumber.to.equal(expectedBalance);

            const totalFee = fee.add(fee).add(fee); // 2 mints and one redeem
            const vaultBalance = await token.balanceOf(vault.address);
            expect(vaultBalance).bignumber.to.eq(totalFee); 
        });
    });
});

type BasketManagerObj = {
    mockToken1: MockERC20Instance;
    mockToken2: MockERC20Instance;
    bassets: string[];
    basketManager: BasketManagerV3Instance;
};

const zeroBridges = [ZERO_ADDRESS, ZERO_ADDRESS];

async function createBasketManager(
    masset: MassetV3Instance,
    decimals: Array<number>,
    factors: Array<number | BN>,
    bridges = zeroBridges
): Promise<BasketManagerObj> {
    const mockToken1 = await MockERC20.new("", "", decimals[0], standardAccounts.dummy1, 1, { from: standardAccounts.default });
    const mockToken2 = await MockERC20.new("", "", decimals[1], standardAccounts.dummy1, 1, { from: standardAccounts.default });

    const bassets = [mockToken1.address, mockToken2.address];

    const mins = [0, 0];
    const maxs = [1000, 1000];
    const pauses = [false, false];

    const basketManager = await BasketManagerV3.new({ from: standardAccounts.default });
    await basketManager.initialize(masset.address, { from: standardAccounts.default });
    await basketManager.addBassets(bassets, factors, bridges, mins, maxs, pauses, { from: standardAccounts.default });

    return {
        mockToken1,
        mockToken2,
        bassets,
        basketManager,
    };
}

async function createToken(masset: MassetV3Instance) {
    const token = await Token.new("Mock1", "MK1", 18);
    token.transferOwnership(masset.address);
    return token;
}

async function getBalance(token: TokenInstance | MockERC20Instance, who: string): Promise<BN> {
    return token.balanceOf(who);
}
