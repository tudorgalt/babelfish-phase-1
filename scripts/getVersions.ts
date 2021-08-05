/* eslint-disable no-console */
import hre from "hardhat";
import { getDeployed, setNetwork } from "migrations/utils/state";

const MassetV3 = artifacts.require("MassetV3");
const BasketManagerV3 = artifacts.require("BasketManagerV3");

const getVersions = async () => {
    const { network } = hre;
    setNetwork(network.name);
    
    const logVersionsForInstance = async (symbol: string) => {
        console.info(`\n---------- ${symbol} ----------\n`);

        const massetMock = await getDeployed(MassetV3, `${symbol}_MassetProxy`);
        console.info(`Masset version: `, await massetMock.getVersion());

        const basketManagerMock = await getDeployed(BasketManagerV3, `${symbol}_MassetProxy`);
        console.info(`Basket Manager version: `, await basketManagerMock.getVersion());
    };

    await logVersionsForInstance('XUSD');
    await logVersionsForInstance('ETHs');
    await logVersionsForInstance('BNBs');
};

getVersions();
