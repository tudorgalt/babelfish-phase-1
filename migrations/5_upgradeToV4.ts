import Logs from "node-logs";
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import {
    MassetV4Instance,
    BasketManagerV4Instance
} from "types/generated";
import {
    printState,
    getDeployed,
    conditionalDeploy,
    conditionalInitialize,
} from "./utils/state";
import addresses, { BassetInstanceDetails, isDevelopmentNetwork } from './utils/addresses';
import { DeploymentTags } from "./utils/DeploymentTags";

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

const logger = new Logs().showInConsole(true);

const deployFunc = async ({ network, deployments, getUnnamedAccounts }: HardhatRuntimeEnvironment) => {
    logger.info("Starting upgrade to v4 migration");

    const { deploy } = deployments;
    const [default_, _admin] = await getUnnamedAccounts();
    const addressesForNetwork = addresses[network.name];

    const rewardsVault = await conditionalDeploy({
        contract: RewardsVault,
        key: "RewardsVault",
        deployfunc: deploy,
        deployOptions: { from: default_ }
    });
    const rewardsVaultProxy = await conditionalDeploy({
        contract: RewardsVaultProxy,
        key: "RewardsVaultProxy",
        deployfunc: deploy,
        deployOptions: { from: default_ }
    });

    const initFunc = rewardsVault.contract.methods.initialize().encodeABI();
    await conditionalInitialize("RewardsVaultProxy",
        async () => { await rewardsVaultProxy.methods["initialize(address,address,bytes)"](rewardsVault.address, _admin, initFunc); }
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

        if (isDevelopmentNetwork(network.name)) {
            addressesForInstance.ratios = [300, 300, 400];
        }

        const rewardsManager = await conditionalDeploy({
            contract: RewardsManager,
            key: `${symbol}_RewardsManager`,
            deployfunc: deploy,
            deployOptions: { from: default_ }
        });
        const rewardsManagerProxy = await conditionalDeploy({
            contract: RewardsManagerProxy,
            key: `${symbol}_RewardsManagerProxy`,
            deployfunc: deploy,
            deployOptions: { from: default_ }
        });

        await conditionalInitialize(`${symbol}_RewardsManagerProxy`,
            async () => { await rewardsManagerProxy.methods["initialize(address,address,bytes)"](rewardsManager.address, _admin, "0x"); }
        );
        const rewardsManagerFake = await RewardsManager.at(rewardsManagerProxy.address);

        const feesManager = await conditionalDeploy({
            contract: FeesManager,
            key: `${symbol}_FeesManager`,
            deployfunc: deploy,
            deployOptions: { from: default_ }
        });
        const feesManagerProxy = await conditionalDeploy({
            contract: FeesManagerProxy,
            key: `${symbol}_FeesManagerProxy`,
            deployfunc: deploy,
            deployOptions: { from: default_ }
        });

        await conditionalInitialize(`${symbol}_FeesManagerProxy`,
            async () => { await feesManagerProxy.methods["initialize(address,address,bytes)"](feesManager.address, _admin, "0x"); }
        );
        const feesManagerFake = await FeesManager.at(feesManagerProxy.address);

        const massetV4 = await conditionalDeploy({
            contract: MassetV4,
            key: `${symbol}_MassetV4`,
            deployfunc: deploy,
            deployOptions: { from: default_ }
        });

        const massetProxy = await MassetProxy.at(massetFake.address);

        await rewardsVaultFake.addApprover(massetFake.address);

        await massetProxy.upgradeTo(massetV4.address, { from: _admin });

        await massetFake.initialize(
            rewardsManagerFake.address,
            rewardsVaultFake.address,
            feesManagerFake.address
        );

        const basketManagerV4 = await conditionalDeploy({
            contract: BasketManagerV4,
            key: `${symbol}_BasketManagerV4`,
            deployfunc: deploy,
            deployOptions: { from: default_ }
        });

        const basketManagerFake: BasketManagerV4Instance = await getDeployed(BasketManagerV4, `${symbol}_BasketManagerProxy`);
        const basketManagerProxy = await BasketManagerProxy.at(basketManagerFake.address);

        await basketManagerProxy.upgradeTo(basketManagerV4.address, { from: _admin });
        await basketManagerFake.initialize(addressesForInstance.ratios);
    }

    await upgradeInstance('ETHs', addressesForNetwork.ETHs);
    await upgradeInstance('XUSD', addressesForNetwork.XUSD);
    await upgradeInstance('BNBs', addressesForNetwork.BNBs);

    logger.success("Migration completed");
    printState();
};

deployFunc.tags = [
    DeploymentTags.V4,
    DeploymentTags.Migration
];

export default deployFunc;
