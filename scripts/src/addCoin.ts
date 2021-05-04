import HDWalletProvider from '@truffle/hdwallet-provider';

import { conditionalDeploy, conditionalInitialize, getDeployed } from "../../migrations/state";
import { MassetContract } from "../../types/generated";
import Truffle from 'truffle';

const deployerAddress = '0x0c8Fd9E5506e6d3b701705EeeD04505c227Fcded';
const governor = '0xaC8e05A82d31BB44701062049f92802c085BF89D';

export default async function addCoin(truffle): Promise<any> {
    const wallet: HDWalletProvider = truffle.provider;
    const artifacts: Truffle.Artifacts = truffle.artifacts;

    await _addCoin(wallet, artifacts);
}

async function _addCoin(wallet: HDWalletProvider, artifacts: Truffle.Artifacts) {

    const c_aaveIntegration = artifacts.require("AaveV2Integration");
    const d_aaveIntegration = await getDeployed(c_aaveIntegration,'AaveIntegrationProxy');

    const c_MockERC20 = artifacts.require("MockERC20");
    const mockBasset8 = await c_MockERC20.new("Mock8", "MK8", 18, deployerAddress, 100000000);

    const c_MockAToken = artifacts.require("MockATokenV2");
    const mockAToken8 = await c_MockAToken.new(d_aaveIntegration.address, mockBasset8.address);

    const platform = await d_aaveIntegration.platformAddress();
    const c_MockAave = artifacts.require("MockAaveV2");
    const d_aave = await c_MockAave.at(platform);

    let r = await d_aave.addAToken.sendTransaction(mockAToken8.address, mockBasset8.address,  { from: governor });
    console.log(r);

    const c_basketManager = artifacts.require('BasketManager');
    const d_basketManager = await getDeployed(c_basketManager,'BasketManagerProxy');

    r = await d_basketManager.addBasset(mockBasset8.address, d_aaveIntegration.address, false,  { from: governor });
    console.log(r);

    await approve(artifacts, mockBasset8);
    await mint(artifacts, mockBasset8);
}

async function approve(artifacts: Truffle.Artifacts, d_mock1) {

    const c_masset = artifacts.require('Masset');
    const d_masset = await getDeployed(c_masset,'MassetProxy');

    const r = await d_mock1.approve.sendTransaction(d_masset.address, 3000000000000000);
    console.log(r);
}

async function mint(artifacts: Truffle.Artifacts, d_mock1) {
    const c_masset = artifacts.require('Masset');
    const d_masset = await getDeployed(c_masset,'MassetProxy');

    const r = await d_masset.mintTo.sendTransaction(d_mock1.address, 3000000000000000, deployerAddress);
    console.log(r);
}
