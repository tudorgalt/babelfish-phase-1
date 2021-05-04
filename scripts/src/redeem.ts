import HDWalletProvider from '@truffle/hdwallet-provider';

import { conditionalDeploy, conditionalInitialize, getDeployed } from "../../migrations/state";
import { MassetContract } from "../../types/generated";
import Truffle from 'truffle';

const deployerAddress = '0x0c8Fd9E5506e6d3b701705EeeD04505c227Fcded';

export default async function redeem(truffle): Promise<any> {
    const wallet: HDWalletProvider = truffle.provider;
    const artifacts: Truffle.Artifacts = truffle.artifacts;

    await _redeem(wallet, artifacts);
}

async function _redeem(wallet: HDWalletProvider, artifacts: Truffle.Artifacts) {
    const c_masset = artifacts.require('Masset');
    const d_masset = await getDeployed(c_masset,'MassetProxy');

    const c_mock1 = artifacts.require('MockERC20');
    const d_mock1 = await getDeployed(c_mock1, 'Mock1');

    const r = await d_masset.redeemTo.sendTransaction(d_mock1.address, 20000000000000, deployerAddress);
    console.log(r);
}
