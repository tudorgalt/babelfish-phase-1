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
import { promises as fsPromises } from "fs";
import { StakingInstance } from "types/generated";
import { BN } from "@utils/tools";

const stakingContractAddress = "0x5684a06CaB22Db16d901fEe2A5C081b4C91eA40e"

const logger = new Logs().showInConsole(true);
let fd: fsPromises.FileHandle;

export default async function snapshot(truffle, networkName: string): Promise<void> {
    const web3: Web3 = truffle.web3;
    const artifacts: Truffle.Artifacts = truffle.artifacts;
    const defaultAccount = (await web3.eth.getAccounts())[0];

    const Staking = artifacts.require("Staking");
    const staking = await Staking.at(stakingContractAddress);

    const addressMap: { [address: string]: number } = {};
    const fromBlock = 3100260;
    const toBlock = 3616883;
    const batchSize = 20;

    fd = await fsPromises.open("addressList_1", "a+");

    for (let pointer = fromBlock; pointer <= toBlock; pointer += batchSize) {
        const events = await staking.getPastEvents("TokensStaked", {
            fromBlock: pointer,
            toBlock: pointer + batchSize
        });

        for (const event of events) {
            const stakerAddress = event.returnValues.staker;
            if (addressMap[stakerAddress] !== 1) {
                addressMap[stakerAddress] = 1;
                await saveStaker(stakerAddress, staking);
            }
        }

        logger.info(`current block: ${pointer}, ${(pointer - fromBlock) / (toBlock - fromBlock)}`);
    }
}

async function saveStaker(address: string, staking: StakingInstance) {
    const balance = await staking.balanceOf(address);
    if (!balance.gt(new BN(0))) {
        return;
    }

    fd.write(`${address}\n`);

    logger.info(`New staker: ${address}. Balance: ${balance.toString()}`);
}

