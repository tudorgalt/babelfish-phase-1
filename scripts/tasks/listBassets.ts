import Logs from "node-logs";
import { task } from "hardhat/config";
import { getDeployed, setNetwork } from "migrations/utils/state";
import { BasketManagerV3Contract, MassetContract } from "types/generated";
import { Instances } from "migrations/utils/addresses";

const logger = new Logs().showInConsole(true);

const instance: Instances = "XUSD";

task("listBassets", "prints bassets list").setAction(async (_, hre) => {
    const { network, artifacts, getUnnamedAccounts } = hre;
    setNetwork(network.name);
    const [owner] = await getUnnamedAccounts();

    logger.info(`Using account: ${owner}`);

    const MassetV3: MassetContract = artifacts.require("MassetV3");
    const BasketManager: BasketManagerV3Contract = artifacts.require("BasketManagerV3");

    const massetProxy = await getDeployed(MassetV3, `${instance}_MassetProxy`);
    const basketManager = await getDeployed(BasketManager, `${instance}_BasketManagerV3`);

    const bassets = await basketManager.getBassets();
    logger.success(`Bassets:\n${bassets.join("\n")}`);

    const basketManagerOwner = await massetProxy.owner();
    logger.success(`BasketManagerOwner:\n${basketManagerOwner}`);
});
