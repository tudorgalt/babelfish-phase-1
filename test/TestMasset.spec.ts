/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-use-before-define */
import { expectRevert, expectEvent, time } from "@openzeppelin/test-helpers";
import * as t from "types/generated";
import { ZERO_ADDRESS, TEN_MINS, MAX_UINT256 } from "@utils/constants";
import { StandardAccounts } from "@utils/standardAccounts";
import envSetup from "@utils/env_setup";
import {
    MassetProxyInstance,
    MockERC20Instance,
    ThresholdProxyAdminContract,
    ThresholdProxyAdminInstance,
} from "types/generated";

const { expect } = envSetup.configure();

const ThresholdProxyAdmin = artifacts.require("ThresholdProxyAdmin");
const BasketManager = artifacts.require("BasketManager");
const Masset = artifacts.require("Masset");
const MockERC20 = artifacts.require("MockERC20");

contract("Masset", async (accounts) => {
    const sa = new StandardAccounts(accounts);

    before("before all", async () => {
    });

    describe("constructor", async () => {
        it("should succeed", async () => {
            const inst = await BasketManager.new();
        });
    });

    describe("initialize", async () => {
        let masset, basketManager;
        let mockToken1, mockToken2, mockToken3, mockToken4;
        let bassets;
        beforeEach(async () => {
            masset = await Masset.new();
            mockToken1 = await MockERC20.new('', '', 18, sa.dummy1, 1000);
            mockToken2 = await MockERC20.new('', '', 18, sa.dummy1, 1000);
            mockToken3 = await MockERC20.new('', '', 18, sa.dummy1, 1000);
            mockToken4 = await MockERC20.new('', '', 18, sa.dummy1, 1000);
            bassets = [mockToken1.address, mockToken2.address, mockToken3.address];
            basketManager = await BasketManager.new();
            await basketManager.initialize(masset.address, bassets);
        });
        context("should succeed", async () => {
            it("when given a valid basket manager", async () => {
                await masset.initialize('masset', 'm', basketManager.address);
            });
        });
        context("should fail", async () => {
            it("when basket manager missing", async () => {
                await expectRevert(masset.initialize('masset', 'm', ZERO_ADDRESS),
                    'Exception while processing transaction: revert invalid basket manager address');
            });
            it("when already initialized", async () => {
                await masset.initialize('masset', 'm', basketManager.address);
                await expectRevert(masset.initialize('masset', 'm', basketManager.address),
                    'VM Exception while processing transaction: revert Contract instance has already been initialized');
            });
        });
    });

    describe("mint", async () => {
        let masset, basketManager;
        let mockToken1, mockToken2, mockToken3, mockToken4;
        let bassets;
        beforeEach(async () => {
            masset = await Masset.new();
            mockToken1 = await MockERC20.new('', '', 18, sa.dummy1, 1000);
            mockToken2 = await MockERC20.new('', '', 18, sa.dummy1, 1000);
            mockToken3 = await MockERC20.new('', '', 18, sa.dummy1, 1000);
            mockToken4 = await MockERC20.new('', '', 18, sa.dummy1, 1000);
            bassets = [mockToken1.address, mockToken2.address, mockToken3.address];
            basketManager = await BasketManager.new();
            await basketManager.initialize(masset.address, bassets);
            await masset.initialize('masset', 'm', basketManager.address);
        });
        context("should succeed", () => {
            it("if all params are valid", async () => {
                const sum = 11;
                await mockToken1.approve(masset.address, sum, { from: sa.dummy1 });
                await masset.mint(mockToken1.address, sum, { from: sa.dummy1 });
                const balance = await masset.balanceOf(sa.dummy1);
                expect(balance.toString()).to.equal(`${sum}`);
            });
        });
        context("should fail", () => {
            it("if basset is invalid", async () => {
                await expectRevert(masset.mint(ZERO_ADDRESS, 10),
                    'VM Exception while processing transaction: revert invalid basset');
            });
            it("if basset is not in the basket", async () => {
                await expectRevert(masset.mint(mockToken4.address, 10),
                    'VM Exception while processing transaction: revert invalid basset');
            });
            it("if amount is greater than the balance", async () => {
                await expectRevert(masset.mint(mockToken1.address, 100000),
                    'VM Exception while processing transaction: revert ERC20: transfer amount exceeds balance');
            });
        });
    });
    describe("mintTo", async () => {
        let masset, basketManager;
        let mockToken1, mockToken2, mockToken3, mockToken4;
        let bassets;
        beforeEach(async () => {
            masset = await Masset.new();
            mockToken1 = await MockERC20.new('', '', 18, sa.dummy1, 1000);
            mockToken2 = await MockERC20.new('', '', 18, sa.dummy1, 1000);
            mockToken3 = await MockERC20.new('', '', 18, sa.dummy1, 1000);
            mockToken4 = await MockERC20.new('', '', 18, sa.dummy1, 1000);
            bassets = [mockToken1.address, mockToken2.address, mockToken3.address];
            basketManager = await BasketManager.new();
            await basketManager.initialize(masset.address, bassets);
            await masset.initialize('masset', 'm', basketManager.address);
        });
        context("should succeed", () => {
            it("if all params are valid", async () => {
                const sum = 11;
                await mockToken1.approve(masset.address, sum, { from: sa.dummy1 });
                await masset.mintTo(mockToken1.address, sum, sa.dummy4, { from: sa.dummy1 });
                const balance = await masset.balanceOf(sa.dummy4);
                expect(balance.toString()).to.equal(`${sum}`);
            });
        });
    });

    describe("redeem", async () => {
        let masset, basketManager;
        let mockToken1, mockToken2, mockToken3, mockToken4;
        let bassets;
        beforeEach(async () => {
            masset = await Masset.new();
            mockToken1 = await MockERC20.new('', '', 18, sa.dummy1, 1000);
            mockToken2 = await MockERC20.new('', '', 18, sa.dummy1, 1000);
            mockToken3 = await MockERC20.new('', '', 18, sa.dummy1, 1000);
            mockToken4 = await MockERC20.new('', '', 18, sa.dummy1, 1000);
            bassets = [mockToken1.address, mockToken2.address, mockToken3.address];
            basketManager = await BasketManager.new();
            await basketManager.initialize(masset.address, bassets);
            await masset.initialize('masset', 'm', basketManager.address);
        });
        context("should succeed", () => {
            it("if all params are valid", async () => {
                const sum = 11;
                await mockToken1.approve(masset.address, sum, { from: sa.dummy1 });
                await masset.mint(mockToken1.address, sum, { from: sa.dummy1 });
                let balance = await masset.balanceOf(sa.dummy1);
                expect(balance.toString()).to.equal(`${sum}`);
                balance = await mockToken1.balanceOf(sa.dummy1);
                expect(balance.toString()).to.equal('999999999999999999989'); // 1000 * precision - sum
                await masset.redeem(mockToken1.address, sum, { from: sa.dummy1 });
                balance = await masset.balanceOf(sa.dummy1);
                expect(balance.toString()).to.equal(`0`);
                balance = await mockToken1.balanceOf(sa.dummy1);
                expect(balance.toString()).to.equal('1000000000000000000000'); // original sum
            });
        });
        context("should fail", () => {
            it("if basset is invalid", async () => {
                await expectRevert(masset.redeem(ZERO_ADDRESS, 10),
                    'VM Exception while processing transaction: revert invalid basset');
            });
            it("if basset is not in the basket", async () => {
                await expectRevert(masset.redeem(mockToken4.address, 10),
                    'VM Exception while processing transaction: revert invalid basset');
            });
            it("if amount is greater than the balance", async () => {
                await expectRevert(masset.redeem(mockToken1.address, 100000),
                    'VM Exception while processing transaction: revert ERC20: transfer amount exceeds balance');
            });
        });
    });

    describe("precision conversion", async () => {
        let masset, basketManager;
        let mockToken1, mockToken2, mockToken3, mockToken4;
        let bassets;
        beforeEach(async () => {
            masset = await Masset.new();
            mockToken1 = await MockERC20.new('', '', 12, sa.dummy1, 1);
            mockToken2 = await MockERC20.new('', '', 3, sa.dummy1, 1);
            bassets = [mockToken1.address, mockToken2.address];
            basketManager = await BasketManager.new();
            await basketManager.initialize(masset.address, bassets);
            await masset.initialize('masset', 'm', basketManager.address);
        });
        it("works both ways", async () => {
            let b = await mockToken1.balanceOf((sa.dummy1));
            expect(b.toString(10)).to.equal('1000000000000');
            b = await mockToken2.balanceOf((sa.dummy1));
            expect(b.toString(10)).to.equal('1000');

            await mockToken1.approve(masset.address, '1000000000000', { from: sa.dummy1 });
            await masset.mint(mockToken1.address, '1000000000000', { from: sa.dummy1 });
            await mockToken2.approve(masset.address, '1000', { from: sa.dummy1 });
            await masset.mint(mockToken2.address, '1000', { from: sa.dummy1 });
            b = await masset.balanceOf(sa.dummy1);
            expect(b.toString(10)).to.equal('2000000000000000000');
            b = await mockToken1.balanceOf(sa.dummy1);
            expect(b.toString(10)).to.equal('0');
            b = await mockToken2.balanceOf(sa.dummy1);
            expect(b.toString(10)).to.equal('0');

            await masset.redeem(mockToken2.address, '1000000000000000000', { from: sa.dummy1 });
            b = await masset.balanceOf(sa.dummy1);
            expect(b.toString(10)).to.equal('1000000000000000000');
            b = await mockToken2.balanceOf(sa.dummy1);
            expect(b.toString(10)).to.equal('1000');
        });
    });
});
