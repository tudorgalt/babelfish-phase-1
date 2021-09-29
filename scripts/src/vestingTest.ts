/* eslint-disable prefer-destructuring */
/* eslint-disable @typescript-eslint/triple-slash-reference,spaced-comment */
/// <reference path="../../types/generated/index.d.ts" />
/// <reference path="../../types/generated/types.d.ts" />

/* eslint-disable no-await-in-loop */
/* eslint-disable no-plusplus */
/* eslint-disable no-continue */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-restricted-syntax */
import { conditionalDeploy, getDeployed, setNetwork } from "../state";
import { FishInstance, IVestingRegistry3Instance } from "types/generated";
import { promises } from "fs";
import Web3 from "web3";
import BN from "bn.js";

const four_weeks = 4 * 7 * 24 * 60 * 60;

export default async function main(truffle, networkName): Promise<void> {
    setNetwork(networkName);
    const artifacts: Truffle.Artifacts = truffle.artifacts;
    const web3: Web3 = truffle.web3;

    const address0 = web3.currentProvider['addresses'][0];
    const address1 = web3.currentProvider['addresses'][1];
    const address2 = web3.currentProvider['addresses'][2];

    console.log('0: ', address0);

    const FishToken = artifacts.require("Fish");
    const token: FishInstance = await FishToken.at('0x055A902303746382FBB7D18f6aE0df56eFDc5213');

    const IVestingRegistry3 = truffle.artifacts.require("IVestingRegistry3");
    const vestingRegistry = await IVestingRegistry3.at('0x036ab2DB0a3d1574469a4a7E09887Ed76fB56C41');

    const IVesting = truffle.artifacts.require("IVesting");

    //let abi = vestingRegistry.contract.methods['addAdmin(address)'](address).encodeABI();
    //console.log('abi for upgrade: ', abi);

    //let abi = vestingRegistry.contract.methods['transferSOV(address,uint256)']('0x26712A09D40F11f34e6C14633eD2C7C34c903eF0', 1).encodeABI();
    //console.log('abi for upgrade: ', abi);

    //return;

    console.log(3);

    for (let i=0; i<addresses.length; i++) {
        const [address, amount] = addresses[i];
        console.log(i, address, amount.toString());
        await vest(vestingRegistry, token, address, amount);
    }

    console.log(8);
};

async function vest(vestingRegistry: IVestingRegistry3Instance, token: FishInstance, address, amount) {
    await vestingRegistry.createTeamVesting(address, amount, 5 * four_weeks, 34 * four_weeks);
    const vestingAddress = await vestingRegistry.getTeamVesting(address);
    await vestingRegistry.stakeTokens(vestingAddress, amount);
}

const addresses = [

    [ "0xc93f79b87ac015f0e3f2aec92af3fd64fb43bf84", new BN("1680000000000000000000000") ],
    [ "0x590914d85a7924166361204d82ce8fc7d091d4e6", new BN("3780000000000000000000000") ],
    [ "0xb3d4977cc8499f64262a9da4963a9bb0f7b6252d", new BN("1050000000000000000000000") ],
    [ "0x67dcbacbd68bf26bb71b3bd9d67d6fc436e53a24", new BN("3360000000000000000000000") ],
    [ "0xac539b9156ac9ab4496215f4a563929134f155c5", new BN("2100000000000000000000000") ],
    [ "0x853ec54979ec150c6898f47f738316f5eb2cc486", new BN("1050000000000000000000000") ],
    [ "0xda484173f2bc398c3bfcf01dfb64284e807a4766", new BN("840000000000000000000000") ],
    [ "0x21e1aacb6aadf9c6f28896329ef9423ae5c67416", new BN("4200000000000000000000000") ],
    [ "0x428a80f48ab417e17a12ec81a2671c4846bdb2be", new BN("2100000000000000000000000") ],
    [ "0x3e6c9d9a60f7b606e0717a3d17290941fa1ec829", new BN("2814000000000000000000000") ],
    [ "0x263390d8ccfe9e3e17ce678f687fd7513e2d56aa", new BN("3696000000000000000000000") ],
    [ "0x0b39ed4668f2c99bf2350f0ca6ecc77079a1a794", new BN("3150000000000000000000000") ],
    [ "0x66333db117bf41578deec55d398460385daccbcc", new BN("3570000000000000000000000") ],
    [ "0x10380e8e2afd85e3c30ad5ffa5a0af1ccbbf6952", new BN("1050000000000000000000000") ],
    [ "0x1fc5a803546224d125f10560a6b947b294fe57b0", new BN("1890000000000000000000000") ],
    [ "0x7b660e0a69b0810a8d7bf894d9b0b7622cc87ffd", new BN("504000000000000000000000") ],
    [ "0xbee63c7833dfceb5edf8e9e1c4ecd3d7b02726c4", new BN("2226000000000000000000000") ],
    [ "0x8d8353731f248cb933e8d8915b92c3fd244e39c2", new BN("4200000000000000000000000") ]
];
