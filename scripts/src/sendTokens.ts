/* eslint-disable prefer-destructuring */
/* eslint-disable @typescript-eslint/triple-slash-reference,spaced-comment */
/// <reference path="../../types/generated/index.d.ts" />
/// <reference path="../../types/generated/types.d.ts" />

/* eslint-disable no-await-in-loop */
/* eslint-disable no-plusplus */
/* eslint-disable no-continue */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-restricted-syntax */
import { getDeployed, setNetwork } from "../state";
import { FishInstance, SenderInstance } from "types/generated";
import assert from "./utils/assert";

//const batchSize = 150;
const batchSize = 100;


export default async function main(truffle, networkName): Promise<void> {
    setNetwork(networkName);

    const Sender = truffle.artifacts.require("Sender");
    const Fish = truffle.artifacts.require("Fish");

    const sender: SenderInstance = await getDeployed(Sender, "Sender");
    const fishToken: FishInstance = await Fish.at('0x055A902303746382FBB7D18f6aE0df56eFDc5213');

/*
    await sender.returnTokens('38810000000000000000000');
    return;
*/
    const total = await sender.totalLength();
    //const totalValue = new BN('2982000000000000000000000');

    //onsole.log(`Total value of tokens to send: ${totalValue}`);

    let currentIndex = await sender.index();
    console.log(`Going to send to index ${currentIndex.toString()}...`);
    let balance = await fishToken.balanceOf(sender.address);
    console.log(`Current balance: ${balance.toString()}`);


    let totalGasUsed = 0;

    try {
        while (currentIndex.lt(total)) {
            const { receipt } = await sender.sendTokens(batchSize);
            totalGasUsed += receipt.gasUsed;

            currentIndex = await sender.index();
            console.log(`Sent to ${batchSize} addresses. Index: ${currentIndex.toString()}. Gas used: ${receipt.gasUsed}`);
            let balance = await fishToken.balanceOf(sender.address);
            console.log(`Current balance: ${balance.toString()}`);
        }
    } catch (e) {
        console.log("ERROR");
        console.log(e);
    }

    const finalBalance = await fishToken.balanceOf(sender.address);
    //const expectedBalance = initialBalance.sub(totalValue);

    //assert(finalBalance.eq(expectedBalance), "final balance is not valid");

    console.log(`Sending completed. Total gas used: ${totalGasUsed}`);
};
