import HDWalletProvider from '@truffle/hdwallet-provider';
import Truffle from 'truffle';

const massetProxyAddress = '0x1440d19436bEeaF8517896bffB957a88EC95a00F';

export default async function mint(truffle): Promise<any> {
    const wallet: HDWalletProvider = truffle.provider;
    const artifacts: Truffle.Artifacts = truffle.artifacts;

    const Masset = artifacts.require("Masset");
    const MassetProxy = artifacts.require("MassetProxy");

    const massetProxy = await MassetProxy.at(massetProxyAddress);
    const abi = massetProxy.contract.methods['upgradeTo(address)']('0xad624f56f80cDb5E1b37d314981672e24F0917EA').encodeABI();
    console.log(abi);

    const fake = await Masset.at(massetProxyAddress);

    console.log(await fake.getVersion());

    //const masset = await Masset.new();
    //console.log(masset.address);

    await fake.migrateV1ToV2();
    console.log(await fake.getVersion());
}
