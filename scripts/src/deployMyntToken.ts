import HDWalletProvider from '@truffle/hdwallet-provider';
import Truffle from 'truffle';
import { conditionalDeploy, setNetwork } from "../../migrations/state";

export default async function deployMyntToken(truffle, networkName: string): Promise<void> {

    setNetwork(networkName);

    const wallet: HDWalletProvider = truffle.provider;
    const artifacts: Truffle.Artifacts = truffle.artifacts;

    console.log('Deploying MYNT token...');

    const MyntToken = artifacts.require("MyntToken");
    const myntToken = await conditionalDeploy(MyntToken, `MyntToken`,
        () => MyntToken.new());

    console.log('Deployed at', myntToken.address);

    const amm = '';
    const presale = '';
    const multisig = '';

    console.log('Setting market maker address to', amm);

    await myntToken.setMarketMaker(amm);

    console.log('Setting presale address to', presale);

    await myntToken.setPresale(presale);

    console.log('Setting owner address to', multisig);

    await myntToken.transferOwnership(multisig);

    console.log('Done.');
}
