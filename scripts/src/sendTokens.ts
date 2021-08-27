/* eslint-disable no-await-in-loop */
/* eslint-disable no-plusplus */
/* eslint-disable no-continue */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-restricted-syntax */
import { BN } from "@utils/tools";
import { getDeployed, setNetwork } from "migrations/state";
import Logs from "node-logs";
import { SenderInstance } from "types/generated";

const logger = new Logs().showInConsole(true);

const main = async (truffle, networkName): Promise<void> => {
    setNetwork(networkName);

    const Sender = truffle.artifacts.require("Sender");
    const sender: SenderInstance = await getDeployed(Sender, "Sender");

    const batchSize = 100;
    const total = await sender.total();
    let currentIndex = await sender.index();

    if (currentIndex.eq(new BN(0))) {
        logger.info("Starting sending tokens");
    } else {
        logger.info(`Resuming sending from: ${currentIndex.toString()}`);
    }

    try {
        while (currentIndex.lt(total)) {
            await sender.sendTokens(batchSize);

            currentIndex = await sender.index();
            logger.info(`Sent to ${batchSize} addresses. Index: ${currentIndex.toString()}`);
        }
    } catch (e) {
        logger.err("ERROR");
        console.log(e);
    }
};


export default main;
