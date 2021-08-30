/* eslint-disable prefer-destructuring */
/* eslint-disable @typescript-eslint/triple-slash-reference,spaced-comment */
/// <reference path="../../types/generated/index.d.ts" />
/// <reference path="../../types/generated/types.d.ts" />

/* eslint-disable no-await-in-loop */
/* eslint-disable no-plusplus */
/* eslint-disable no-continue */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-restricted-syntax */
import { BN } from "@utils/tools";
import { getDeployed, setNetwork } from "migrations/state";
import Logs from "node-logs";
import { FishInstance, SenderInstance } from "types/generated";
import assert from "./utils/assert";

const logger = new Logs().showInConsole(true);
const batchSize = 150;

const main = async (truffle, networkName): Promise<void> => {
    setNetwork(networkName);

    const Sender = truffle.artifacts.require("Sender");
    const Fish = truffle.artifacts.require("Fish");

    const sender: SenderInstance = await getDeployed(Sender, "Sender");
    const fishToken: FishInstance = await getDeployed(Fish, "FishToken");

    const total = await sender.totalLength();
    const totalValue = await sender.totalAmount();
    const initialBalance = await fishToken.balanceOf(sender.address);

    logger.warn(`Total value of tokens to send: ${totalValue}`);

    let currentIndex = await sender.index();

    if (currentIndex.eq(new BN(0))) {
        logger.info("Starting sending tokens");
    } else {
        logger.info(`Resuming sending from: ${currentIndex.toString()}`);
    }

    let totalGasUsed = 0;

    try {
        while (currentIndex.lt(total)) {
            const { receipt } = await sender.sendTokens(batchSize);
            totalGasUsed += receipt.gasUsed;

            currentIndex = await sender.index();
            logger.info(`Sent to ${batchSize} addresses. Index: ${currentIndex.toString()}. Gas used: ${receipt.gasUsed}`);
        }
    } catch (e) {
        logger.err("ERROR");
        console.log(e);
    }

    const finalBalance = await fishToken.balanceOf(sender.address);
    const expectedBalance = initialBalance.sub(totalValue);

    assert(finalBalance.eq(expectedBalance), "final balance is not valid");

    logger.success(`Sending completed. Total gas used: ${totalGasUsed}`);
};


export default main;
