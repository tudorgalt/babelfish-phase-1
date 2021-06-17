/* eslint-disable @typescript-eslint/triple-slash-reference,spaced-comment */
/// <reference path="../../types/generated/index.d.ts" />
/// <reference path="../../types/generated/types.d.ts" />

import { setNetwork, conditionalDeploy } from "../state";

export default async ({ artifacts}: { artifacts: Truffle.Artifacts; }, deployer): Promise<void> => {
    process.env.NETWORK = deployer.network;
    await setNetwork(deployer.network);
    const cMigrations = artifacts.require("Migrations");
    await conditionalDeploy(cMigrations, 'Migrations', () => deployer.deploy(cMigrations));
};
