/* eslint-disable prefer-destructuring */
/* eslint-disable @typescript-eslint/triple-slash-reference,spaced-comment */
/// <reference path="../../types/generated/index.d.ts" />
/// <reference path="../../types/generated/types.d.ts" />

import Web3 from "web3";
import Logs from "node-logs";
import { ZERO_ADDRESS } from "@utils/constants";
import { BasketManagerV3Instance, FishInstance, GovernorAlphaInstance, StakingInstance, TokenInstance } from "types/generated";
import { getDeployed, getInfo, setNetwork } from "../../migrations/state";
import { waitForBlock } from "./utils/time";

enum ProposalState { Pending, Active, Canceled, Defeated, Succeeded, Queued, Expired, Executed }

const logger = new Logs().showInConsole(true);

const assert = (condition: boolean, message?: string): void => {
    if (!condition) {
        const errorMessage = message || "Assertion failed";

        logger.err(`err: ${errorMessage}`);
        throw new Error(errorMessage);
    }
};

export default async function e2e(truffle, networkName: string): Promise<void> {
    const web3: Web3 = truffle.web3;
    const artifacts: Truffle.Artifacts = truffle.artifacts;

    const defaultAccount = (await web3.eth.getAccounts())[0];

    setNetwork(networkName);

    const BasketManagerV3 = artifacts.require("BasketManagerV3");
    const GovernorAlpha = artifacts.require("GovernorAlpha");
    const Staking = artifacts.require("Staking");
    const Fish = artifacts.require("Fish");
    const Token = artifacts.require("Token");

    const governorAlpha: GovernorAlphaInstance = await getDeployed(GovernorAlpha, `GovernorAlpha`);
    const basketManager: BasketManagerV3Instance = await getDeployed(BasketManagerV3, `XUSD_BasketManagerProxy`);
    const staking: StakingInstance = await getDeployed(Staking, `StakingProxy`);
    const fish: FishInstance = await getDeployed(Fish, `Fish`);

    const votingDelay = await governorAlpha.votingDelay();
    const votingPeriod = await governorAlpha.votingPeriod();

    const stakeAddress: string = await getInfo("StakingProxy", "address");
    const basketManagerAddress: string = await getInfo("XUSD_BasketManagerProxy", "address");

    const stakeAmount = 1000000;
    const stakeUntilDate = Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7 * 3);

    await fish.approve(stakeAddress, stakeAmount);
    await staking.stake(stakeAmount, stakeUntilDate, ZERO_ADDRESS, ZERO_ADDRESS);

    const targets = [basketManagerAddress];
    const values = [0];
    // address _basset, int256 _factor, address _bridge, uint256 _min, uint256 _max, bool _paused
    const newBasset: TokenInstance = await Token.new("TEST", "TST", 18);

    const signatures = ["addBasset(address,int256,address,uint256,uint256,bool)"];
    const calldatas = [web3.eth.abi.encodeParameters(
        ["address", "int256", "address", "uint256", "uint256", "bool"],
        [newBasset.address, 1, ZERO_ADDRESS, 0, 1000, false]
    )];

    await governorAlpha.propose(targets, values, signatures, calldatas, "test propsal");
    const latestProposal = await governorAlpha.latestProposalIds(defaultAccount);

    let proposalState = (await governorAlpha.state(latestProposal)).toNumber();
    assert(proposalState === ProposalState.Pending, "proposal should be pending");

    await waitForBlock(truffle, votingDelay.toNumber() + 1);

    proposalState = (await governorAlpha.state(latestProposal)).toNumber();
    assert(proposalState === ProposalState.Active, "proposal should be active");

    await governorAlpha.castVote(latestProposal, true);

    proposalState = (await governorAlpha.state(latestProposal)).toNumber();
    assert(proposalState === ProposalState.Active, "proposal should be active until the end of voting period");

    await waitForBlock(truffle, votingPeriod.toNumber());

    proposalState = (await governorAlpha.state(latestProposal)).toNumber();
    assert(proposalState === ProposalState.Succeeded, "proposal should be succeeded");

    await governorAlpha.queue(latestProposal);

    proposalState = (await governorAlpha.state(latestProposal)).toNumber();
    assert(proposalState === ProposalState.Queued, "proposal should be queued");

    await governorAlpha.execute(latestProposal);

    proposalState = (await governorAlpha.state(latestProposal)).toNumber();
    assert(proposalState === ProposalState.Executed, "proposal should be executed");

    const bassetsList = await basketManager.getBassets();

    assert(bassetsList.includes(newBasset.address), "new basset should be added");

    logger.success("Test Completed!");
}
