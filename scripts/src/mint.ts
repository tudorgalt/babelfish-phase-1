import HDWalletProvider from '@truffle/hdwallet-provider';

import { conditionalDeploy, conditionalInitialize, getDeployed } from "../../migrations/state";
import { MassetContract } from "../../types/generated";
import Truffle from 'truffle';

const deployerAddress = '0xe486c81D296A91740A58fCdE157c52f4b808dD73';

export default async function mint(truffle): Promise<any> {
    const wallet: HDWalletProvider = truffle.provider;
    const artifacts: Truffle.Artifacts = truffle.artifacts;

    await approve(wallet, artifacts);
    await _mint(wallet, artifacts);
}

async function approve(wallet: HDWalletProvider, artifacts: Truffle.Artifacts) {
    const c_mock1 = artifacts.require('MockERC20');
    const d_mock1 = await getDeployed(c_mock1, 'Mock1');

    const c_masset = artifacts.require('Masset');
    const d_masset = await getDeployed(c_masset,'MassetProxy');

    const r = await d_mock1.approve.sendTransaction(d_masset.address, 3000000000000000);
    console.log(r);
}

async function _mint(wallet: HDWalletProvider, artifacts: Truffle.Artifacts) {
    const c_masset = artifacts.require('Masset');
    const d_masset = await getDeployed(c_masset,'MassetProxy');

    const c_mock1 = artifacts.require('MockERC20');
    const d_mock1 = await getDeployed(c_mock1, 'Mock1');

    const r = await d_masset.mintTo.sendTransaction(d_mock1.address, 3000000000000000, deployerAddress);
    console.log(r);
}

