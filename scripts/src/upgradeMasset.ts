import HDWalletProvider from '@truffle/hdwallet-provider';
import state from '../../migrations/state'

const massetProxyAddress = '0x1572D7E4a78A8AD14AE722E6fE5f5600a2c7A149';

export default async function mint(truffle): Promise<any> {

    const artifacts = truffle.artifacts;
    const provider = truffle.web3.currentProvider;
    const admin = provider.getAddress(1);

    state.setNetwork('rskTestnet');

    const Masset = artifacts.require("Masset");
    const MassetProxy = artifacts.require("MassetProxy");

    const masset = await state.conditionalDeploy(Masset, 'Masset', () => Masset.new());

    const massetProxy = await MassetProxy.at(massetProxyAddress);
    await massetProxy.upgradeTo(masset.address, { from: admin });

    /*
    const abi = massetProxy.contract.methods['upgradeTo(address)']('0xad624f56f80cDb5E1b37d314981672e24F0917EA').encodeABI();
    console.log(abi);\
    */

    const fake = await Masset.at(massetProxyAddress);
    console.log('version before: ', await fake.getVersion());
    await fake.migrateV20ToV22();
    console.log('version after: ', await fake.getVersion());
}
