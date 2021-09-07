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
import BN from 'bn.js';

export default async function snapshot(truffle, networkName: string): Promise<void> {
    const web3: Web3 = truffle.web3;
    const artifacts: Truffle.Artifacts = truffle.artifacts;
    const defaultAccount = (await web3.eth.getAccounts())[0];

    const addresses = await readPrevious();
    const map = {};

    for(var i=0; i<addresses.length; i++) {
        const [address, amount] = addresses[i];
        if(!map[address.toLowerCase()]) {
            map[address.toLowerCase()] = web3.utils.toBN(amount);
        } else {
            const bn = map[address.toLowerCase()] as BN;
            map[address.toLowerCase()] = bn.add(web3.utils.toBN(amount));
        }
    }

    let fd: fsPromises.FileHandle = await fsPromises.open("airdrop_1_final_defucked.csv", "a+");
    const csvContent = await fd.readFile();
    if (csvContent.length === 0) {
        fd.write("address,snapshot1,snapshot2\n");
    }

    for(var counter = 0; counter < Object.keys(map).length; counter++) {
        const address = Object.keys(map)[counter];
        const amount = map[address].toString();
        console.log(`${address},${amount}`);
        fd.write(`${address},${amount}\n`);
    }

    fd.close();
}

async function readPrevious() {
    const fileStream = fs.createReadStream('airdrop_1_final.csv');
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: 1
    });
    const addresses = [];
    for await (const line of rl) {
        const [address, power1, power2] = line.split(",");
        addresses.push([ address, power1, power2 ]);
    }
    fileStream.close();
    return addresses;
}
