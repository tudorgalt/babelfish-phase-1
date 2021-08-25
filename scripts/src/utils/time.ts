import Web3 from "web3";
import Logs from "node-logs";
import { BN } from "../../../test-utils/tools";

const logger = new Logs().showInConsole(true);

export const nowSimple = (): number => Math.ceil(Date.now() / 1000);

export const nowExact = (): BN => new BN(nowSimple());

export const blockTimestampExact = async (web3: any, block = "latest"): Promise<BN> => {
    const timestamp = await blockTimestampSimple(web3, block);
    return new BN(timestamp);
};

export const blockTimestampSimple = async (web3: any, block = "latest"): Promise<number> => {
    const { timestamp } = await web3.eth.getBlock(block);
    return timestamp;
};

export const timeTravel = async (web3: any, seconds: number) => {
    const timestamp = await blockTimestampSimple(web3);
    const newTimestamp = timestamp + seconds;
    console.log(`Advancing block time ${seconds} seconds...`);

    return new Promise((resolve, reject) => {
        web3.currentProvider.send(
            {
                jsonrpc: "2.0",
                method: "evm_mine",
                params: [newTimestamp],
                id: new Date().getTime(),
            },
            (err, result) => {
                if (err) {
                    return reject(err);
                }
                return resolve(result);
            },
        );
    });
};

export const waitForBlock = async (truffle, offset: number): Promise<void> => {
    const web3: Web3 = truffle.web3;

    const startingBlock = await web3.eth.getBlock("latest");

    logger.info(`Current block: ${startingBlock.number}`);
    logger.info(`Waiting for block: ${startingBlock.number  + offset} ...`);

    await new Promise<void>((resolve, revert) => {
        let interval = 0;

        const check = async (): Promise<void> => {
            let currentBlockNumber: number;

            try {
                currentBlockNumber = (await web3.eth.getBlock("latest")).number;
            } catch (e) {
                logger.error("Error in getting block number");
                console.log(e);
                revert(e);
                return;
            }

            if (currentBlockNumber >= (startingBlock.number + offset)) {
                truffle.clearInterval(interval);
                interval = 0;

                resolve();
            }
        };

        interval = truffle.setInterval(check, 500);
    });
};
