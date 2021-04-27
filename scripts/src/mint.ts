import HDWalletProvider from '@truffle/hdwallet-provider';

import { conditionalDeploy, conditionalInitialize, getDeployed } from "../../migrations/state";
import { MassetContract } from "../../types/generated";

export default async function mint(truffle): Promise<any> {
    const wallet: HDWalletProvider = truffle.provider;
    const artifacts: Truffle.Artifacts = truffle.artifacts;

    const c_masset = artifacts.require('Masset');
    const d_masset: any = await getDeployed(c_masset, 'Masset');

    const c_massetProxy = artifacts.require('MassetProxy');
    const d_massetProxy: any = await getDeployed(c_massetProxy, 'MassetProxy');

    const abi = d_masset.contract.methods.symbol().encodeABI();
    d_massetProxy.delegatecall

    console.log(await d_masset.symbol.call());






    return Promise.resolve();
}
