/* eslint-disable no-await-in-loop */
/* eslint-disable no-plusplus */
/* eslint-disable no-continue */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-restricted-syntax */
import Web3 from "web3";
import { BN } from "@utils/tools";
import { getDeployed, setNetwork } from "migrations/state";
import Logs from "node-logs";
import { SenderInstance } from "types/generated";

const logger = new Logs().showInConsole(true);
const batchSize = 150;

const main = async (truffle, networkName): Promise<void> => {
    setNetwork(networkName);

    const web3: Web3 = truffle.web3;

    const Sender = truffle.artifacts.require("Sender");
    const sender: SenderInstance = await getDeployed(Sender, "Sender");

    const total = await sender.totalLength();
    const totalValue = await sender.totalAmount();

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

    logger.success(`Sending completed. Total gas used: ${totalGasUsed}`);
};


export default main;
