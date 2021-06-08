import HDWalletProvider from '@truffle/hdwallet-provider';
import Truffle from 'truffle';

const massetProxyAddress = '0x4BF113905d7F69202106F613308bb02C84AaDF2F';

export default async function mint(truffle, ...args): Promise<any> {
    const wallet: HDWalletProvider = truffle.provider;
    const artifacts: Truffle.Artifacts = truffle.artifacts;

    console.log('deployer: ', truffle.web3.currentProvider.addresses[0]);

    const Masset = artifacts.require("Masset");
    const MassetProxy = artifacts.require("MassetProxy");

    const massetProxy = await MassetProxy.at(massetProxyAddress);
    const fake = await Masset.at(massetProxyAddress);

    console.log(1);

    console.log('version: ', await fake.getVersion());
    console.log('token: ', await fake.getToken());
    console.log('basket manager: ', await fake.getBasketManager());

    console.log(2);

    //const masset = await Masset.new();
    //console.log("new masset: ", masset.address);

    //let abi = massetProxy.contract.methods['upgradeTo(address)'](masset.address).encodeABI();
    //console.log('abi for upgrade: ', abi);

    await fake.migrateFromV1ToV2();

    console.log('version: ', await fake.getVersion());
    console.log('token: ', await fake.getToken());
    console.log('basket manager: ', await fake.getBasketManager());
}
