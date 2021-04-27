/* eslint-disable @typescript-eslint/triple-slash-reference,spaced-comment */
/// <reference path="../../types/generated/index.d.ts" />
/// <reference path="../../types/generated/types.d.ts" />

import { conditionalDeploy, conditionalInitialize } from "../state";

export default async (
    {
        artifacts,
    }: {
        artifacts: Truffle.Artifacts;
    },
    deployer,
): Promise<void> => {
    process.env.NETWORK = deployer.network;
    if (deployer.network === "fork") {
        return;
    }

    const cMigrations = artifacts.require("Migrations");
    await conditionalDeploy(cMigrations, 'Migrations', () => deployer.deploy(cMigrations));
};
