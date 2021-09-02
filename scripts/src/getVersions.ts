import HDWalletProvider from '@truffle/hdwallet-provider';
import Truffle from 'truffle';
import { BasketManagerV3Instance, MassetV3Instance } from "types/generated";
import { getDeployed, setNetwork } from "../../migrations/state";

export default async function getVersions(truffle, networkName: string): Promise<void> {
    setNetwork(networkName);

    const wallet: HDWalletProvider = truffle.provider;
    const artifacts: Truffle.Artifacts = truffle.artifacts;

    const Masset = artifacts.require("Masset");

    const BasketManager = artifacts.require("BasketManager");

    async function _getVersions(symbol) {
        const masset: MassetV3Instance = await getDeployed(Masset, `${symbol}_MassetProxy`);
        console.log(symbol, ' Masset version: ', await masset.getVersion());

        const basketManager: BasketManagerV3Instance = await getDeployed(BasketManager, `${symbol}_BasketManager`);
        console.log(symbol, ' BasketManager version: ', await basketManager.getVersion());

        const basketManagerProxy: BasketManagerV3Instance = await getDeployed(BasketManager, `${symbol}_BasketManagerProxy`);
        console.log(symbol, ' BasketManager(proxy) version: ', await basketManagerProxy.getVersion());
    }

    await _getVersions('XUSD');
    await _getVersions('ETHs');
    await _getVersions('BNBs');
}
