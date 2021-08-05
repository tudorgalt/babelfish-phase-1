import { ZERO_ADDRESS } from "@utils/constants";
import { tokens } from "@utils/tools";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { MassetV3Instance } from "types/generated";
import addresses, { BassetInstanceDetails, isDevelopmentNetwork } from './utils/addresses';
import { conditionalDeploy, conditionalInitialize, getDeployed, printState } from "./utils/state";

const ERC20Mintable = artifacts.require("ERC20Mintable");
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

const MAX_VALUE = 1000;

const deployFunc = async ({ network, deployments, getUnnamedAccounts }: HardhatRuntimeEnvironment) => {
    const { deploy } = deployments;
    const [default_, _admin] = await getUnnamedAccounts();

    const addressesForNetwork = addresses[network.name];

    const feesVault = await conditionalDeploy(FeesVault, "FeesVault", { from: default_ }, deploy);
    const feesVaultProxy = await conditionalDeploy(FeesVaultProxy, "FeesVaultProxy", { from: default_ }, deploy);

    await conditionalInitialize("FeesVaultProxy",
        async () => { await feesVaultProxy.methods["initialize(address,address,bytes)"](feesVault.address, _admin, "0x"); }
    );
    const vaultFake = await FeesVault.at(feesVaultProxy.address);

    const rewardsVault = await conditionalDeploy(RewardsVault, "RewardsVault", { from: default_ }, deploy);
    const rewardsVaultProxy = await conditionalDeploy(RewardsVaultProxy, "RewardsVaultProxy", { from: default_ }, deploy);

    const initFunc = rewardsVault.contract.methods.initialize().encodeABI();
    await conditionalInitialize("RewardsVaultProxy",
        async () => { rewardsVaultProxy.methods["initialize(address,address,bytes)"](rewardsVault.address, _admin, initFunc); }
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

        const basketManager = await conditionalDeploy(BasketManagerV3, `${symbol}_BasketManagerV3`, { from: default_ }, deploy);
        const basketManagerProxy = await conditionalDeploy(BasketManagerProxy, `${symbol}_BasketManagerProxy`, { from: default_ }, deploy);

        const initAbi = basketManager.contract.methods['initialize(address)'](massetFake.address).encodeABI();
        await conditionalInitialize(`${symbol}_BasketManagerProxy`,
            async () => { await basketManagerProxy.methods["initialize(address,address,bytes)"](basketManager.address, _admin, initAbi); }
        );

        const basketManagerFake = await BasketManagerV3.at(basketManagerProxy.address);

        if (isDevelopmentNetwork(network.name)) {
            const basset1 = await ERC20Mintable.new();
            const basset2 = await ERC20Mintable.new();
            const basset3 = await ERC20Mintable.new();

            // set basket balances with perfect ratio
            await basset1.mint(massetFake.address, tokens(30));
            await basset1.mint(massetFake.address, tokens(40));
            await basset1.mint(massetFake.address, tokens(40));

            // mint some tokens for owner
            await basset1.mint(default_, tokens(1000));

            addressesForInstance.bassets = [basset1.address, basset2.address, basset3.address];
            addressesForInstance.factors = [1, 1, 1];
            addressesForInstance.bridges = [ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS];
            addressesForInstance.ratios = [300, 300, 400];
        }

        const promises: Array<Promise<Truffle.TransactionResponse<Truffle.AnyEvent>>> = [];

        if (await basketManagerProxy.admin() === _admin) {
            const existingAssets = await basketManagerFake.getBassets();
            const addAsset = (index: number) => {
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

            if(!isDevelopmentNetwork(network.name)) {
                if (await basketManagerFake.owner() === default_) {
                    await basketManagerFake.transferOwnership(addressesForInstance.multisig);
                }
                await basketManagerProxy.changeAdmin(addressesForInstance.multisig, { from: _admin });
            }
        }

        const rewardsManager = await conditionalDeploy(RewardsManager, `${symbol}_RewardsManager`, { from: default_ }, deploy);
        const rewardsManagerProxy = await conditionalDeploy(RewardsManagerProxy, `${symbol}_RewardsManagerProxy`, { from: default_ }, deploy);
        
        await conditionalInitialize(`${symbol}_RewardsManagerProxy`,
            async () => { rewardsManagerProxy.methods["initialize(address,address,bytes)"](rewardsManager.address, _admin, "0x"); }
        );

        const rewardsManagerFake = await RewardsManager.at(rewardsManagerProxy.address);

        const feesManager = await conditionalDeploy(FeesManager, `${symbol}_FeesManager`, { from: default_ }, deploy);
        const feesManagerProxy = await conditionalDeploy(FeesManagerProxy, `${symbol}_FeesManagerProxy`, { from: default_ }, deploy);

        await conditionalInitialize(`${symbol}_FeesManagerProxy`,
            async () => { await feesManagerProxy.methods["initialize(address,address,bytes)"](feesManager.address, _admin, "0x"); }
        );

        const feesManagerFake = await FeesManager.at(feesManagerProxy.address);

        const masset = await conditionalDeploy(MassetV3, `${symbol}_MassetV3`, { from: default_ }, deploy);
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

deployFunc.tags = ["migration"];

export default deployFunc;
