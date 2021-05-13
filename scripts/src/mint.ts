import HDWalletProvider from '@truffle/hdwallet-provider';

import Truffle from 'truffle';

const walletAddress = '0x94e907f6B903A393E14FE549113137CA6483b5ef';
const esethAddress = '0x4f2fc8d55c1888a5aca2503e2f3e5d74eef37c33';
const mock1Address = '0xe4578D40080893D82b9dDfC3C419c46D1BC2E10A';
const massetAddress = '0x90527Db0F9b828dF852820CBEAB84090dD5A9Cc6';

export default async function mint(truffle): Promise<any> {
    const wallet: HDWalletProvider = truffle.provider;
    const artifacts: Truffle.Artifacts = truffle.artifacts;

    await approve(wallet, artifacts);
    await _mint(wallet, artifacts);
}

async function approve(wallet: HDWalletProvider, artifacts: Truffle.Artifacts) {
    const c_mock1 = artifacts.require('MockERC20');
    const d_mock1 = await c_mock1.at(mock1Address);

    const c_masset = artifacts.require('Masset');
    const d_masset = await c_masset.at(massetAddress);

    const r = await d_mock1.approve.sendTransaction(d_masset.address, '100000000000000000');
    console.log(r);
}

async function _mint(wallet: HDWalletProvider, artifacts: Truffle.Artifacts) {
    const c_masset = artifacts.require('Masset');
    const d_masset = await c_masset.at(massetAddress);

    const r = await d_masset.mintTo.sendTransaction(mock1Address, '100000000000000000', walletAddress);
    console.log(r);
}

