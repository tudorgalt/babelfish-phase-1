/* eslint-disable no-continue */
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
import { performance } from "perf_hooks";
import { promises as fsPromises } from "fs";
import { StakingInstance } from "types/generated";
import { BN } from "@utils/tools";
import { ZERO_ADDRESS } from "@utils/constants";

const stakingContractAddress = "0x5684a06CaB22Db16d901fEe2A5C081b4C91eA40e";

const logger = new Logs().showInConsole(true);
let fd: fsPromises.FileHandle;

export default async function snapshot(truffle, networkName: string): Promise<void> {
    const web3: Web3 = truffle.web3;
    const artifacts: Truffle.Artifacts = truffle.artifacts;
    const defaultAccount = (await web3.eth.getAccounts())[0];

    const Staking = artifacts.require("Staking");
    const staking = await Staking.at(stakingContractAddress);

    const addressMap: { [address: string]: number } = {};
    const batchSize = 50;
    const fromBlock = 3070260; // 3070260 3100260
    const toBlock = 3454083; // June 21

    const stakingKickoff = await staking.kickoffTS();

    fd = await fsPromises.open("addressList_final", "a+");

    for (let pointer = fromBlock; pointer <= toBlock; pointer += batchSize) {
        const start = performance.now();
        const events = await staking.getPastEvents("TokensStaked", {
            fromBlock: pointer,
            toBlock: pointer + batchSize
        });

        for (const event of events) {
            const stakerAddress = event.returnValues.staker;

            if (addressMap[stakerAddress] !== 1) {
                addressMap[stakerAddress] = 1;
                await saveStaker(stakerAddress, stakingKickoff, staking, web3, toBlock);
            }
        }
        const duration = performance.now() - start;
        const speed = batchSize / duration * 1000;
        logger.info(`block: ${pointer}, ${((pointer - fromBlock) / (toBlock - fromBlock)).toFixed(3)}, bps: ${Math.round(speed)}`);
    }
}

async function saveStaker(address: string, timeStamp: BN, staking: StakingInstance, web3: Web3, toBlock: number) {
    const votes = await staking.getPriorVotes(address, toBlock, timeStamp);
    console.log({ votes: votes.toString() });
    if (!votes.gt(new BN(0))) {
        return;
    }

    const code = await web3.eth.getCode(address, "latest");
    if (code.length > 3) {
        return;
    }

    if (address === ZERO_ADDRESS) {
        return;
    }

    fd.write(`${address}\n`);

    logger.info(`New staker: ${address}. Votes: ${votes.toString()}`);
}

