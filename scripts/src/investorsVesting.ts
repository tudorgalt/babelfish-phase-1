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
const precision = new BN('1000000000000000000');

export default async function main(truffle, networkName): Promise<void> {
    setNetwork(networkName);
    const artifacts: Truffle.Artifacts = truffle.artifacts;
    const web3: Web3 = truffle.web3;

    const address0 = web3.currentProvider['addresses'][0];

    console.log('0: ', address0);

    const FishToken = artifacts.require("Fish");
    const token: FishInstance = await FishToken.at('0x055A902303746382FBB7D18f6aE0df56eFDc5213');

    const IVestingRegistry3 = truffle.artifacts.require("IVestingRegistry3");
    const vestingRegistry = await IVestingRegistry3.at('0x036ab2DB0a3d1574469a4a7E09887Ed76fB56C41');

    const IVesting = truffle.artifacts.require("IVesting");

    let abi = vestingRegistry.contract.methods['addAdmin(address)'](address0).encodeABI();
    console.log('abi for addAdmin: ', abi);

    console.log("Vesting....");

    for (let i=0; i<addresses.length; i++) {
        let [address, amount, cliff, duration] = addresses[i];
        amount = (amount as BN).mul(precision);

        console.log(i, address, amount.toString(), cliff, duration);

        await vest(vestingRegistry, address, amount, cliff, duration);
    }

    console.log(8);
};

async function vest(vestingRegistry: IVestingRegistry3Instance, address, amount, cliff, duration) {
    await vestingRegistry.createVesting(address, amount, cliff * four_weeks, duration * four_weeks);
    const vestingAddress = await vestingRegistry.getVesting(address);
    await vestingRegistry.stakeTokens(vestingAddress, amount);
}

const addresses = [
    //[ "0x21e1aacb6aadf9c6f28896329ef9423ae5c67416", new BN("21000000"), 3, 23 ],
    //[ "0x41df960e40bc58a6150376522d39735eac9c8928", new BN("10500000"), 3, 23 ],
    //[ "0xe078bdbfd0d53ae5918231442e009fe48af39442", new BN("2571534"), 1, 10 ],
    [ "0x15d63b784f4029983b142bf04b0fd2dadcf616ce", new BN("4239270"), 1, 10 ],
    [ "0x28d1f1d46fd6d0460b2d96ec083f8faf71ca80cc", new BN("790776"), 1, 10 ],
];
