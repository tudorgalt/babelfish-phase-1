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
    IMockDummyInstance,
} from "types/generated";

const { expect } = envSetup.configure();

const ThresholdProxyAdmin = artifacts.require("ThresholdProxyAdmin");
const MassetProxy = artifacts.require("MassetProxy");
const IMockDummy = artifacts.require("IMockDummy");
const MockDummy1 = artifacts.require("MockDummy1");
const MockDummy2 = artifacts.require("MockDummy2");

contract("ThresholdProxyAdmin", async (accounts) => {
    const sa = new StandardAccounts(accounts);

    before("before all", async () => {});

    describe("constructor", async () => {
        const proxy = await MassetProxy.new();
        const admins = [sa.dummy1, sa.dummy2, sa.dummy3];

        context("should succeed", async () => {
            it("when all parameters given", async () => {
                await ThresholdProxyAdmin.new(proxy.address, admins, 2);
            });
        });

        context("should fail", async () => {
            let instance;
            it("when no proxy given", async () => {
                await expectRevert(
                    ThresholdProxyAdmin.new(ZERO_ADDRESS, admins, 2),
                    "invalid proxy address",
                );
            });
            it("when no admins given", async () => {
                await expectRevert(
                    ThresholdProxyAdmin.new(proxy.address, [], 2),
                    "admins",
                );
            });
            it("when threshold < 2", async () => {
                await expectRevert(
                    ThresholdProxyAdmin.new(proxy.address, admins, 1),
                    "threshold",
                );
            });
            it("when threshold > admins.length", async () => {
                await expectRevert(
                    ThresholdProxyAdmin.new(proxy.address, admins, admins.length + 1),
                    "threshold",
                );
            });
        });
    });
    describe("propose upgrade", async () => {
        const admins = [sa.dummy1, sa.dummy2, sa.dummy3];
        const ACTION_UPGRADE = "1";

        context("should succeed", async () => {
            let instance: ThresholdProxyAdminInstance;
            let proxy: MassetProxyInstance;
            let mockDummyOld: IMockDummyInstance;
            let mockDummyNew: IMockDummyInstance;
            let castedProxy: IMockDummyInstance;
            beforeEach(async () => {
                proxy = await MassetProxy.new();
                mockDummyOld = await MockDummy1.new();
                mockDummyNew = await MockDummy2.new();
                instance = await ThresholdProxyAdmin.new(proxy.address, admins, 2);
                await proxy.methods["initialize(address,address,bytes)"](
                    mockDummyOld.address,
                    instance.address,
                    "0x",
                );
                castedProxy = await IMockDummy.at(proxy.address);
            });
            it("on happy flow", async () => {
                expect(await castedProxy.getVersion()).to.equal("1");
                let tx = await instance.propose(ACTION_UPGRADE, mockDummyNew.address, "0x", {
                    from: sa.dummy1,
                });
                expectEvent(tx.receipt, "Proposed", {
                    admin: sa.dummy1,
                    action: ACTION_UPGRADE,
                    target: mockDummyNew.address,
                    data: null,
                });
                tx = await instance.propose(ACTION_UPGRADE, mockDummyNew.address, "0x", {
                    from: sa.dummy2,
                });
                expectEvent(tx.receipt, "Proposed", {
                    admin: sa.dummy2,
                    action: ACTION_UPGRADE,
                    target: mockDummyNew.address,
                    data: null,
                });
                tx = await instance.accept({ from: sa.dummy1 });
                expectEvent(tx.receipt, "Accepted", {
                    admin: sa.dummy1,
                    action: ACTION_UPGRADE,
                    target: mockDummyNew.address,
                    data: null,
                });
                expect(await castedProxy.getVersion()).to.equal("2");
            });
        });
        context("should fail", async () => {
            let instance: ThresholdProxyAdminInstance;
            let proxy: MassetProxyInstance;
            beforeEach(async () => {
                proxy = await MassetProxy.new();
                instance = await ThresholdProxyAdmin.new(proxy.address, admins, 2);
            });
            it("on threshold not met", async () => {
                const tx = await instance.propose(ACTION_UPGRADE, sa.dummy4, "0x1234", {
                    from: sa.dummy1,
                });
                expectEvent(tx.receipt, "Proposed", {
                    admin: sa.dummy1,
                    action: ACTION_UPGRADE,
                    target: sa.dummy4,
                    data: "0x1234",
                });
                await expectRevert(
                    instance.accept({ from: sa.dummy1 }),
                    "VM Exception while processing transaction: revert threshold not met",
                );
            });
            it("on double propose", async () => {
                const tx = await instance.propose(ACTION_UPGRADE, sa.dummy4, "0x1234", {
                    from: sa.dummy1,
                });
                expectEvent(tx.receipt, "Proposed", {
                    admin: sa.dummy1,
                    action: ACTION_UPGRADE,
                    target: sa.dummy4,
                    data: "0x1234",
                });
                await expectRevert(
                    instance.propose(ACTION_UPGRADE, sa.dummy4, "0x1234", { from: sa.dummy1 }),
                    "VM Exception while processing transaction: revert proposal already exists",
                );
            });
            it("if not proposed", async () => {
                await expectRevert(
                    instance.accept({ from: sa.dummy1 }),
                    "VM Exception while processing transaction: revert proposal not found",
                );
            });
            it("if retracted", async () => {
                let tx = await instance.propose(ACTION_UPGRADE, sa.dummy4, "0x1234", {
                    from: sa.dummy1,
                });
                expectEvent(tx.receipt, "Proposed", {
                    admin: sa.dummy1,
                    action: ACTION_UPGRADE,
                    target: sa.dummy4,
                    data: "0x1234",
                });
                tx = await instance.propose(ACTION_UPGRADE, sa.dummy4, "0x1234", {
                    from: sa.dummy2,
                });
                expectEvent(tx.receipt, "Proposed", {
                    admin: sa.dummy2,
                    action: ACTION_UPGRADE,
                    target: sa.dummy4,
                    data: "0x1234",
                });
                tx = await instance.retract({ from: sa.dummy2 });
                expectEvent(tx.receipt, "Retracted", {
                    admin: sa.dummy2,
                    action: ACTION_UPGRADE,
                    target: sa.dummy4,
                    data: "0x1234",
                });
                await expectRevert(
                    instance.accept({ from: sa.dummy1 }),
                    "VM Exception while processing transaction: revert threshold not met",
                );
            });
        });
    });
});
