import { ZERO_ADDRESS } from "@utils/constants";
import {
    MassetV3Instance,
    FeesVaultInstance,
    ConstantsContract,
    RewardsVaultInstance,
    FeesVaultProxyInstance,
    RewardsVaultProxyInstance,
    DevelopmentConstantsContract
} from "types/generated";
import addresses, { BassetInstanceDetails } from '../addresses';
import { conditionalDeploy, conditionalInitialize, getDeployed, printState } from "../state";

const MAX_VALUE = 1000;

export default async (
    { artifacts }: { artifacts: Truffle.Artifacts },
    deployer, network, accounts): Promise<void> => {

    const Constants = artifacts.require("Constants");
    const DevelopmentConstants = artifacts.require("DevelopmentConstants");

    const BasketManagerV3 = artifacts.require("BasketManagerV3");
    const BasketManagerProxy = artifacts.require("BasketManagerProxy");

    const MassetV3 = artifacts.require("MassetV3");
    const MassetProxy = artifacts.require("MassetProxy");

    const FeesVault = artifacts.require("FeesVault");
    const FeesVaultProxy = artifacts.require("FeesVaultProxy");

    const FeesManager = artifacts.require("FeesManager");
    const FeesManagerProxy = artifacts.require("FeesManagerProxy");

    const RewardsVault = artifacts.require("RewardsVault");
    const RewardsVaultProxy = artifacts.require("RewardsVaultProxy");

    const RewardsManager = artifacts.require("RewardsManager");
    const RewardsManagerProxy = artifacts.require("RewardsManagerProxy");

    const [default_, _admin] = accounts;
    const addressesForNetwork = addresses[deployer.network];

    // link Constants library to contracts
    let constantsContract: ConstantsContract | DevelopmentConstantsContract;

    if (network === 'development') {
        DevelopmentConstants.contractName = "Constants";
        constantsContract = DevelopmentConstants;
    } else {
        constantsContract = Constants;
    }

    await conditionalDeploy(constantsContract, "Constants", () => deployer.deploy(constantsContract));
    await deployer.link(constantsContract, [constantsContract, BasketManagerV3, FeesManager]);

    const feesVault: FeesVaultInstance = await conditionalDeploy(FeesVault, "FeesVault",
        () => deployer.deploy(FeesVault));

    const feesVaultProxy: FeesVaultProxyInstance = await conditionalDeploy(FeesVaultProxy, "FeesVaultProxy",
        () => deployer.deploy(FeesVaultProxy));

    await conditionalInitialize("FeesVaultProxy",
        async () => feesVaultProxy.methods["initialize(address,address,bytes)"](feesVault.address, _admin, "0x")
    );
    const vaultFake = await FeesVault.at(feesVaultProxy.address);

    const rewardsVault: RewardsVaultInstance = await conditionalDeploy(RewardsVault, "RewardsVault",
        () => deployer.deploy(RewardsVault));

    const rewardsVaultProxy: RewardsVaultProxyInstance = await conditionalDeploy(RewardsVaultProxy, "RewardsVaultProxy",
        () => deployer.deploy(RewardsVaultProxy));

    const initFunc = rewardsVault.contract.methods.initialize().encodeABI();
    await conditionalInitialize("RewardsVaultProxy",
        async () => rewardsVaultProxy.methods["initialize(address,address,bytes)"](rewardsVault.address, _admin, initFunc)
    );
    const rewardsVaultFake = await RewardsVault.at(rewardsVaultProxy.address);

    async function upgradeInstance(
        symbol: string,
        addressesForInstance: BassetInstanceDetails,
        depositFee: number | BN,
        depositBridgeFee: number | BN,
        withdrawFee: number | BN,
        withdrawBridgeFee: number | BN
    ): Promise<void> {
        const massetFake: MassetV3Instance = await getDeployed(MassetV3, `${symbol}_MassetProxy`);
        const massetVersion = await massetFake.getVersion();
        console.log(symbol, ' Masset version: ', massetVersion);
        if (massetVersion >= '3.0') {
            console.log('Skipping...');
            return;
        }

        const tokenAddress = await massetFake.getToken();

        const basketManager = await conditionalDeploy(BasketManagerV3, `${symbol}_BasketManagerV3`,
            () => deployer.deploy(BasketManagerV3));

        const basketManagerProxy = await conditionalDeploy(BasketManagerProxy, `${symbol}_BasketManagerProxy`,
            () => deployer.deploy(BasketManagerProxy));

        const initAbi = basketManager.contract.methods['initialize(address)'](massetFake.address).encodeABI();
        await conditionalInitialize(`${symbol}_BasketManagerProxy`,
            async () => basketManagerProxy.initialize(basketManager.address, _admin, initAbi));

        const basketManagerFake = await BasketManagerV3.at(basketManagerProxy.address);

        if (network === 'development') {
            const ERC20 = artifacts.require("ERC20");
            addressesForInstance.bassets = [(await ERC20.new()).address, (await ERC20.new()).address, (await ERC20.new()).address];
            addressesForInstance.factors = [1, 1, 1];
            addressesForInstance.bridges = [ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS];
            addressesForInstance.ratios = [300, 300, 400];
        }

        let promises: Array<Promise<any>> = [];
        if (await basketManagerProxy.admin() === _admin) {
            const existingAssets = await basketManagerFake.getBassets();
            const addAsset = (index) => {
                console.log('adding asset: ',
                    addressesForInstance.bassets[index],
                    addressesForInstance.factors[index],
                    addressesForInstance.bridges[index]);
                promises.push(
                    basketManagerFake.addBasset(
                        addressesForInstance.bassets[index],
                        addressesForInstance.factors[index],
                        addressesForInstance.bridges[index],
                        0,
                        MAX_VALUE,
                        addressesForInstance.ratios[index],
                        false
                    )
                );
            };

            for (let i = 0; i < addressesForInstance.bassets.length; i++) {
                if (!existingAssets.find(ta => ta === addressesForInstance.bassets[i])) {
                    addAsset(i);
                }
            }

            await Promise.all(promises);

            if (network !== 'development') {
                if (await basketManagerFake.owner() === default_) {
                    await basketManagerFake.transferOwnership(addressesForInstance.multisig);
                }
                await basketManagerProxy.changeAdmin(addressesForInstance.multisig, { from: _admin });
            }
        }

        const rewardsManager = await conditionalDeploy(RewardsManager, `${symbol}_RewardsManager`,
            () => deployer.deploy(RewardsManager));

        const rewardsManagerProxy = await conditionalDeploy(RewardsManagerProxy, `${symbol}_RewardsManagerProxy`,
            () => deployer.deploy(RewardsManagerProxy));

        await conditionalInitialize(`${symbol}_RewardsManagerProxy`,
            async () => rewardsManagerProxy.initialize(rewardsManager.address, _admin, "0x")
        );
        const rewardsManagerFake = await RewardsManager.at(rewardsManagerProxy.address);

        const feesManager = await conditionalDeploy(FeesManager, `${symbol}_FeesManager`,
            () => deployer.deploy(FeesManager));

        const feesManagerProxy = await conditionalDeploy(FeesManagerProxy, `${symbol}_FeesManagerProxy`,
            () => deployer.deploy(FeesManagerProxy));

        await conditionalInitialize(`${symbol}_FeesManagerProxy`,
            async () => feesManagerProxy.initialize(feesManager.address, _admin, "0x")
        );
        const feesManagerFake = await FeesManager.at(feesManagerProxy.address);

        const masset = await conditionalDeploy(MassetV3, `${symbol}_MassetV3`,
            () => deployer.deploy(MassetV3));

        const massetProxy = await MassetProxy.at(massetFake.address);

        await rewardsVaultFake.addApprover(massetFake.address);

        await massetProxy.upgradeTo(masset.address, { from: _admin });
        await massetFake.upgradeToV3(
            basketManagerFake.address,
            tokenAddress,
            vaultFake.address,
            depositFee,
            depositBridgeFee,
            withdrawFee,
            withdrawBridgeFee,
            rewardsManagerFake.address,
            rewardsVaultFake.address,
            feesManagerFake.address
        );
    }

    await upgradeInstance('ETHs', addressesForNetwork.ETHs, 0, 0, 0, 0);
    await upgradeInstance('XUSD', addressesForNetwork.XUSD, 0, 0, 0, 0);
    await upgradeInstance('BNBs', addressesForNetwork.BNBs, 0, 0, 0, 0);

    printState();
};
