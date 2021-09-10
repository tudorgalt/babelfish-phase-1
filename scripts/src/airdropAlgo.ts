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

import BN from "bn.js";

const precision = new BN('1000000000000000000');
const totalFish = new BN('420000000').mul(precision);

const toBlock1 = 3454295;
const timestamp1 = new Date('2021/06/22 02:59:53 +03:00').getTime() / 1000;

const toBlock2 = 3632151;
const timestamp2 = new Date('2021/08/26 02:59:44 +03:00').getTime() / 1000;

const myAddress = '0x4c3d3505d34213751c4b4d621cb6bde7e664e222';

export default async function main(truffle): Promise<void> {

    const stakingContractAddress = "0x5684a06CaB22Db16d901fEe2A5C081b4C91eA40e";
    const Staking = truffle.artifacts.require("WeightedStaking");
    const staking = await Staking.at(stakingContractAddress);

    console.log("For address:", myAddress);
    console.log("=== phase 1 ===");

    const wrongWeights = await wrongSnapshot(staking);
    const wrongSum = howMuch(wrongWeights[0], wrongWeights[1]);

    console.log("How much I actually received:", wrongSum.toString());

    const correctWeights = await correctSnapshot(staking);
    const correctSum =  howMuch(correctWeights[0], correctWeights[1]);

    console.log("How much I should have received:", correctSum.toString());

    let correction = correctSum.sub(wrongSum);
    correction = correction.isNeg() ? new BN(0) : correction;

    console.log("How much I will get:", correction.toString());

    console.log("=== phase 2 ===");

    let adjustedSum = correctSum;
    if (correctSum.sub(wrongSum).isNeg()) {
        adjustedSum = correctSum.sub(wrongSum.sub(correctSum));
        adjustedSum = adjustedSum.isNeg() ? new BN(0) : adjustedSum;
    }

    console.log("I would have received:", correctSum.toString());
    console.log("I will get:", adjustedSum.toString());
}

function howMuch(weight1, weight2): BN {
    const forSnapshot1 = totalFish.mul(weight1)
        .div(precision)
        .mul(new BN(21))
        .div(new BN(1000));
    const forSnapshot2 = totalFish.mul(weight2)
        .div(precision)
        .mul(new BN(50))
        .div(new BN(1000));
    return forSnapshot1.add(forSnapshot2);
}

async function wrongSnapshot(staking) {
    const totalWeightSnapshot1 = new BN('24105617701014700000000000');
    let getWeight1 = await staking.getPriorVotes(myAddress, toBlock1, timestamp1);
    getWeight1 = getWeight1.mul(precision).div(totalWeightSnapshot1);

    const totalWeightSnapshot2 = new BN('3012181325664360000000000');
    let getWeight2 = await staking.getPriorVotes(myAddress, toBlock2, timestamp2);
    getWeight2 = getWeight2.mul(precision).div(totalWeightSnapshot2);

    return [getWeight1, getWeight2];
}

async function correctSnapshot(staking) {
    const totalWeightSnapshot1 = new BN('3834134366687950000000000');
    let getWeight1 = await staking.getPriorWeightedStake(myAddress, toBlock1, timestamp1);
    getWeight1 = getWeight1.mul(precision).div(totalWeightSnapshot1);

    const totalWeightSnapshot2 = new BN('6729472012135870000000000');
    let getWeight2 = await staking.getPriorWeightedStake(myAddress, toBlock2, timestamp2);
    getWeight2 = getWeight2.mul(precision).div(totalWeightSnapshot2);

    return [getWeight1, getWeight2];
}
