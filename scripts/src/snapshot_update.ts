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
import fs from "fs";
import { performance } from "perf_hooks";
import ObjectsToCsv from "objects-to-csv";
import readline from "readline";
import { StakingInstance } from "types/generated";

const stakingContractAddress = "0x5684a06CaB22Db16d901fEe2A5C081b4C91eA40e";
const inputFile = "addressList_3_unique";
const outputFile = "./stakers_data.csv";

const logger = new Logs().showInConsole(true);

type StakerInfo = {
    address: string;
    votingPower: string;
};

export default async function snapshotUpdate(truffle, networkName: string): Promise<void> {
    let stakersList: StakerInfo[] = [];
    const web3: Web3 = truffle.web3;
    const artifacts: Truffle.Artifacts = truffle.artifacts;
    const defaultAccount = (await web3.eth.getAccounts())[0];

    const Staking = artifacts.require("Staking");
    const staking = await Staking.at(stakingContractAddress);

    const toBlock = 3619688;
    const stakingKickoff = await staking.kickoffTS();

    const stream = fs.createReadStream(inputFile);

    const rl = readline.createInterface({
        input: stream,
        crlfDelay: Infinity
    });

    let promises: Promise<StakerInfo>[] = [];
    let i = 0;
    let progress = 0;
    const batchSize = 5;

    for await (const address of rl) {
        promises.push(new Promise<StakerInfo>((resolve, reject) => {
            staking.getPriorVotes(address, toBlock, stakingKickoff)
                .then((val) => {
                    const stakerInfo: StakerInfo = {
                        address,
                        votingPower: val.toString()
                    };

                    resolve(stakerInfo);
                })
                .catch(e => {
                    logger.err(`Error`);
                    console.log(e);
                    reject(e);
                });
        }));

        progress++;

        if (i < (batchSize - 1)) {
            i++;
            continue;
        }

        const start = performance.now();
        const stakersInfo = await Promise.all(promises);
        const duration = performance.now() - start;
        const speed = batchSize / duration * 1000;
        stakersList = [...stakersList, ...stakersInfo];

        i = 0;
        promises = [];
        logger.info(`${stakersInfo.length}, progress: ${progress}, speed: ${speed} `);
    }

    if (promises.length) {
        const stakersInfo = await Promise.all(promises);
        stakersList = [...stakersList, ...stakersInfo];
        logger.info(`${stakersInfo.length}`);
    }

    logger.success("data found for all stakers!");

    const csv = new ObjectsToCsv(stakersList);
    await csv.toDisk(outputFile);

    logger.success(`Data saved to ${outputFile} file`);
}
