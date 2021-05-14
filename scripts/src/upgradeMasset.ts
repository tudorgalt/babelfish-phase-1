import HDWalletProvider from '@truffle/hdwallet-provider';

import Truffle from 'truffle';

const massetProxyAddress = '0x04D92DaA8f3Ef7bD222195e8D1DbE8D89A8CebD3';
const thresholdProxyAdminAddress = '0x20bdB7607092C88b52f6E6ceCD6Dc6F226bAb570';

const admin1 = '0x94e907f6B903A393E14FE549113137CA6483b5ef';
const admin2 = '0x78514Eedd8678b8055Ca19b55c2711a6AACc09F8';
const admin3 = '0xfa82e8Bb8517BE31f64fe517E1E63B87183414Ad';

export default async function mint(truffle): Promise<any> {
    const wallet: HDWalletProvider = truffle.provider;
    const artifacts: Truffle.Artifacts = truffle.artifacts;

    const Masset = artifacts.require("Masset");

    const newMasset = await Masset.at('0xfbe9bCe0C81213E123a8E59D67828e0144948Fe8');
    const massetProxy = await Masset.at(massetProxyAddress);

    const ThresholdProxyAdmin = artifacts.require("ThresholdProxyAdmin");
    const thresholdProxyAdmin = await ThresholdProxyAdmin.at('0x20bdB7607092C88b52f6E6ceCD6Dc6F226bAb570');

    // await thresholdProxyAdmin.propose(1, newMasset.address, '0x', { from: admin1 });
    await thresholdProxyAdmin.propose(1, newMasset.address, '0x', { from: admin2 });
    await thresholdProxyAdmin.accept({ from: admin1 });

    await massetProxy.registerAsERC777Recipient();
}
