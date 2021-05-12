/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-use-before-define */
import { expectRevert, expectEvent, time } from "@openzeppelin/test-helpers";
import * as t from "types/generated";
import { ZERO_ADDRESS, TEN_MINS, MAX_UINT256 } from "@utils/constants";
import { StandardAccounts } from "@utils/standardAccounts";
import envSetup from "@utils/env_setup";
import {
    MassetContract,
    MassetProxyInstance,
    MockERC20Instance,
    ThresholdProxyAdminContract,
    ThresholdProxyAdminInstance,
    MassetInstance,
    BasketManagerInstance
} from "types/generated";

const { expect } = envSetup.configure();

const ThresholdProxyAdmin = artifacts.require("ThresholdProxyAdmin");
const BasketManager = artifacts.require("BasketManager");
const Masset = artifacts.require("Masset");
const MockERC20 = artifacts.require("MockERC20");

let standardAccounts;

contract("Masset", async (accounts) => {
    standardAccounts = new StandardAccounts(accounts);

    before("before all", async () => {
    });

    describe("constructor", async () => {
        it("should succeed", async () => {
            const inst = await BasketManager.new();
        });
    });

    describe("initialize", async () => {
        let masset;
        let basketManagerObj;
        beforeEach(async () => {
            masset = await Masset.new();
            basketManagerObj = await createBasketManager(masset, [18, 18], [1, 1]);
        });
        context("should succeed", async () => {
            it("when given a valid basket manager", async () => {
                await masset.initialize('masset', 'm', basketManagerObj.basketManager.address);
            });
        });
        context("should fail", async () => {
            it("when basket manager missing", async () => {
                await expectRevert(masset.initialize('masset', 'm', ZERO_ADDRESS),
                    'Exception while processing transaction: revert invalid basket manager address');
            });
            it("when already initialized", async () => {
                await masset.initialize('masset', 'm', basketManagerObj.basketManager.address);
                await expectRevert(masset.initialize('masset', 'm', basketManagerObj.basketManager.address),
                    'VM Exception while processing transaction: revert Contract instance has already been initialized');
            });
        });
    });

    describe("mint", async () => {
        let masset;
        let basketManagerObj;
        let mockTokenDummy;
        beforeEach(async () => {
            masset = await Masset.new();
            basketManagerObj = await createBasketManager(masset, [18, 18], [1, 1]);
            await masset.initialize('masset', 'm', basketManagerObj.basketManager.address);
            mockTokenDummy = await MockERC20.new('', '', 12, standardAccounts.dummy1, 1);
        });
        context("should succeed", () => {
            it("if all params are valid", async () => {
                const sum = 11;
                await basketManagerObj.mockToken1.approve(masset.address, sum, { from: standardAccounts.dummy1 });
                await masset.mint(basketManagerObj.mockToken1.address, sum, { from: standardAccounts.dummy1 });
                const balance = await masset.balanceOf(standardAccounts.dummy1);
                expect(balance.toString()).to.equal(`${sum}`);
            });
        });
        context("should fail", () => {
            it("if basset is invalid", async () => {
                await expectRevert(masset.mint(ZERO_ADDRESS, 10),
                    'VM Exception while processing transaction: revert invalid basset');
            });
            it("if basset is not in the basket", async () => {
                await expectRevert(masset.mint(mockTokenDummy.address, 10),
                    'VM Exception while processing transaction: revert invalid basset');
            });
            it("if amount is greater than the balance", async () => {
                await expectRevert(masset.mint(basketManagerObj.mockToken1.address, 100000),
                    'VM Exception while processing transaction: revert ERC20: transfer amount exceeds balance');
            });
        });
    });
    describe("mintTo", async () => {
        let masset;
        let basketManagerObj;
        beforeEach(async () => {
            masset = await Masset.new();
            basketManagerObj = await createBasketManager(masset, [18, 18], [1, 1]);
            await masset.initialize('masset', 'm', basketManagerObj.basketManager.address);
        });
        context("should succeed", () => {
            it("if all params are valid", async () => {
                const sum = 11;
                await basketManagerObj.mockToken1.approve(masset.address, sum, { from: standardAccounts.dummy1 });
                await masset.mintTo(basketManagerObj.mockToken1.address, sum, standardAccounts.dummy4, { from: standardAccounts.dummy1 });
                const balance = await masset.balanceOf(standardAccounts.dummy4);
                expect(balance.toString()).to.equal(`${sum}`);
            });
        });
    });

    describe("redeem", async () => {
        let masset;
        let basketManagerObj;
        let mockTokenDummy;
        beforeEach(async () => {
            masset = await Masset.new();
            basketManagerObj = await createBasketManager(masset, [18, 18], [1, 1]);
            await masset.initialize('masset', 'm', basketManagerObj.basketManager.address);
            mockTokenDummy = await MockERC20.new('', '', 12, standardAccounts.dummy1, 1);
        });
        context("should succeed", () => {
            it("if all params are valid", async () => {
                const sum = 11;
                await basketManagerObj.mockToken1.approve(masset.address, sum, { from: standardAccounts.dummy1 });
                await masset.mint(basketManagerObj.mockToken1.address, sum, { from: standardAccounts.dummy1 });
                let balance = await masset.balanceOf(standardAccounts.dummy1);
                expect(balance.toString()).to.equal(`${sum}`);
                balance = await basketManagerObj.mockToken1.balanceOf(standardAccounts.dummy1);
                expect(balance.toString()).to.equal('999999999999999989');
                await masset.redeem(basketManagerObj.mockToken1.address, sum, { from: standardAccounts.dummy1 });
                balance = await masset.balanceOf(standardAccounts.dummy1);
                expect(balance.toString()).to.equal(`0`);
                balance = await basketManagerObj.mockToken1.balanceOf(standardAccounts.dummy1);
                expect(balance.toString()).to.equal('1000000000000000000'); // original sum
            });
        });
        context("should fail", () => {
            it("if basset is invalid", async () => {
                await expectRevert(masset.redeem(ZERO_ADDRESS, 10),
                    'VM Exception while processing transaction: revert invalid basset');
            });
            it("if basset is not in the basket", async () => {
                await expectRevert(masset.redeem(mockTokenDummy.address, 10),
                    'VM Exception while processing transaction: revert invalid basset');
            });
            it("if amount is greater than the balance", async () => {
                await expectRevert(masset.redeem(basketManagerObj.mockToken1.address, 100000),
                    'VM Exception while processing transaction: revert ERC20: transfer amount exceeds balance');
            });
        });
    });

    describe("precision conversion", async () => {
        let masset;
        let basketManagerObj;
        beforeEach(async () => {
            masset = await Masset.new();
            basketManagerObj = await createBasketManager(masset, [20, 12], [100, -1000000]);
            await masset.initialize('masset', 'm', basketManagerObj.basketManager.address);
        });
        it("works both ways", async () => {
            expect(await getBalance(basketManagerObj.mockToken1, standardAccounts.dummy1)).to.equal('100000000000000000000');
            expect(await getBalance(basketManagerObj.mockToken2, standardAccounts.dummy1)).to.equal('1000000000000');

            await basketManagerObj.mockToken1.approve(masset.address, '100000000000000000000', { from: standardAccounts.dummy1 });
            await masset.mint(basketManagerObj.mockToken1.address, '100000000000000000000', { from: standardAccounts.dummy1 });
            await basketManagerObj.mockToken2.approve(masset.address, '1000000000000', { from: standardAccounts.dummy1 });
            await masset.mint(basketManagerObj.mockToken2.address, '1000000000000', { from: standardAccounts.dummy1 });

            expect(await getBalance(masset, standardAccounts.dummy1)).to.equal('2000000000000000000');
            expect(await getBalance(basketManagerObj.mockToken1, standardAccounts.dummy1)).to.equal('0');
            expect(await getBalance(basketManagerObj.mockToken2, standardAccounts.dummy1)).to.equal('0');

            await masset.transfer(standardAccounts.dummy2, '1000000000000000000', { from: standardAccounts.dummy1 });
            expect(await getBalance(masset, standardAccounts.dummy1)).to.equal('1000000000000000000');

            await masset.redeem(basketManagerObj.mockToken2.address, '1000000000000000000', { from: standardAccounts.dummy2 });
            expect(await getBalance(masset, standardAccounts.dummy2)).to.equal('0');
            expect(await getBalance(basketManagerObj.mockToken2, standardAccounts.dummy2)).to.equal('1000000000000');
        });
    });
});

async function createBasketManager(
    masset: MassetInstance,
    decimals: Array<number>,
    factors: Array<number>): Promise<any> {

    const mockToken1 = await MockERC20.new('', '', decimals[0], standardAccounts.dummy1, 1);
    const mockToken2 = await MockERC20.new('', '', decimals[1], standardAccounts.dummy1, 1);
    const bassets = [mockToken1.address, mockToken2.address];
    const basketManager = await BasketManager.new();

    await basketManager.initialize(masset.address, bassets, factors);
    return {
        mockToken1, mockToken2,
        bassets,
        basketManager
    };
}

async function getBalance(token: any, who: string): Promise<string> {
    return (await token.balanceOf(who)).toString(10);
}
