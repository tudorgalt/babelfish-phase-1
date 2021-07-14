/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-use-before-define */
import { expectRevert, expectEvent } from "@openzeppelin/test-helpers";
import { toWei } from "web3-utils";
import { BN } from "@utils/tools";
import envSetup from "@utils/env_setup";
import { ZERO_ADDRESS } from "@utils/constants";
import { StandardAccounts } from "@utils/standardAccounts";
import { BasketManagerV3Instance, MassetV3Instance, MockBridgeInstance, MockERC20Instance, TokenInstance } from "types/generated";

const { expect } = envSetup.configure();

const BasketManagerV3 = artifacts.require("BasketManagerV3");
const MassetV3 = artifacts.require("MassetV3");
const Token = artifacts.require("Token");
const MockERC20 = artifacts.require("MockERC20");
const MockBridge = artifacts.require("MockBridge");

let standardAccounts: StandardAccounts;

const tokens = (amount: string | number): BN => toWei(new BN(amount), 'ether');

contract("MassetV3", async (accounts) => {

    standardAccounts = new StandardAccounts(accounts);

    before("before all", async () => { });

    describe("initialize", async () => {
        let masset: MassetV3Instance;
        let basketManagerObj: BasketManagerObj;
        let token: TokenInstance;

        beforeEach(async () => {
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
                );
            });
        });
        context("should fail", async () => {
            it("when basket manager missing", async () => {
                await expectRevert(
                    masset.initialize(ZERO_ADDRESS, token.address, false),
                    "VM Exception while processing transaction: reverted with reason string 'invalid basket manager'",
                );
            });
            it("when token missing", async () => {
                await expectRevert(
                    masset.initialize(
                        basketManagerObj.basketManager.address,
                        ZERO_ADDRESS,
                        false,
                    ),
                    "VM Exception while processing transaction: reverted with reason string 'invalid token'",
                );
            });
            it("when already initialized", async () => {
                await masset.initialize(
                    basketManagerObj.basketManager.address,
                    token.address,
                    false,
                );
                await expectRevert(
                    masset.initialize(
                        basketManagerObj.basketManager.address,
                        token.address,
                        false,
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

        beforeEach(async () => {
            masset = await MassetV3.new();
            token = await createToken(masset);
            basketManagerObj = await createBasketManager(masset, [18, 18], [1, 1]);
            await masset.initialize(
                basketManagerObj.basketManager.address,
                token.address,
                false,
            );
            mockTokenDummy = await MockERC20.new("", "", 12, standardAccounts.dummy1, 1);
        });

        context("should succeed", () => {
            it("if all params are valid", async () => {
                const sum = tokens(1);

                await basketManagerObj.mockToken1.approve(masset.address, sum, {
                    from: standardAccounts.dummy1,
                });
                const tx = await masset.mint(basketManagerObj.mockToken1.address, sum, {
                    from: standardAccounts.dummy1,
                });

                await expectEvent(tx.receipt, "Minted", {
                    minter: standardAccounts.dummy1,
                    recipient: standardAccounts.dummy1,
                    massetQuantity: sum,
                    bAsset: basketManagerObj.mockToken1.address,
                    bassetQuantity: sum,
                });

                const balance = await token.balanceOf(standardAccounts.dummy1);
                expect(balance.toString()).to.equal(`${sum}`);
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

        beforeEach(async () => {
            masset = await MassetV3.new();
            basketManagerObj = await createBasketManager(masset, [18, 18], [1, 1]);
            token = await createToken(masset);
            await masset.initialize(
                basketManagerObj.basketManager.address,
                token.address,
                false,
            );
        });
        context("should succeed", () => {
            it("if all params are valid", async () => {
                const sum = "100000000000000000";
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
                    massetQuantity: sum,
                    bAsset: basketManagerObj.mockToken1.address,
                    bassetQuantity: sum,
                });
                const balance = await token.balanceOf(standardAccounts.dummy4);
                expect(balance.toString()).to.equal(`${sum}`);
            });
        });
    });

    describe("redeem", async () => {
        let masset: MassetV3Instance;
        let basketManagerObj: BasketManagerObj;
        let token: TokenInstance;
        let mockTokenDummy: MockERC20Instance;

        beforeEach(async () => {
            masset = await MassetV3.new();
            token = await createToken(masset);
            basketManagerObj = await createBasketManager(masset, [18, 18], [1, 1]);
            await masset.initialize(
                basketManagerObj.basketManager.address,
                token.address,
                false,
            );
            mockTokenDummy = await MockERC20.new("", "", 12, standardAccounts.dummy1, 1);
        });

        context("should succeed", () => {
            it("if all params are valid", async () => {
                const initialBalance = tokens(1);
                const sum = new BN(10).pow(new BN(2));

                await basketManagerObj.mockToken1.approve(masset.address, sum, {
                    from: standardAccounts.dummy1,
                });
                await masset.mint(basketManagerObj.mockToken1.address, sum, {
                    from: standardAccounts.dummy1,
                });

                let balance = await token.balanceOf(standardAccounts.dummy1);
                expect(balance).bignumber.to.equal(sum);

                balance = await basketManagerObj.mockToken1.balanceOf(standardAccounts.dummy1);
                expect(balance).bignumber.to.equal(initialBalance.sub(sum));

                const tx = await masset.redeem(basketManagerObj.mockToken1.address, sum, {
                    from: standardAccounts.dummy1,
                });
                await expectEvent(tx.receipt, "Redeemed", {
                    redeemer: standardAccounts.dummy1,
                    recipient: standardAccounts.dummy1,
                    massetQuantity: sum,
                    bAsset: basketManagerObj.mockToken1.address,
                    bassetQuantity: sum,
                });

                balance = await token.balanceOf(standardAccounts.dummy1);
                expect(balance).bignumber.to.equal(tokens(0));

                balance = await basketManagerObj.mockToken1.balanceOf(standardAccounts.dummy1);
                expect(balance).bignumber.to.equal(initialBalance);
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
                await expectRevert(
                    masset.redeem(basketManagerObj.mockToken1.address, 100000),
                    "VM Exception while processing transaction: reverted with reason string 'basset balance is not sufficient'"
                );
            });
        });
    });

    describe("redeemTo", async () => {
        let masset: MassetV3Instance;
        let basketManagerObj: BasketManagerObj;
        let token: TokenInstance;

        beforeEach(async () => {
            masset = await MassetV3.new();
            token = await createToken(masset);
            basketManagerObj = await createBasketManager(masset, [18, 18], [1, 1]);
            await masset.initialize(basketManagerObj.basketManager.address, token.address, false);
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
                const sum = new BN(10).pow(new BN(2));
                const recipient = standardAccounts.dummy2;

                await basketManagerObj.mockToken1.approve(masset.address, sum, { from: standardAccounts.dummy1 });
                await masset.mint(basketManagerObj.mockToken1.address, sum, { from: standardAccounts.dummy1 });

                await masset.redeemTo(basketManagerObj.mockToken1.address, sum, recipient, { from: standardAccounts.dummy1 });

                const balance = await basketManagerObj.mockToken1.balanceOf(recipient);
                expect(balance).bignumber.to.equal(sum, "should transfer bassets to correct recipient");
            });
        });
    });

    describe("redeemToBridge", async () => {
        let masset: MassetV3Instance;
        let basketManagerObj: BasketManagerObj;
        let token: TokenInstance;
        let mockBridge: MockBridgeInstance;

        beforeEach(async () => {
            masset = await MassetV3.new();
            token = await createToken(masset);
            mockBridge = await MockBridge.new();

            basketManagerObj = await createBasketManager(
                masset,
                [18, 18],
                [1, 1],
                [mockBridge.address, mockBridge.address]
            );
            await masset.initialize(basketManagerObj.basketManager.address, token.address, false, { from: standardAccounts.default });

            await basketManagerObj.mockToken1.approve(masset.address, tokens(1), { from: standardAccounts.dummy1 });
            await masset.mint(basketManagerObj.mockToken1.address, tokens(1), { from: standardAccounts.dummy1 });
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
                        tokens(1),
                        standardAccounts.dummy2,
                        { from: standardAccounts.dummy1 }
                    ),
                    "VM Exception while processing transaction: reverted with reason string 'invalid bridge'"
                );
            });
        });

        context("should succeed", () => {
            it("if all params are valid", async () => {
                await masset.methods["redeemToBridge(address,uint256,address)"](
                    basketManagerObj.mockToken1.address,
                    tokens(1),
                    standardAccounts.dummy2,
                    { from: standardAccounts.dummy1 }
                );

                const bridgeBalance = await getBalance(basketManagerObj.mockToken1, mockBridge.address);
                expect(bridgeBalance).to.bignumber.eq(tokens(1), "should transfers bassets to bridge");
            });
        });
    });

    describe("onTokensMinted", async () => {
        let masset: MassetV3Instance;
        let basketManagerObj: BasketManagerObj;
        let token: TokenInstance;
        let mockBridge: MockBridgeInstance;

        let encodedRecipientAddress;

        beforeEach(async () => {
            masset = await MassetV3.new();
            token = await createToken(masset);
            mockBridge = await MockBridge.new();
            encodedRecipientAddress = web3.eth.abi.encodeParameters(['bytes'], [standardAccounts.dummy1]);

            basketManagerObj = await createBasketManager(
                masset,
                [18, 18],
                [1, 1],
                [mockBridge.address, mockBridge.address]
            );

            await masset.initialize(
                basketManagerObj.basketManager.address,
                token.address,
                false
            );
        });

        context("should fail", async () => {
            it("when it's not called by bridge", async () => {
                await expectRevert(
                    masset.onTokensMinted(
                        tokens(1),
                        basketManagerObj.mockToken1.address,
                        encodedRecipientAddress,
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
                const recipient = standardAccounts.dummy1;
                const amount = tokens(1);

                const recepit = await mockBridge.callOnTokensMinted(
                    masset.address,
                    tokens(1),
                    basketManagerObj.mockToken1.address,
                    recipient,
                    { from: standardAccounts.default }
                );

                await expectEvent.inTransaction(recepit.tx, MassetV3, "Minted", {
                    minter: mockBridge.address,
                    recipient,
                    massetQuantity: amount,
                    bAsset: basketManagerObj.mockToken1.address,
                    bassetQuantity: amount,
                }, {});

                const balance = await token.balanceOf(recipient);
                expect(balance, "should mint proper amount of tokens to recipient").bignumber.to.eq(amount);
            });
        });
    });

    describe("precision conversion", async () => {
        let masset: MassetV3Instance;
        let basketManagerObj: BasketManagerObj;
        let token: TokenInstance;

        beforeEach(async () => {
            masset = await MassetV3.new();
            token = await createToken(masset);
            basketManagerObj = await createBasketManager(masset, [20, 12], [100, -1000000]);
            await masset.initialize(
                basketManagerObj.basketManager.address,
                token.address,
                false,
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

            expect(await getBalance(token, standardAccounts.dummy1)).bignumber.to.equal(tokens(2));
            expect(await getBalance(basketManagerObj.mockToken1, standardAccounts.dummy1)).bignumber.to.equal(tokens(0));
            expect(await getBalance(basketManagerObj.mockToken2, standardAccounts.dummy1)).bignumber.to.equal(tokens(0));

            await token.transfer(standardAccounts.dummy2, tokens(1), {
                from: standardAccounts.dummy1,
            });
            expect(await getBalance(token, standardAccounts.dummy1)).bignumber.to.equal(tokens(1));

            await masset.redeem(basketManagerObj.mockToken2.address, tokens(1), {
                from: standardAccounts.dummy2,
            });
            expect(await getBalance(token, standardAccounts.dummy2)).bignumber.to.equal(tokens(0));
            expect(await getBalance(basketManagerObj.mockToken2, standardAccounts.dummy2)).bignumber.to.equal(initialToken2Balance);
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
    factors: Array<number>,
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
