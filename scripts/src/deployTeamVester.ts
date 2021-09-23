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
import { FishInstance, SenderInstance, TableInstance } from "types/generated";
import { promises } from "fs";
import Web3 from "web3";
import BN from "bn.js";


export default async function main(truffle, networkName): Promise<void> {
    setNetwork(networkName);
    const artifacts: Truffle.Artifacts = truffle.artifacts;
    const web3: Web3 = truffle.web3;

    const SimpleVester = artifacts.require("SimpleVester");
/*
    console.log(1);
    const oldVester = await SimpleVester.at('0xbd07a878b0af0cd211eaa0afa8df6f9ed28cb708');
    console.log(2);
    await oldVester.sendBack(new BN('5880000').mul(new BN('1000000000000000000')));
    console.log(3);
*/
    const simpleVester = await conditionalDeploy(SimpleVester, 'SimpleVester', () => SimpleVester.new());
/*
    const IVestingRegistry3 = truffle.artifacts.require("IVestingRegistry3");
    const vestingRegistry = await IVestingRegistry3.at('0x036ab2DB0a3d1574469a4a7E09887Ed76fB56C41');

    let abi = vestingRegistry.contract.methods['addAdmin(address)'](simpleVester.address).encodeABI();
    console.log('abi for upgrade: ', abi);
*/
    await simpleVester.doIt1();
    //await simpleVester.doIt2();
    //await simpleVester.doIt3();
};
