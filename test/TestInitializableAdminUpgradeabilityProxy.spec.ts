/* eslint-disable @typescript-eslint/no-use-before-define */
import { expectRevert, expectEvent } from "@openzeppelin/test-helpers";
import envSetup from "@utils/env_setup";
import { ZERO_ADDRESS } from "@utils/constants";
import { StandardAccounts } from "@utils/standardAccounts";
import { IMockImplementationInstance, InitializableAdminUpgradeabilityProxyInstance, MockProxyImplementation1Instance, MockProxyImplementation2Instance } from "types/generated";

const MockProxyImplementation1 = artifacts.require("MockProxyImplementation1");
const MockProxyImplementation2 = artifacts.require("MockProxyImplementation2");
const InitializableAdminUpgradeabilityProxy = artifacts.require("InitializableAdminUpgradeabilityProxy");

const { expect } = envSetup.configure();

contract("InitializableAdminUpgradeabilityProxy", async (accounts) => {
    const sa = new StandardAccounts(accounts);

    describe("changeAdmin", async () => {
        let proxyImplementation: MockProxyImplementation1Instance;
        let adminUpgradeabilityProxy: InitializableAdminUpgradeabilityProxyInstance;
        let admin: string;

        beforeEach("before", async () => {
            proxyImplementation = await MockProxyImplementation1.new();
            adminUpgradeabilityProxy = await InitializableAdminUpgradeabilityProxy.new({ from: sa.default });

            admin = sa.default;
            await initProxy(admin, proxyImplementation, adminUpgradeabilityProxy);
        });

        context("should fail", async () => {
            it("when caller is not admin", async () => {
                await expectRevert(
                    adminUpgradeabilityProxy.changeAdmin(sa.governor, { from: sa.dummy1 }),
                    "Transaction reverted: function selector was not recognized and there's no fallback function"
                );
            });

            it("when admin is not valid", async () => {
                await expectRevert(
                    adminUpgradeabilityProxy.changeAdmin(ZERO_ADDRESS, { from: admin }),
                    "VM Exception while processing transaction: reverted with reason string 'Cannot change the admin of a proxy to the zero address'"
                );
            });
        });

        context("should succeed", async () => {
            it("when all params are valid", async () => {
                const newAdmin = sa.governor;
                const tx = await adminUpgradeabilityProxy.changeAdmin(newAdmin, { from: admin });

                await expectEvent(tx.receipt, "AdminChanged", {
                    previousAdmin: admin,
                    newAdmin
                });

                const setAdmin = await adminUpgradeabilityProxy.admin();
                expect(setAdmin).to.eq(newAdmin);
            });
        });
    });

    describe("integration", async () => {
        let proxyImplementation: MockProxyImplementation1Instance;
        let proxyImplementation2: MockProxyImplementation2Instance;
        let adminUpgradeabilityProxy: InitializableAdminUpgradeabilityProxyInstance;

        beforeEach("before", async () => {
            proxyImplementation = await MockProxyImplementation1.new();
            proxyImplementation2 = await MockProxyImplementation2.new();
            adminUpgradeabilityProxy = await InitializableAdminUpgradeabilityProxy.new({ from: sa.default });
        });

        it("full flow test", async () => {
            let currImplementationVersion: string;
            const initdata: string = proxyImplementation.contract.methods.initialize().encodeABI();

            await adminUpgradeabilityProxy.methods["initialize(address,address,bytes)"](
                proxyImplementation.address,
                sa.governor,
                initdata,
            );

            const admin = await adminUpgradeabilityProxy.admin();
            expect(admin).to.eq(sa.governor, "proper admin should be set");

            const implementationThroughProxy = await MockProxyImplementation1.at(adminUpgradeabilityProxy.address);

            const isImplementationInitalized = await implementationThroughProxy.isInitialized();
            expect(isImplementationInitalized).to.eq(true, "init function should be called");

            currImplementationVersion = await implementationThroughProxy.getVersion();
            expect(currImplementationVersion).to.eq("1");

            await adminUpgradeabilityProxy.changeAdmin(sa.default, { from: sa.governor });
            const newAdmin = await adminUpgradeabilityProxy.admin();
            expect(newAdmin).to.eq(sa.default, "admin should be changed");

            const initdata2: string = proxyImplementation2.contract.methods.initialize().encodeABI();
            await adminUpgradeabilityProxy.upgradeToAndCall(proxyImplementation2.address, initdata2, { from: sa.default });

            currImplementationVersion = await implementationThroughProxy.getVersion();
            expect(currImplementationVersion).to.eq("2", "should point to second implementation after upgrade");
        });
    });
});

const initProxy = async (
    admin: string,
    implementation: IMockImplementationInstance,
    proxy: InitializableAdminUpgradeabilityProxyInstance
): Promise<MockProxyImplementation1Instance> => {
    const initdata: string = implementation.contract.methods.initialize().encodeABI();

    await proxy.methods["initialize(address,address,bytes)"](
        implementation.address,
        admin,
        initdata,
    );

    const implementationThroughProxy = await MockProxyImplementation1.at(proxy.address);

    return implementationThroughProxy;
};
