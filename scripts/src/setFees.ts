import HDWalletProvider from '@truffle/hdwallet-provider';

import { conditionalDeploy, conditionalInitialize, getDeployed } from "../../migrations/state";
import { MassetContract } from "../../types/generated";
import Truffle from 'truffle';

const deployerAddress = '0x0c8Fd9E5506e6d3b701705EeeD04505c227Fcded';
const governor = '0xaC8e05A82d31BB44701062049f92802c085BF89D';

export default async function setFees(truffle): Promise<any> {
    const wallet: HDWalletProvider = truffle.provider;
    const artifacts: Truffle.Artifacts = truffle.artifacts;

    await _setFees(wallet, artifacts);
}

async function _setFees(wallet: HDWalletProvider, artifacts: Truffle.Artifacts) {

    const c_masset = artifacts.require('Masset');
    const d_masset = await getDeployed(c_masset,'MassetProxy');

    let r = await d_masset.setSwapFee.sendTransaction(0, { from: governor });
    console.log(r);

    r = await d_masset.setRedemptionFee.sendTransaction(0, { from: governor });
    console.log(r);
}
