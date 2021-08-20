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
import fs from "fs";
import readline from "readline";
import { StakingInstance } from "types/generated";

const stakingContractAddress = "0x5684a06CaB22Db16d901fEe2A5C081b4C91eA40e"

const logger = new Logs().showInConsole(true);

export default async function snapshotUpdate(truffle, networkName: string): Promise<void> {
    const web3: Web3 = truffle.web3;
    const artifacts: Truffle.Artifacts = truffle.artifacts;
    const defaultAccount = (await web3.eth.getAccounts())[0];

    const Staking = artifacts.require("Staking");
    const staking = await Staking.at(stakingContractAddress);

    const stream = fs.createReadStream("addressList_1");
    
    const rl = readline.createInterface({
        input: stream,
        crlfDelay: Infinity
    });

    for await (const line of rl) {
        await updateStaker(line, staking);
    }
}

async function updateStaker(address: string, staking: StakingInstance) {
    logger.info(`Updating staker: ${address}`);
}
