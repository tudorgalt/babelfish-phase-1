import HDWalletProvider from '@truffle/hdwallet-provider';
import Truffle from 'truffle';
import { getDeployed, setNetwork } from "../../migrations/state";

export default async function getVersions(truffle, networkName): Promise<any> {

    setNetwork(networkName);

    const wallet: HDWalletProvider = truffle.provider;
    const artifacts: Truffle.Artifacts = truffle.artifacts;

    const Masset = artifacts.require("Masset");

    const BasketManager = artifacts.require("BasketManager");

    async function _getVersions(symbol) {
        const masset = await getDeployed(Masset, `${symbol}_MassetProxy`);
        console.log(symbol, ' Masset version: ', await masset.getVersion());

        const basketManager = await getDeployed(BasketManager, `${symbol}_BasketManager`);
        console.log(symbol, ' BasketManager version: ', await basketManager.getVersion());
    }

    await _getVersions('XUSD');
    await _getVersions('ETHs');
    await _getVersions('BNBs');
}
