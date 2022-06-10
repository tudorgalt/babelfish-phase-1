import HDWalletProvider from '@truffle/hdwallet-provider';
import state from '../../migrations/state';
import BN from "bn.js";

export default async function mint(truffle): Promise<any> {

    const artifacts = truffle.artifacts;
    const provider = truffle.web3.currentProvider;
    const admin = provider.getAddress(1);

    console.log(provider.getAddress(0), provider.getAddress(1));
    //return;

    state.setNetwork('rskTestnet');

/*
    const MockToken = artifacts.require("MockERC20");
    const mockToken = await state.conditionalDeploy(MockToken, 'MockToken', () => MockToken.new('MOCK',
        'MOCK', 18,
        '0x2bD2201BFE156A71EB0D02837172ffc237218505', new BN('100000000000000000000000000')));
    console.log('MockToken: ', mockToken.address);
    return;
*/

    const Masset = artifacts.require("Masset");
    const fake = await state.getDeployed(Masset, 'MassetProxy');
    console.log('version before: ', await fake.getVersion());

    const masset = await state.conditionalDeploy(Masset, 'Masset', () => Masset.new());

    const MassetProxy = artifacts.require("MassetProxy");
    const massetProxy = await state.getDeployed(MassetProxy, 'MassetProxy');

    // console.log(massetProxy.contract.methods);
    // const abi = massetProxy.contract.methods['upgradeTo(address)'](masset.address).encodeABI();
    // console.log(abi);

    console.log('upgrade...');
    await massetProxy.upgradeTo(masset.address, { from: admin });

    console.log('migrateToV29...');
    await fake.migrateToV29();

    console.log('version after: ', await fake.getVersion());
}
