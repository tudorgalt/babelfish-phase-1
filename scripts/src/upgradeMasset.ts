import HDWalletProvider from '@truffle/hdwallet-provider';
import state from '../../migrations/state'

const massetProxyAddress = '0x1440d19436bEeaF8517896bffB957a88EC95a00F';

export default async function mint(truffle): Promise<any> {

    const artifacts = truffle.artifacts;
    const provider = truffle.web3.currentProvider;
    const admin = provider.getAddress(1);

    state.setNetwork('rsk');

    const Masset = artifacts.require("Masset");
    /*

    const masset = await state.conditionalDeploy(Masset, 'Masset', () => Masset.new());

    const MassetProxy = artifacts.require("MassetProxy");
    const massetProxy = await MassetProxy.at(massetProxyAddress);
    //await massetProxy.upgradeTo(masset.address, { from: admin });

    const abi = massetProxy.contract.methods['upgradeTo(address)'](masset.address).encodeABI();
    console.log(abi);

     */

    const fake = await Masset.at(massetProxyAddress);
    console.log('version before: ', await fake.getVersion());
    await fake.migrateV20ToV22();
    console.log('version after: ', await fake.getVersion());
}
