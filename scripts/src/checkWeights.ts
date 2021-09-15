/* eslint-disable no-plusplus */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-console */

import { BN } from "@utils/tools";
import fs, { promises as fsPromises } from "fs";
import Logs from "node-logs";
import readline from "readline";
import Truffle from 'truffle';
import { StakingInstance } from "types/generated";

const logger = new Logs().showInConsole(true);

const toBlock1 = 3454295;
const timestamp1 = 1624319993;
const precision = new BN('1000000000');

let fd: fsPromises.FileHandle;
const stakingContractAddress = "0x5684a06CaB22Db16d901fEe2A5C081b4C91eA40e";

let matchedWeights = 0;
let diffWeights = 0;

const main = async (truffle, networkName: string): Promise<void> => {
    const artifacts: Truffle.Artifacts = truffle.artifacts;
    
    const Staking = artifacts.require("Staking");
    const staking: StakingInstance = await Staking.at(stakingContractAddress);

    const kickOfTS = await staking.kickoffTS();
    logger.info(`kickOfTS: ${kickOfTS}`);

    fd = await fsPromises.open("weightedStakesList4", "a+");
    const csvContent = await fd.readFile();
    if (csvContent.length === 0) {
        fd.write("Address,Power(Konrad's calculation),WeightedStakes(getPriorWeightedStake),Diff(%)\n");
        logger.info(`Initializing CSV`);
    }

    const fileStream = fs.createReadStream("snap/data/powers4.csv");
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    for await (const line of rl) {
        const [address, power] = line.split(",");

        if (isLineValid(address, power)) {
            await saveData(address, staking, power);
        }
    }
};

const saveData = async (account: string, staking: StakingInstance, power: string): Promise<void> => {
    const weightedStake = await staking.getPriorWeightedStake(account, toBlock1, timestamp1);

    const normalizedPower = new BN(power).mul(precision);

    const alteredWeightedStake = weightedStake.div(precision).mul(precision);

    const divider = new BN(100000000);
    const difference = normalizedPower.sub(alteredWeightedStake).div(divider);
    const fullStake = alteredWeightedStake.div(divider);

    const percentage = difference.toNumber() / fullStake.toNumber() * 100;

    fd.write(`${account},${normalizedPower.toString()},${weightedStake.toString()},${Math.round(percentage)}\n`);
    if (weightedStake.eq(normalizedPower)) {
        logger.success("New staker with weightedStake equal power");
        matchedWeights ++;
    } else {
        logger.err("New staker with diffrent weighted stake");
        diffWeights ++;
    }

    logger.info(`Current Status: Records with matched weights: ${matchedWeights}. With diffrent weights: ${diffWeights}`);
};

const isLineValid = (address: string, power: string): boolean => {
    if (!address || !power) return false; // ignore empty lines
    if (address === "address") return false; // ignore header

    return true;
};

export default main;
