import HDWalletProvider from '@truffle/hdwallet-provider';
import Truffle from 'truffle';

const massetProxyAddress = '0x4BF113905d7F69202106F613308bb02C84AaDF2F';

export default async function mint(truffle): Promise<any> {
    const wallet: HDWalletProvider = truffle.provider;
    const artifacts: Truffle.Artifacts = truffle.artifacts;

    const Masset = artifacts.require("Masset");
    const MassetProxy = artifacts.require("MassetProxy");

    const massetProxy = await MassetProxy.at(massetProxyAddress);
    const fake = await Masset.at(massetProxyAddress);

    console.log(1);

    console.log('version: ', await fake.getVersion());
    console.log('token: ', await fake.getToken());
    console.log('basket manager: ', await fake.geBasketManager());

    console.log(2);

    const masset = await Masset.new();
    console.log("new masset: ", masset.address);

    let abi = massetProxy.contract.methods['upgradeTo(address)'](masset.address).encodeABI();
    console.log('abi for upgrade: ', abi);

    /*
    const masset = await Masset.new();


    //console.log('current version: ', await fake.getVersion());

    console.log(2);

    const thresholdProxyAdmin = await ThresholdProxyAdmin.at(thresholdProxyAdminAddress);

    console.log(3);

    console.log('current version: ', await fake.getVersion());

    console.log(await fake.getBasketManager());
    console.log(await fake.getToken());

    await fake.resetReentrancyGuard();

    //await fake.migrateFromV1ToV2();

    //console.log(await fake.geBasketManager());
    //console.log(await fake.getToken());
     */
}
