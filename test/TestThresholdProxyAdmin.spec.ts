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
    IMockDummyInstance
} from "types/generated";

const { expect } = envSetup.configure();

const ThresholdProxyAdmin = artifacts.require("ThresholdProxyAdmin");
const MassetProxy = artifacts.require("MassetProxy");
const IMockDummy = artifacts.require("IMockDummy");
const MockDummy1 = artifacts.require("MockDummy1");
const MockDummy2 = artifacts.require("MockDummy2");

contract("ThresholdProxyAdmin", async (accounts) => {
    const sa = new StandardAccounts(accounts);

    before("before all", async () => {
    });

    describe("constructor", async () => {
        it("should succeed", async () => {
            const instance = await ThresholdProxyAdmin.new();
            const tproxy = await instance.getProxy();
            expect(tproxy).to.equal(ZERO_ADDRESS);
        });
    });

    describe("initialize", async () => {
        const proxy = await MassetProxy.new();
        const admins = [ sa.dummy1, sa.dummy2, sa.dummy3 ];

        context("should succeed", async () => {
            it("when all parameters given", async () => {
                const instance = await ThresholdProxyAdmin.new();
                await instance.initialize.sendTransaction(proxy.address, admins, 2);
            });
        });

        context("should fail", async () => {
            let instance;
            beforeEach(async () => {
                instance = await ThresholdProxyAdmin.new();
            });
            it("when no proxy given", async () => {
                await expectRevert(instance.initialize.sendTransaction(ZERO_ADDRESS, admins, 2), "invalid proxy address");
            });
            it("when no admins given", async () => {
                await expectRevert(instance.initialize.sendTransaction(proxy.address, [], 2), "admins");
            });
            it("when threshold < 2", async () => {
                await expectRevert(instance.initialize.sendTransaction(proxy.address, admins, 1), "threshold");
            });
            it("when threshold > admins.length", async () => {
                await expectRevert(instance.initialize.sendTransaction(proxy.address, admins, admins.length + 1), "threshold");
            });
            it("when already initialized", async () => {
                await instance.initialize.sendTransaction(proxy.address, admins, 2);
                await expectRevert(instance.initialize.sendTransaction(proxy.address, admins, 2),
                    "VM Exception while processing transaction: revert Contract instance has already been initialized");
            });
        });
    });
    describe("propose upgrade", async () => {
        const admins = [sa.dummy1, sa.dummy2, sa.dummy3];
        const ACTION_UPGRADE = '1';

        context("should succeed", async () => {
            let instance: ThresholdProxyAdminInstance;
            let proxy: MassetProxyInstance;
            let mockDummyOld: IMockDummyInstance;
            let mockDummyNew: IMockDummyInstance;
            let castedProxy: IMockDummyInstance;
            beforeEach(async () => {
                instance = await ThresholdProxyAdmin.new();
                proxy = await MassetProxy.new();
                mockDummyOld = await MockDummy1.new();
                mockDummyNew = await MockDummy2.new();
                await proxy.methods['initialize(address,address,bytes)'](mockDummyOld.address, instance.address, '0x');
                await instance.initialize(proxy.address, admins, 2);
                castedProxy = await IMockDummy.at(proxy.address);
            });
            it("on happy flow", async () => {
                expect(await castedProxy.getVersion()).to.equal('1');
                let tx = await instance.propose(ACTION_UPGRADE, mockDummyNew.address, '0x', { from: sa.dummy1 });
                expectEvent(tx.receipt, 'Proposed', {
                    admin: sa.dummy1,
                    action: ACTION_UPGRADE,
                    target: mockDummyNew.address,
                    data: null
                });
                tx = await instance.propose(ACTION_UPGRADE, mockDummyNew.address, '0x', { from: sa.dummy2 });
                expectEvent(tx.receipt, 'Proposed', {
                    admin: sa.dummy2,
                    action: ACTION_UPGRADE,
                    target: mockDummyNew.address,
                    data: null
                });
                tx = await instance.accept({ from: sa.dummy1 });
                expectEvent(tx.receipt, 'Accepted', {
                    admin: sa.dummy1,
                    action: ACTION_UPGRADE,
                    target: mockDummyNew.address,
                    data: null
                });
                expect(await castedProxy.getVersion()).to.equal('2');
            });
        });
        context("should fail", async () => {
            let instance: ThresholdProxyAdminInstance;
            let proxy: MassetProxyInstance;
            beforeEach(async () => {
                instance = await ThresholdProxyAdmin.new();
                proxy = await MassetProxy.new();
                instance.initialize(proxy.address, admins, 2);
            });
            it("on threshold not met", async () => {
                const tx = await instance.propose(ACTION_UPGRADE, sa.dummy4, '0x1234', { from: sa.dummy1 });
                expectEvent(tx.receipt, 'Proposed', {
                    admin: sa.dummy1,
                    action: ACTION_UPGRADE,
                    target: sa.dummy4,
                    data: '0x1234'
                });
                await expectRevert(instance.accept({ from: sa.dummy1 }),
                    'VM Exception while processing transaction: revert threshold not met');
            });
            it("on double propose", async () => {
                const tx = await instance.propose(ACTION_UPGRADE, sa.dummy4, '0x1234', { from: sa.dummy1 });
                expectEvent(tx.receipt, 'Proposed', {
                    admin: sa.dummy1,
                    action: ACTION_UPGRADE,
                    target: sa.dummy4,
                    data: '0x1234'
                });
                await expectRevert(instance.propose(ACTION_UPGRADE, sa.dummy4, '0x1234', { from: sa.dummy1 }),
                    'VM Exception while processing transaction: revert proposal already exists');
            });
            it("if not proposed", async () => {
                await expectRevert(instance.accept({ from: sa.dummy1 }),
                    'VM Exception while processing transaction: revert proposal not found');
            });
            it("if retracted", async () => {
                let tx = await instance.propose(ACTION_UPGRADE, sa.dummy4, '0x1234', { from: sa.dummy1 });
                expectEvent(tx.receipt, 'Proposed', {
                    admin: sa.dummy1,
                    action: ACTION_UPGRADE,
                    target: sa.dummy4,
                    data: '0x1234'
                });
                tx = await instance.propose(ACTION_UPGRADE, sa.dummy4, '0x1234', { from: sa.dummy2 });
                expectEvent(tx.receipt, 'Proposed', {
                    admin: sa.dummy2,
                    action: ACTION_UPGRADE,
                    target: sa.dummy4,
                    data: '0x1234'
                });
                tx = await instance.retract({ from: sa.dummy2 });
                expectEvent(tx.receipt, 'Retracted', {
                    admin: sa.dummy2,
                    action: ACTION_UPGRADE,
                    target: sa.dummy4,
                    data: '0x1234'
                });
                await expectRevert(instance.accept({ from: sa.dummy1 }),
                    'VM Exception while processing transaction: revert threshold not met');
            });
        });
    });
});
