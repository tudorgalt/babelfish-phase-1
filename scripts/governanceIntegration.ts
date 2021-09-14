/* eslint-disable no-console */
import Logs from "node-logs";
import hre from "hardhat";
import { TransferOwnershipParams } from "./tasks/transferOwnership";

const logger = new Logs().showInConsole(true);

const main = async () => {
    const { run } = hre;

    const transferForSymbol = async (symbol: string) => {
        const contractsList: TransferOwnershipParams = {
            contracts: [
                `${symbol}_MassetProxy`,
                `${symbol}_BasketManagerProxy`,
                `${symbol}_RewardsManagerProxy`
            ]
        };
        await run("transferOwnership", contractsList);
    };

    await transferForSymbol('XUSD');
    await transferForSymbol('ETHs');
    await transferForSymbol('BNBs');

    logger.success("Finish");
};

main()
    .then(() => process.exit(0))
    .catch((error) => {
        logger.err('ERROR');
        console.error(error);
        process.exit(1);
    });
