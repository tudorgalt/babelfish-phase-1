/* eslint-disable @typescript-eslint/triple-slash-reference,spaced-comment */
/// <reference path="../types/generated/index.d.ts" />
/// <reference path="../types/generated/types.d.ts" />

import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { setNetwork, conditionalDeploy } from "./utils/state";

const cMigrations = artifacts.require("Migrations");

const deployFunc: DeployFunction = async ({ network, deployments, getUnnamedAccounts, }: HardhatRuntimeEnvironment) => {
    const { deploy } = deployments;
    const [deployer] = await getUnnamedAccounts();

    process.env.NETWORK = network.name;
    setNetwork(network.name);

    await conditionalDeploy(cMigrations, "Migrations", { from: deployer }, deploy);
};

deployFunc.tags = ["migration"];

export default deployFunc;
