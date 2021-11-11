import HDWalletProvider from '@truffle/hdwallet-provider';
import Truffle from 'truffle';
import Web3 from "web3";

const massetProxyAddress = '0x04D92DaA8f3Ef7bD222195e8D1DbE8D89A8CebD3';
// const thresholdProxyAdminAddress = '0x1300F936e46bd4d318feE9fF45AF8d5DFE7220d5';
const thresholdProxyAdminAddress = '0x20bdB7607092C88b52f6E6ceCD6Dc6F226bAb570';

const admin1 = '0x94e907f6B903A393E14FE549113137CA6483b5ef';
const admin2 = '0x78514Eedd8678b8055Ca19b55c2711a6AACc09F8';
const admin3 = '0xfa82e8Bb8517BE31f64fe517E1E63B87183414Ad';

export default async function mint(truffle): Promise<any> {
    const wallet: HDWalletProvider = truffle.provider;
    const artifacts: Truffle.Artifacts = truffle.artifacts;
    const web3: Web3 = truffle.web3;
    const address0 = web3.currentProvider['addresses'][0];
    console.log('0: ', address0);
    return;

    const Masset = artifacts.require("Masset");
    const MassetProxy = artifacts.require("MassetProxy");
    const ThresholdProxyAdmin = artifacts.require("ThresholdProxyAdmin");

    const fake = await Masset.at(massetProxyAddress);

    /*
    let abi = masset.contract.methods['migrateFromV1ToV2()'].encodeABI();
    console.log('abi for upgrade: ', abi);

    abi = masset.contract.methods['migrateFromV1ToV2()'].encodeABI();
    console.log('abi for migrate: ', abi);
*/
    console.log(1);

    const masset = await Masset.new();
    // const masset = await Masset.at('0x4AAEF06E9ED7FC42Cf86e5029ca742fd01f39F98');
    // const masset = await Masset.at('0x175A264f3808cFb2EFDa7D861a09b4EeBEF339EF'); // old on testnet
    console.log("new masset: ", masset.address);


    //console.log('current version: ', await fake.getVersion());

    console.log(2);

    const thresholdProxyAdmin = await ThresholdProxyAdmin.at(thresholdProxyAdminAddress);

    console.log(3);

    try {
        //await thresholdProxyAdmin.retract({ from: admin1 });
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
        //await thresholdProxyAdmin.retract({ from: admin2 });
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

    await thresholdProxyAdmin.accept({ from: admin1 });

    console.log('current version: ', await fake.getVersion());

    console.log(await fake.geBasketManager());
    console.log(await fake.getToken());

    await fake.migrateFromV1ToV2();

    console.log(await fake.geBasketManager());
    console.log(await fake.getToken());
}
