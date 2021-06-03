import HDWalletProvider from '@truffle/hdwallet-provider';
import Truffle from 'truffle';

const massetProxyAddress = '0x04D92DaA8f3Ef7bD222195e8D1DbE8D89A8CebD3';
const thresholdProxyAdminAddress = '0x1300F936e46bd4d318feE9fF45AF8d5DFE7220d5';

const admin1 = '0x94e907f6B903A393E14FE549113137CA6483b5ef';
const admin2 = '0x78514Eedd8678b8055Ca19b55c2711a6AACc09F8';
const admin3 = '0xfa82e8Bb8517BE31f64fe517E1E63B87183414Ad';

export default async function mint(truffle): Promise<any> {
    const wallet: HDWalletProvider = truffle.provider;
    const artifacts: Truffle.Artifacts = truffle.artifacts;

    const Masset = artifacts.require("Masset");
    const MassetProxy = artifacts.require("MassetProxy");
    const ThresholdProxyAdmin = artifacts.require("ThresholdProxyAdmin");

    //const abi = masset.contract.methods['migrateFromV1ToV2()'].encodeABI();
    //console.log('abi: ', abi);

    console.log(1);

    //const masset = await Masset.new();
    const masset = await Masset.at('0xA7e1104c16f9Acd0d5DFf832562E0A466b85ee17');
    console.log("new masset: ", masset.address);

    const fake = await Masset.at(massetProxyAddress);

    //console.log('current version: ', await fake.getVersion());

    console.log(2);

    const thresholdProxyAdmin = await ThresholdProxyAdmin.at(thresholdProxyAdminAddress);
/*
    console.log(3);

    try {
        await thresholdProxyAdmin.retract({ from: admin1 });
    } catch (ex) {
        console.log(ex);
    }

    console.log(4);

    try {
        await thresholdProxyAdmin.propose(1, masset.address, '0x', { from: admin1 });
    } catch (ex) {
        console.log(ex);
    }

    console.log(5);

    try {
        await thresholdProxyAdmin.retract({ from: admin2 });
    } catch (ex) {
        console.log(ex);
    }

    console.log(6);

    try {
        await thresholdProxyAdmin.propose(1, masset.address, '0x', { from: admin2 });
    } catch (ex) {
        console.log(ex);
    }

    console.log(7);

 */
    await thresholdProxyAdmin.accept({ from: admin1 });

    console.log('current version: ', await fake.getVersion());

    await fake.migrateFromV1ToV2();
}
