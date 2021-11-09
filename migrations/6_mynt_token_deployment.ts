import Logs from "node-logs";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { conditionalDeploy, printState, setNetwork } from "./utils/state";
import { DeploymentTags } from "./utils/DeploymentTags";

const MyntToken = artifacts.require("MyntToken");

const logger = new Logs().showInConsole(true);

const deployFunc = async ({ network, deployments, getUnnamedAccounts }: HardhatRuntimeEnvironment) => {
    logger.info("Deploying MYNT token...");
    setNetwork(network.name);

    const { deploy } = deployments;
    const [default_] = await getUnnamedAccounts();

    const myntToken = await conditionalDeploy({
        contract: MyntToken,
        key: "MyntToken",
        deployfunc: deploy,
        deployOptions: { from: default_ }
    });

    logger.info(`Deployed at: ${myntToken.address}`);

    const amm = '';
    const presale = '';
    const multisig = '';

    logger.info(`Setting market maker address to: ${amm}`);
    await myntToken.setMarketMaker(amm);

    logger.info(`Setting presale address to: ${presale}`);
    await myntToken.setPresale(presale);

    logger.info(`Setting owner address to: ${multisig}`);
    await myntToken.transferOwnership(multisig);

    logger.success("Migration completed");
    printState();
};

deployFunc.tags = [
    DeploymentTags.MyntToken
];

export default deployFunc;
