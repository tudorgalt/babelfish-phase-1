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

const four_weeks = 4 * 7 * 24 * 60 * 60;
const one_token = new BN('1000000000000000000');

export default async function main(truffle, networkName): Promise<void> {
    setNetwork(networkName);
    const artifacts: Truffle.Artifacts = truffle.artifacts;
    const web3: Web3 = truffle.web3;

    const address0 = web3.currentProvider['addresses'][0];
    const address1 = web3.currentProvider['addresses'][1];
    const address2 = web3.currentProvider['addresses'][2];

    console.log('0: ', address0);
    console.log('1: ', address1);
    console.log('2: ', address2);

    const FishToken = artifacts.require("Fish");
    const token: FishInstance = await FishToken.at('0x055A902303746382FBB7D18f6aE0df56eFDc5213');

    console.log(0);

    //await token.transfer(address2, one_token, { from: address1 });

    console.log(1);

    const IVestingRegistry3 = truffle.artifacts.require("IVestingRegistry3");
    const vestingRegistry = await IVestingRegistry3.at('0x036ab2DB0a3d1574469a4a7E09887Ed76fB56C41');

    console.log(2);

    //let abi = vestingRegistry.contract.methods['addAdmin(address)'](address).encodeABI();
    //console.log('abi for upgrade: ', abi);

    console.log(3);

    //await vestingRegistry.createTeamVesting(address2, one_token, 1 * four_weeks, 9 * four_weeks);
    const vestingAddress = await vestingRegistry.getTeamVesting(address2);

    const IVesting = truffle.artifacts.require("IVesting");
    const vesting = await IVesting.at(vestingAddress);

    console.log(5);

    console.log(6);

    await token.approve(vesting.address, one_token, { from: address2 });

    console.log(7);

    await vesting.stakeTokens(one_token, { from: address2 });

    console.log(8);
};
