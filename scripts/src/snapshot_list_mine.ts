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
import fs, { promises as fsPromises } from "fs";
import { StakingInstance } from "types/generated";
import { BN } from "@utils/tools";
import readline from "readline";

const stakingContractAddress = "0x5684a06CaB22Db16d901fEe2A5C081b4C91eA40e";

export default async function snapshot(truffle, networkName: string): Promise<void> {

    const web3: Web3 = truffle.web3;
    const artifacts: Truffle.Artifacts = truffle.artifacts;

    const Staking = artifacts.require("Staking");
    const staking = await Staking.at(stakingContractAddress);

    const originalFromBlock = 3100263;
    const batchSize = 1000;
    let fromBlock = originalFromBlock;
    const toBlock = 3687919;

    const lastBlockfd = await fsPromises.open("last_block", "r+");
    const content = await lastBlockfd.readFile();
    if (content.length > 0) {
        fromBlock = parseInt(content.toString());
        if(fromBlock < originalFromBlock) fromBlock = originalFromBlock;
        console.log(`Resuming from block ${fromBlock}`);
    }
    lastBlockfd.close();

    if (fromBlock > toBlock) {
        console.log('Finished!');
        return;
    }

    const fdout = await fsPromises.open("address_list_1", "a+");
    const addresses = {};
    const start = new Date().getTime();

    for (let pointer = fromBlock; pointer <= toBlock; pointer += batchSize) {
        const events = await staking.getPastEvents("TokensStaked", {
            fromBlock: pointer,
            toBlock: pointer + batchSize
        });

        for (const event of events) {
            let stakerAddress = event.returnValues.staker;
            stakerAddress = stakerAddress.toLowerCase();
            if(!addresses[stakerAddress]) {
                addresses[stakerAddress] = true;
                console.log(stakerAddress);
                fdout.write(stakerAddress + '\n');
            }
        }

        const av = (new Date().getTime() - start) / (pointer - originalFromBlock + 1);
        const rt = (toBlock - pointer) * av / (60000);

        console.log(`current block: ${pointer} events: ${events.length} rt: ${rt} m`);
        const lastBlockfd = await fsPromises.open("last_block", "w");
        lastBlockfd.write(pointer.toString(), 0);
        lastBlockfd.close();
    }

    fdout.close();
}
