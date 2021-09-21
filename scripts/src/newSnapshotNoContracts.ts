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
    const addresses = Object.keys(alreadyRead);

    let fd: fsPromises.FileHandle = await fsPromises.open("airdrop_1_snapshots_full_no_contracts.csv", "a+");
    const csvContent = await fd.readFile();
    if (csvContent.length === 0) {
        fd.write("address,snapshot1,snapshot2\n");
    }

    const start = new Date().getTime();

    for(var counter = 0; counter < addresses.length; counter++) {
        let address = addresses[counter];
        if (address == 'address') continue;

        const [power1, power2] = alreadyRead[address];
        address = Web3.utils.toChecksumAddress(address);

        if (power1 == 0 && power2 == 0) continue;
        const code = await web3.eth.getCode(address);
        const contract = code.length > 3;
        if (contract) continue;

        console.log(`${address},${power1},${power2}`);
        fd.write(`${address},${power1},${power2}\n`);

        const av = (new Date().getTime() - start) / (counter + 1);
        console.log('done: ', (counter + 1), 'of', addresses.length, '   remaining time: ', (addresses.length - counter) * av / (60000), 'mins');
    }

    fd.close();
}

async function readAlreadyRead() {
    const fileStream = fs.createReadStream('airdrop_1_snapshots_full.csv');
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
