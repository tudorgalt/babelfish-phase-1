import HDWalletProvider from '@truffle/hdwallet-provider';
import state from '../../migrations/state';
import BN from "bn.js";

export default async function mint(truffle): Promise<any> {

    const artifacts = truffle.artifacts;
    const provider = truffle.web3.currentProvider;
    const admin = provider.getAddress(1);

    console.log(provider.getAddress(0), provider.getAddress(1));
    state.setNetwork('rsk');

    const LPC = artifacts.require("LiquidityPoolV1Converter");
    const lpc = await LPC.at('0xdeb0894196863dbb2f2d4c683f6d33a2197056b5');

    console.log(lpc.contract.methods);
    const amount = new BN('10500000000000000000000');
    const tokens = [ '0x055a902303746382fbb7d18f6ae0df56efdc5213', '0x542fda317318ebf1d3deaf76e0b632741a7e677d' ];
    const abi = lpc.contract.methods['removeLiquidity(uint256,address[],uint256[])'](
        '1000000000000000000',
        tokens,
        ['1000000000000000001', '1000000000000000001']
    ).encodeABI();
    console.log(abi);
    //return;
}
