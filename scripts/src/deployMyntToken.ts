import HDWalletProvider from '@truffle/hdwallet-provider';
import Truffle from 'truffle';
import { conditionalDeploy, setNetwork } from "../../migrations/state";

export default async function deployMyntToken(truffle, networkName: string): Promise<void> {

    setNetwork(networkName);

    const wallet: HDWalletProvider = truffle.provider;
    const artifacts: Truffle.Artifacts = truffle.artifacts;

    const MyntToken = artifacts.require("MyntToken");
    const myntToken = await conditionalDeploy(MyntToken, `MyntToken`,
        () => MyntToken.new());
}
