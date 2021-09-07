/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable no-plusplus */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/* eslint-disable prefer-destructuring */
/* eslint-disable @typescript-eslint/triple-slash-reference,spaced-comment */
/// <reference path="../../types/generated/index.d.ts" />
/// <reference path="../../types/generated/types.d.ts" />

import Web3 from "web3";
import Logs from "node-logs";
import fs, { promises as fsPromises } from "fs";
import { StakingInstance } from "types/generated";
import { ZERO_ADDRESS } from "@utils/constants";
import { exit } from "process";
import readline from "readline";

export default async function snapshot(truffle, networkName: string): Promise<void> {
    const web3: Web3 = truffle.web3;
    const artifacts: Truffle.Artifacts = truffle.artifacts;
    const defaultAccount = (await web3.eth.getAccounts())[0];

    const stakingContractAddress = "0x5684a06CaB22Db16d901fEe2A5C081b4C91eA40e"
    const Staking = artifacts.require("WeightedStaking");
    const staking = await Staking.at(stakingContractAddress);

    const alreadyRead = await readAlreadyRead();
    const addresses = await readPrevious(alreadyRead);

    let fd: fsPromises.FileHandle = await fsPromises.open("airdrop_1_snapshots_fixed.csv", "a+");
    const csvContent = await fd.readFile();
    if (csvContent.length === 0) {
        fd.write("address,snapshot1,snapshot2\n");
    }

    const start = new Date().getTime();

    const toBlock1 = 3454295;
    const timestamp1 = new Date('2021/06/22 02:59:53 +03:00').getTime() / 1000;

    const toBlock2 = 3632151;
    const timestamp2 = new Date('2021/08/26 02:59:44 +03:00').getTime() / 1000;

    for(var counter = 0; counter < addresses.length; counter++) {

        const [address, power1, power2] = addresses[counter];

        const stake1 = (await staking.getPriorWeightedStake(address, toBlock1, timestamp1)).toString();
        const stake2 = (await staking.getPriorWeightedStake(address, toBlock2, timestamp2)).toString();

        console.log(`${address},${stake1},${stake2}`);
        fd.write(`${address},${stake1},${stake2}\n`);

        const av = (new Date().getTime() - start) / (counter + 1);
        console.log('done: ', (counter + 1), 'of', addresses.length, '   remaining time: ', (addresses.length - counter) * av / (60000), 'mins');
    }

    fd.close();
}

async function readAlreadyRead() {
    const fileStream = fs.createReadStream('airdrop_1_snapshots_fixed.csv');
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: 1
    });
    const addresses = {};
    for await (const line of rl) {
        const [address, power1, power2] = line.split(",");
        addresses[address.toLowerCase()] = [ power1, power2 ];
    }
    fileStream.close();
    return addresses;
}

async function readPrevious(alreadyRead) {
    const fileStream = fs.createReadStream('airdrop_1_final_defucked.csv');
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: 1
    });
    const addresses = [];
    for await (const line of rl) {
        const [address, power1, power2] = line.split(",");
        if (alreadyRead[address.toLowerCase()]) continue;
        addresses.push([ address, power1, power2 ]);
    }
    fileStream.close();
    return addresses;
}
