import { toWei } from "web3-utils";
import { expectRevert } from "@openzeppelin/test-helpers";

import { BN } from "@utils/tools";
import envSetup from "@utils/env_setup";
import { ZERO, ZERO_ADDRESS } from "@utils/constants";
import { StandardAccounts } from "@utils/standardAccounts";
import { BasketManagerV3Instance, MockERC20Instance } from "types/generated";

const MockERC20 = artifacts.require("MockERC20");
const BasketManagerV3 = artifacts.require("BasketManagerV3");

const { expect } = envSetup.configure();

const tokens = (amount: string | number): BN => toWei(new BN(amount), 'ether');

contract("BasketManagerV3", async (accounts) => {
    const [owner, user, massetMock] = accounts;

    const sa = new StandardAccounts(accounts);
    const factors = [1, 1];
    const mins = [10, 10];
    const maxs = [100, 100];
    const pauses = [false, false];
    const bridges = [ZERO_ADDRESS, ZERO_ADDRESS];

    let basketManager: BasketManagerV3Instance;
    let mockToken1: MockERC20Instance;
    let mockToken2: MockERC20Instance;

    before("before all", async () => {
        basketManager = await BasketManagerV3.new();
    });

    describe("checkBasketBalanceForDeposit", async () => {
        beforeEach("before each", async () => {
            basketManager = await BasketManagerV3.new({ from: owner });

            mockToken1 = await MockERC20.new("", "", 18, sa.dummy1, tokens(100), { from: owner });
            mockToken2 = await MockERC20.new("", "", 18, sa.dummy1, tokens(100), { from: owner });

            await basketManager.initialize(massetMock, { from: owner });
        });

        context("should fail", async () => {
            it("when Basset is not valid", async () => {
                await expectRevert(
                    basketManager.checkBasketBalanceForDeposit(mockToken1.address, tokens(10)),
                    "VM Exception while processing transaction: reverted with reason string 'invalid basset'"
                );
            });

            it("when Basset is paused", async () => {
                await basketManager.addBasset(mockToken1.address, 1, ZERO_ADDRESS, 10, 100, true, { from: owner });

                await expectRevert(
                    basketManager.checkBasketBalanceForDeposit(mockToken1.address, tokens(10)),
                    "VM Exception while processing transaction: reverted with reason string 'basset is paused'"
                );
            });
        });

        context("should succeed", async () => {
            let bassets: string[];

            beforeEach("before each", async () => {
                bassets = [mockToken1.address, mockToken2.address];

                await basketManager.addBassets(bassets, factors, bridges, mins, maxs, pauses, { from: owner });
            });

            context("should return true", async () => {
                it("when basket balance is sufficient", async () => {
                    await mockToken1.giveMe(tokens(1), { from: massetMock });
                    await mockToken2.giveMe(tokens(100), { from: massetMock });

                    const result = await basketManager.checkBasketBalanceForDeposit(bassets[0], tokens(1));
                    expect(result).to.equal(true);
                });
            });

            context("should return false", async () => {
                it("when basket balance is not sufficient", async () => {
                    const result = await basketManager.checkBasketBalanceForDeposit(bassets[0], 10);
                    expect(result).to.equal(false);
                });

                it("with ratio bigger than max", async () => {
                    await mockToken1.giveMe(tokens(10), { from: massetMock });
                    await mockToken2.giveMe(tokens(10), { from: massetMock });

                    const result = await basketManager.checkBasketBalanceForDeposit(bassets[0], tokens(1));
                    expect(result).to.equal(false);
                });
            });
        });
    });

    describe("checkBasketBalanceForWithdrawal", async () => {
        beforeEach("before each", async () => { 
            mockToken1 = await MockERC20.new("", "", 18, sa.dummy1, tokens(100), { from: owner });
            mockToken2 = await MockERC20.new("", "", 18, sa.dummy1, tokens(100), { from: owner });
            
            basketManager = await BasketManagerV3.new({ from: owner });
            await basketManager.initialize(massetMock, { from: owner });
        });

        context("should fail", async () => {
            it("when Basset is not valid", async () => {
                await expectRevert(
                    basketManager.checkBasketBalanceForWithdrawal(mockToken1.address, tokens(10)),
                    "VM Exception while processing transaction: reverted with reason string 'invalid basset'"
                );
            });

            it("when Basset is paused", async () => {
                await basketManager.addBasset(mockToken1.address, 1, ZERO_ADDRESS, 10, 100, true, { from: owner });

                await expectRevert(
                    basketManager.checkBasketBalanceForWithdrawal(mockToken1.address, tokens(10)),
                    "VM Exception while processing transaction: reverted with reason string 'basset is paused'"
                );
            });

            it("when Basset balance is not sufficient", async () => {
                await basketManager.addBasset(mockToken1.address, 1, ZERO_ADDRESS, 10, 100, false, { from: owner });

                await expectRevert(
                    basketManager.checkBasketBalanceForWithdrawal(mockToken1.address, tokens(10)),
                    "VM Exception while processing transaction: reverted with reason string 'basset balance is not sufficient'"
                );
            });
        });

        context("should succeed", async () => {
            let bassets: string[];

            beforeEach("before each", async () => {
                bassets = [mockToken1.address, mockToken2.address];
                await basketManager.addBassets(bassets, factors, bridges, mins, maxs, pauses, { from: owner });
            });

            context("should return true", async () => {
                it("with proper calculated ratio", async () => {
                    await mockToken1.giveMe(tokens(1000), { from: massetMock });
                    await mockToken2.giveMe(tokens(10), { from: massetMock });

                    const result = await basketManager.checkBasketBalanceForWithdrawal(bassets[0], tokens(10));
                    expect(result).to.equal(true);
                });

                it('with zero minimum and full withdrawal', async () => {
                    await mockToken1.giveMe(tokens(10), { from: massetMock });

                    await basketManager.setRange(bassets[0], 0, 1000, { from: owner });
                    const result = await basketManager.checkBasketBalanceForWithdrawal(bassets[0], tokens(10));
                    expect(result).to.equal(true);
                });
            });

            context("should return false", async () => {
                it("with ratio smaller than min", async () => {
                    await mockToken1.giveMe(tokens(10), { from: massetMock });
                    await mockToken2.giveMe(tokens(1000), { from: massetMock });

                    const result = await basketManager.checkBasketBalanceForWithdrawal(bassets[0], tokens(10));
                    expect(result).to.equal(false);
                });

                it('with non-zero minimum and full withdrawal', async () => {
                    await mockToken1.giveMe(tokens(10), { from: massetMock });

                    await basketManager.setRange(bassets[0], 10, 1000, { from: owner });
                    const result = await basketManager.checkBasketBalanceForWithdrawal(bassets[0], tokens(10));
                    expect(result).to.equal(false);
                });
            });
        });
    });

    describe("convertBassetToMassetQuantity", async () => {
        context("should fail", async () => {
            it("when Basset is invalid", async () => {
                mockToken1 = await MockERC20.new("", "", 18, sa.dummy1, tokens(100), { from: owner });

                await expectRevert(
                    basketManager.convertBassetToMassetQuantity(mockToken1.address, tokens(10)),
                    "VM Exception while processing transaction: reverted with reason string 'invalid basset'"
                );
            });
        });

        context("should succeed", async () => {
            beforeEach("before each", async () => {
                mockToken1 = await MockERC20.new("", "", 18, sa.dummy1, tokens(100), { from: owner });

                basketManager = await BasketManagerV3.new({ from: owner });
                await basketManager.initialize(massetMock, { from: owner });
            });
            
            it("works fine with factor equal 1", async () => {
                await basketManager.addBasset(mockToken1.address, 1, ZERO_ADDRESS, 10, 100, false, { from: owner });
                const massetAmount = await basketManager.convertBassetToMassetQuantity(mockToken1.address, tokens(10));
                const expectedMassetAmount = tokens(10);
                expect(massetAmount).bignumber.to.eq(expectedMassetAmount);
            });

            it("works fine with positive factor", async () => {
                const factor = 10;
                await basketManager.addBasset(mockToken1.address, factor, ZERO_ADDRESS, 10, 100, false, { from: owner });

                const massetAmount = await basketManager.convertBassetToMassetQuantity(mockToken1.address, tokens(100));
                const expectedMassetAmount = tokens(100).div(new BN(factor));

                expect(massetAmount).bignumber.to.eq(expectedMassetAmount);
            });

            it("works fine with negative factor", async () => {
                const factor = -10;
                await basketManager.addBasset(mockToken1.address, factor, ZERO_ADDRESS, 10, 100, false, { from: owner });

                const massetAmount = await basketManager.convertBassetToMassetQuantity(mockToken1.address, tokens(100));
                const expectedMassetAmount = tokens(100).mul(new BN(-factor));

                expect(massetAmount).bignumber.to.eq(expectedMassetAmount);
            });
        });
    });

    describe("convertMassetToBassetQuantity", async () => {
        context("should fail", async () => {
            it("when Basset is invalid", async () => {
                mockToken1 = await MockERC20.new("", "", 18, sa.dummy1, tokens(100), { from: owner });

                await expectRevert(
                    basketManager.convertMassetToBassetQuantity(mockToken1.address, tokens(10)),
                    "VM Exception while processing transaction: reverted with reason string 'invalid basset'"
                );
            });
        });

        context("should succeed", async () => {
            beforeEach("before each", async () => {
                mockToken1 = await MockERC20.new("", "", 18, sa.dummy1, tokens(100), { from: owner });

                basketManager = await BasketManagerV3.new({ from: owner });
                await basketManager.initialize(massetMock, { from: owner });
            });
            
            it("works fine with factor equal 1", async () => {
                await basketManager.addBasset(mockToken1.address, 1, ZERO_ADDRESS, 10, 100, false, { from: owner });
                const bassetAmount = await basketManager.convertMassetToBassetQuantity(mockToken1.address, tokens(10));
                const expectedBassetAmount = tokens(10);

                expect(bassetAmount).bignumber.to.eq(expectedBassetAmount);
            });

            it("works fine with positive factor", async () => {
                const factor = 10;
                await basketManager.addBasset(mockToken1.address, factor, ZERO_ADDRESS, 10, 100, false, { from: owner });

                const bassetAmount = await basketManager.convertMassetToBassetQuantity(mockToken1.address, tokens(100));
                const expectedBassetAmount = tokens(100).mul(new BN(factor));

                expect(bassetAmount).bignumber.to.eq(expectedBassetAmount);
            });

            it("works fine with negative factor", async () => {
                const factor = -10;
                await basketManager.addBasset(mockToken1.address, factor, ZERO_ADDRESS, 10, 100, false, { from: owner });

                const bassetAmount = await basketManager.convertMassetToBassetQuantity(mockToken1.address, tokens(100));
                const expectedBassetAmount = tokens(100).div(new BN(-factor));

                expect(bassetAmount).bignumber.to.eq(expectedBassetAmount);
            });
        });
    });

    describe("getTotalMassetBalance", async () => {
        let bassets: string[];

        beforeEach("before each", async () => {
            mockToken1 = await MockERC20.new("", "", 18, sa.dummy1, tokens(100), { from: owner });
            mockToken2 = await MockERC20.new("", "", 18, sa.dummy1, tokens(100), { from: owner });
            bassets = [mockToken1.address, mockToken2.address];

            basketManager = await BasketManagerV3.new({ from: owner });
            await basketManager.initialize(massetMock, { from: owner });
        });

        it("returns 0 with no bassets", async () => {
            const totalBalance = await basketManager.getTotalMassetBalance();
            expect(totalBalance).bignumber.to.eq(ZERO);
        });

        it("returns 0 with empty balance of bassets", async () => {
            await basketManager.addBassets(bassets, factors, bridges, mins, maxs, pauses, { from: owner });

            const totalBalance = await basketManager.getTotalMassetBalance();
            expect(totalBalance).bignumber.to.eq(ZERO);
        });

        it("properly calculates total Masset balance", async () => {
            await basketManager.addBassets(bassets, factors, bridges, mins, maxs, pauses, { from: owner });
            await mockToken1.giveMe(tokens(10), { from: massetMock });
            await mockToken2.giveMe(tokens(1000), { from: massetMock });

            const expectedTotalBalance = tokens(10).add(tokens(1000));
            const totalBalance = await basketManager.getTotalMassetBalance();
            expect(totalBalance).bignumber.to.eq(expectedTotalBalance);
        });
    });

    describe("addBasset", async () => {
        beforeEach("before each", async () => {
            mockToken1 = await MockERC20.new("", "", 18, sa.dummy1, tokens(100), { from: owner });

            basketManager = await BasketManagerV3.new({ from: owner });
            await basketManager.initialize(massetMock, { from: owner });
        });

        context("should fail", async () => {
            it("when it's not called by the owner", async () => {
                await expectRevert(
                    basketManager.addBasset(mockToken1.address, 1, ZERO_ADDRESS, 10, 100, false, { from: user }),
                    "VM Exception while processing transaction: reverted with reason string 'InitializableOwnable: caller is not the owner'"
                );
            });

            it("when basset is zero address", async () => {
                await expectRevert(
                    basketManager.addBasset(ZERO_ADDRESS, 1, ZERO_ADDRESS, 10, 100, false, { from: owner }),
                    "VM Exception while processing transaction: reverted with reason string 'invalid basset address'"
                );
            });

            it("when basset already exists", async () => {
                await basketManager.addBasset(mockToken1.address, 1, ZERO_ADDRESS, 10, 100, false, { from: owner });
                await expectRevert(
                    basketManager.addBasset(mockToken1.address, 1, ZERO_ADDRESS, 10, 100, false, { from: owner }),
                    "VM Exception while processing transaction: reverted with reason string 'basset already exists'"
                );
            });
        });

        context("should succeed", async () => {
            it("with all valid params", async () => {
                await basketManager.addBasset(mockToken1.address, 1, ZERO_ADDRESS, 10, 100, false, { from: owner });

                const { 0: min, 1: max} = await basketManager.getRange(mockToken1.address);

                expect(min.toString()).to.equal('10');
                expect(max.toString()).to.equal('100');
                expect((await basketManager.getFactor(mockToken1.address)).toString()).to.equal('1');
                expect((await basketManager.getBridge(mockToken1.address)).toString()).to.equal(ZERO_ADDRESS);
                expect((await basketManager.getPaused(mockToken1.address))).to.equal(false);
            });
        });
    });

    describe("setFactor", async () => {
        beforeEach("before each", async () => {
            basketManager = await BasketManagerV3.new({ from: owner });

            mockToken1 = await MockERC20.new("", "", 18, sa.dummy1, tokens(100), { from: owner });

            await basketManager.initialize(massetMock, { from: owner });
            await basketManager.addBasset(mockToken1.address, 1, ZERO_ADDRESS, 10, 100, false, { from: owner });
        });

        context("should fail", async () => {
            it("when factor is zero", async () => {
                await expectRevert(
                    basketManager.setFactor(mockToken1.address, 0, { from: owner }),
                    "VM Exception while processing transaction: reverted with reason string 'invalid factor'"
                );
            });

            it("when factor is not a power of 10", async () => {
                await expectRevert(
                    basketManager.setFactor(mockToken1.address, 2, { from: owner }),
                    "VM Exception while processing transaction: reverted with reason string 'factor must be power of 10'"
                );
            });
        });

        context("should succeed", async () => {
            it("when factor is 1", async () => {
                const factor = new BN('1');
                await basketManager.setFactor(mockToken1.address, factor, { from: owner });
                const setFactor = await basketManager.getFactor(mockToken1.address);

                expect(setFactor.eq(factor)).to.equal(true);
            });

            it("when factor is a power of 10", async () => {
                const factor = new BN('1000');
                await basketManager.setFactor(mockToken1.address, factor, { from: owner });
                const setFactor = await basketManager.getFactor(mockToken1.address);

                expect(setFactor.eq(factor)).to.equal(true);
            });
        });
    });

    describe("removeBasset", async () => {
        beforeEach("before each", async () => {
            basketManager = await BasketManagerV3.new({ from: owner });

            mockToken1 = await MockERC20.new("", "", 18, sa.dummy1, tokens(100), { from: owner });

            await basketManager.initialize(massetMock, { from: owner });
            await basketManager.addBasset(mockToken1.address, 1, ZERO_ADDRESS, 10, 100, false, { from: owner });
        });

        context("should fail", async () => {
            it("when it's not called by the owner", async () => {
                await expectRevert(
                    basketManager.removeBasset(mockToken1.address, { from: user }),
                    "VM Exception while processing transaction: reverted with reason string 'InitializableOwnable: caller is not the owner'"
                );
            });

            it("when balance is not empty", async () => {
                await mockToken1.giveMe(tokens(10), { from: massetMock });
                await expectRevert(
                    basketManager.removeBasset(mockToken1.address, { from: owner }),
                    "VM Exception while processing transaction: reverted with reason string 'balance not zero'"
                );
            });
        });

        context("should succeed", async () => {
            it("with all valid params", async () => {
                await basketManager.removeBasset(mockToken1.address, { from: owner });

                const isValid = await basketManager.isValidBasset(mockToken1.address);
                expect(isValid).to.equal(false);
            });
        });
    });
});
