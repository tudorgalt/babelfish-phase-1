import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import addresses, { BassetInstanceDetails, isDevelopmentNetwork } from './utils/addresses';

import { conditionalDeploy, conditionalInitialize, printState } from "./utils/state";

const cToken = artifacts.require("Token");
const cBasketManager = artifacts.require("BasketManager");
const cMasset = artifacts.require("Masset");
const cMassetProxy = artifacts.require("MassetProxy");


const deployFunc: DeployFunction = async ({ network, deployments, getUnnamedAccounts }: HardhatRuntimeEnvironment) => {
    const [default_, _admin] = await getUnnamedAccounts();
    const { deploy } = deployments;

    const addressesForNetwork = addresses[network.name];

    async function deployInstance(symbol: string, addressesForInstance: BassetInstanceDetails) {
        const dToken = await conditionalDeploy(cToken, `${symbol}_Token`, {
            from: default_,
            args: [symbol, symbol, 18]
        }, deploy);

        const dMasset = await conditionalDeploy(cMasset, `${symbol}_Masset`, {
            from: default_
        }, deploy);

        const dMassetProxy = await conditionalDeploy(cMassetProxy, `${symbol}_MassetProxy`, {
            from: default_
        }, deploy);

        if (await dToken.owner() !== dMassetProxy.address) {
            await dToken.transferOwnership(dMassetProxy.address);
        }
        if (isDevelopmentNetwork(network.name)) {
            const { address: mockTokenAddress } = await deploy("Token", {
                from: default_,
                args: ['MOCK', 'MOCK', 18]
            });

            await cToken.at(mockTokenAddress);
            addressesForInstance.bassets = [mockTokenAddress];
            addressesForInstance.factors = [1];
            addressesForInstance.bridges = ['0x0000000000000000000000000000000000000000'];
        }

        const dBasketManager = await conditionalDeploy(cBasketManager, `${symbol}_BasketManager`, {
            from: default_,
            args: [addressesForInstance.bassets, addressesForInstance.factors, addressesForInstance.bridges]
        }, deploy);

        const initdata: string = dMasset.contract.methods
            .initialize(
                dBasketManager.address,
                dToken.address,
                !isDevelopmentNetwork(network.name)
            ).encodeABI();

        await conditionalInitialize(`${symbol}_MassetProxy`, async () => {
            await dMassetProxy.methods["initialize(address,address,bytes)"](
                dMasset.address,
                addressesForInstance.multisig || _admin,
                initdata,
            );
        });

    }

    await deployInstance('ETHs', addressesForNetwork.ETHs);
    await deployInstance('XUSD', addressesForNetwork.XUSD);
    await deployInstance('BNBs', addressesForNetwork.BNBs);

    printState();
};

deployFunc.tags = ["migration"];

export default deployFunc;
