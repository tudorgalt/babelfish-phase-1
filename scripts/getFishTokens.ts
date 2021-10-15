/* eslint-disable no-console */
import hre from "hardhat";
import Logs from "node-logs";
import { getDeployed, setNetwork } from "migrations/utils/state";

const Fish = artifacts.require("Fish");

const logger = new Logs().showInConsole(true);

const RECIPIENT = '0x19F4A7Ca8CAe32cA8C12a3AcD039a39B07110F56';
const AMOUNT = '100000000000900000000';

const main = async () => {
    const { network } = hre;
    setNetwork(network.name);

    const fishToken = await getDeployed(Fish, "FishToken");
    await fishToken.transfer(RECIPIENT, AMOUNT);
};

main()
    .then(() => process.exit(0))
    .catch((error) => {
        logger.err('ERROR');
        console.error(error);
        process.exit(1);
    });
