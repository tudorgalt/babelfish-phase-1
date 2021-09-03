import Logs from "node-logs";
import {  RewardsVaultProxyInstance, RewardsVaultInstance, MassetV4Instance, BasketManagerV4Instance } from "types/generated";
import addresses, { BassetInstanceDetails } from '../addresses';
import { conditionalDeploy, conditionalInitialize, getDeployed, printState } from "../state";

const logger = new Logs().showInConsole(true);

export default async (
    { artifacts }: { artifacts: Truffle.Artifacts },
    deployer, network, accounts): Promise<void> => {
    const [default_, _admin] = accounts;
    const addressesForNetwork = addresses[deployer.network];

    const BasketManagerV4 = artifacts.require("BasketManagerV4");
    const BasketManagerProxy = artifacts.require("BasketManagerProxy");

    const MassetV4 = artifacts.require("MassetV4");
    const MassetProxy = artifacts.require("MassetProxy");

    const FeesManager = artifacts.require("FeesManager");
    const FeesManagerProxy = artifacts.require("FeesManagerProxy");

    const RewardsVault = artifacts.require("RewardsVault");
    const RewardsVaultProxy = artifacts.require("RewardsVaultProxy");

    const RewardsManager = artifacts.require("RewardsManager");
    const RewardsManagerProxy = artifacts.require("RewardsManagerProxy");

    const rewardsVault: RewardsVaultInstance = await conditionalDeploy(RewardsVault, "RewardsVault",
        () => deployer.deploy(RewardsVault)
    );
    const rewardsVaultProxy: RewardsVaultProxyInstance = await conditionalDeploy(RewardsVaultProxy, "RewardsVaultProxy",
        () => deployer.deploy(RewardsVaultProxy)
    );

    const initFunc = rewardsVault.contract.methods.initialize().encodeABI();
    await conditionalInitialize("RewardsVaultProxy",
        async () => rewardsVaultProxy.methods["initialize(address,address,bytes)"](rewardsVault.address, _admin, initFunc)
    );
    const rewardsVaultFake = await RewardsVault.at(rewardsVaultProxy.address);

    async function upgradeInstance(symbol: string, addressesForInstance: BassetInstanceDetails): Promise<void> {
        const massetFake: MassetV4Instance = await getDeployed(MassetV4, `${symbol}_MassetProxy`);
        const massetVersion = await massetFake.getVersion();

        logger.info(`${symbol}, Masset version: ${massetVersion}`);
        if (massetVersion >= '4.0') {
            logger.warn('Skipping...');
            return;
        }

        if (network === 'development') {
            addressesForInstance.ratios = [300, 300, 400];
        }

        const rewardsManager = await conditionalDeploy(RewardsManager, `${symbol}_RewardsManager`,
            () => deployer.deploy(RewardsManager)
        );
        const rewardsManagerProxy = await conditionalDeploy(RewardsManagerProxy, `${symbol}_RewardsManagerProxy`,
            () => deployer.deploy(RewardsManagerProxy)
        );

        await conditionalInitialize(`${symbol}_RewardsManagerProxy`,
            async () => rewardsManagerProxy.initialize(rewardsManager.address, _admin, "0x")
        );
        const rewardsManagerFake = await RewardsManager.at(rewardsManagerProxy.address);

        const feesManager = await conditionalDeploy(FeesManager, `${symbol}_FeesManager`,
            () => deployer.deploy(FeesManager)
        );
        const feesManagerProxy = await conditionalDeploy(FeesManagerProxy, `${symbol}_FeesManagerProxy`,
            () => deployer.deploy(FeesManagerProxy)
        );

        await conditionalInitialize(`${symbol}_FeesManagerProxy`,
            async () => feesManagerProxy.initialize(feesManager.address, _admin, "0x")
        );
        const feesManagerFake = await FeesManager.at(feesManagerProxy.address);

        const masset = await conditionalDeploy(MassetV4, `${symbol}_MassetV4`,
            () => deployer.deploy(MassetV4)
        );

        const massetProxy = await MassetProxy.at(massetFake.address);

        await rewardsVaultFake.addApprover(massetFake.address);

        await massetProxy.upgradeTo(masset.address, { from: _admin });

        await massetFake.initialize(
            rewardsManagerFake.address,
            rewardsVaultFake.address,
            feesManagerFake.address
        );

        const basketManager: BasketManagerV4Instance = await conditionalDeploy(BasketManagerV4, `${symbol}_BasketManagerV4`,
            () => deployer.deploy(BasketManagerV4)
        );

        const basketManagerFake: BasketManagerV4Instance = await getDeployed(BasketManagerV4, `${symbol}_BasketManagerProxy`);
        const basketManagerProxy = await BasketManagerProxy.at(basketManagerFake.address);

        await basketManagerProxy.upgradeTo(basketManager.address, { from: _admin });
        await basketManagerFake.initialize(addressesForInstance.ratios);
    }

    await upgradeInstance('ETHs', addressesForNetwork.ETHs);
    await upgradeInstance('XUSD', addressesForNetwork.XUSD);
    await upgradeInstance('BNBs', addressesForNetwork.BNBs);

    printState();
};
