// 0x0cc3122316a8993aD4021AF54d61C02072ffD347
import Logs from "node-logs";
import { task } from "hardhat/config";
import { getDeployed, setNetwork } from "migrations/utils/state";
import { fromWei, tokens } from "@utils/tools";
import { MassetV3Contract, TokenContract } from "types/generated";
import { Instances } from "migrations/utils/addresses";

const logger = new Logs().showInConsole(true);

const TOKEN_AMOUNT = tokens("10000");

const instance: Instances = "XUSD";

task("approveMasset", "approves token for masset contract").setAction(async (_, hre) => {
    const { network, artifacts } = hre;
    setNetwork(network.name);
    const [owner] = await hre.getUnnamedAccounts();

    logger.info(`Using account: ${owner}`);

    const MassetToken: TokenContract = artifacts.require("Token");
    const token = await getDeployed(MassetToken, `${instance}_Token`);

    logger.info(`Token address: ${token.address}`);

    const MassetV3: MassetV3Contract = artifacts.require("MassetV3");
    const massetV3 = await getDeployed(MassetV3, `${instance}_MassetProxy`);

    await token.approve(massetV3.address, TOKEN_AMOUNT, { from: owner });
    logger.success(`Approved ${fromWei(TOKEN_AMOUNT)} tokens for massetV3 contract`);

    const allowance = await token.allowance(owner, massetV3.address);
    logger.success(`Allowance is: ${fromWei(allowance)}`);
});
