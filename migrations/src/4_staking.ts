/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable spaced-comment */
/* eslint-disable @typescript-eslint/triple-slash-reference,spaced-comment */
/// <reference path="../../types/generated/index.d.ts" />
/// <reference path="../../types/generated/types.d.ts" />

import { simpleToExactAmount } from "@utils/math";
import { conditionalDeploy, conditionalInitialize, getDeployed } from "../state";


export default async (
    { artifacts }: { artifacts: Truffle.Artifacts },
    deployer,
    network,
    accounts,
): Promise<void> => {
    if (deployer.network === "fork") {
        // Don't bother running these migrations -- speed up the testing
        return;
    }

    const [default_] = accounts;

    /***************************************
  0. IMPORTS
  ****************************************/

    const c_IncentivisedVotingLockup = artifacts.require("IncentivisedVotingLockup");

    const c_RewardsDistributor = artifacts.require("RewardsDistributor");
    const c_MetaToken = artifacts.require("MetaToken");
    const c_Nexus = artifacts.require("Nexus");

    /***************************************
  1. IncentivisedVotingLockup
  Dependencies: []
  ****************************************/
    const d_Nexus = await getDeployed(c_Nexus, 'Nexus');

    const d_MetaToken = await getDeployed(c_MetaToken, 'MetaToken');

    const d_RewardsDistributor = await getDeployed(c_RewardsDistributor, 'RewardsDistributor');

    const d_IncentivisedVotingLockup = await conditionalDeploy(c_IncentivisedVotingLockup, 'IncentivisedVotingLockup', async () => {
        return deployer.deploy(
            c_IncentivisedVotingLockup,
            d_MetaToken.address,
            "Voting FISH",
            "vFISH",
            d_Nexus.address,
            d_RewardsDistributor.address,
            {
                from: default_,
            },
        );
    });

    if (deployer.network !== "mainnet") {
        await d_MetaToken.approve(d_RewardsDistributor.address, simpleToExactAmount(10000, 18), {
            from: default_,
        });
        await d_RewardsDistributor.distributeRewards(
            [d_IncentivisedVotingLockup.address],
            [simpleToExactAmount(10000, 18)],
            { from: default_ },
        );
    }
    console.log(`[IncentivisedVotingLockup]: '${d_IncentivisedVotingLockup.address}'`);
};
