/* eslint-disable prefer-destructuring */
/* eslint-disable @typescript-eslint/triple-slash-reference,spaced-comment */
/// <reference path="../../types/generated/index.d.ts" />
/// <reference path="../../types/generated/types.d.ts" />

import Web3 from "web3";
import Logs from "node-logs";
import { ZERO_ADDRESS } from "@utils/constants";
import { BasketManagerV3Instance, FishInstance, GovernorAlphaInstance, StakingInstance, TimelockInstance, TokenInstance } from "types/generated";
import { getDeployed, getInfo, setNetwork } from "../../migrations/state";
import { wait, waitForBlock } from "./utils/time";
import assert from "./utils/assert";

enum ProposalState { Pending, Active, Canceled, Defeated, Succeeded, Queued, Expired, Executed }

const logger = new Logs().showInConsole(true);

export default async function e2e(truffle, networkName: string): Promise<void> {
    const web3: Web3 = truffle.web3;
    const artifacts: Truffle.Artifacts = truffle.artifacts;

    const [owner, voter1, voter2] = (await web3.eth.getAccounts());

    setNetwork(networkName);

    const BasketManagerV4 = artifacts.require("BasketManagerV4");
    const GovernorAlpha = artifacts.require("GovernorAlpha");
    const Staking = artifacts.require("Staking");
    const Fish = artifacts.require("Fish");
    const Token = artifacts.require("Token");
    const Timelock = artifacts.require("Timelock");

    const governorAlpha: GovernorAlphaInstance = await getDeployed(GovernorAlpha, `GovernorAlpha`);
    const basketManager: BasketManagerV3Instance = await getDeployed(BasketManagerV4, `XUSD_BasketManagerProxy`);
    const staking: StakingInstance = await getDeployed(Staking, `StakingProxy`);
    const fish: FishInstance = await getDeployed(Fish, `Fish`);
    const timelock: TimelockInstance = await getDeployed(Timelock, 'Timelock');

    const votingDelay = await governorAlpha.votingDelay();
    const votingPeriod = await governorAlpha.votingPeriod();
    const timelockDelay = await timelock.delay();

    const stakeAddress: string = await getInfo("StakingProxy", "address");
    const basketManagerAddress: string = await getInfo("XUSD_BasketManagerProxy", "address");

    const stakeAmount = 1000000;
    const stakeUntilDate = Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7 * 3);

    const stake = async (address: string, amount: number): Promise<void> => {
        await fish.transfer(address, amount, { from: owner });
        await fish.approve(stakeAddress, amount, { from: address });
        await staking.stake(amount, stakeUntilDate, ZERO_ADDRESS, ZERO_ADDRESS, { from: address });
    };

    await fish.approve(stakeAddress, stakeAmount);
    await staking.stake(stakeAmount, stakeUntilDate, ZERO_ADDRESS, ZERO_ADDRESS);

    await stake(voter1, stakeAmount / 500);
    await stake(voter2, stakeAmount);

    const targets = [basketManagerAddress];
    const values = [0];
    const newBasset: TokenInstance = await Token.new("TEST", "TST", 18);

    const signatures = ["addBasset(address,int256,address,uint256,uint256,uint256,bool)"];
    const calldatas = [web3.eth.abi.encodeParameters(
        ["address", "int256", "address", "uint256", "uint256", "uint256", "bool"],
        [newBasset.address, 1, ZERO_ADDRESS, 0, 1000, 100, false]
    )];

    await governorAlpha.propose(targets, values, signatures, calldatas, "test propsal");
    const latestProposal = await governorAlpha.latestProposalIds(owner);

    let proposalState = (await governorAlpha.state(latestProposal)).toNumber();
    assert(proposalState === ProposalState.Pending, "proposal should be pending");

    await waitForBlock(truffle, votingDelay.toNumber() + 1);

    proposalState = (await governorAlpha.state(latestProposal)).toNumber();
    assert(proposalState === ProposalState.Active, "proposal should be active");

    await governorAlpha.castVote(latestProposal, true);
    await governorAlpha.castVote(latestProposal, true, { from: voter1 });
    await governorAlpha.castVote(latestProposal, false, { from: voter2 });

    const [, startBlock, , forVotes, againstVotes, , , , startTime] = await governorAlpha.proposals(latestProposal);
    const ownerForVotes = await staking.getPriorVotes(owner, startBlock, startTime);
    const voter1ForVotes = await staking.getPriorVotes(voter1, startBlock, startTime);
    const voter2AgainstVotes = await staking.getPriorVotes(voter2, startBlock, startTime);

    assert(forVotes.eq(ownerForVotes.add(voter1ForVotes)), "not a proper number of for votes");
    assert(againstVotes.eq(voter2AgainstVotes), "not a proper number of against votes");

    proposalState = (await governorAlpha.state(latestProposal)).toNumber();
    assert(proposalState === ProposalState.Active, "proposal should be active until the end of voting period");

    await waitForBlock(truffle, votingPeriod.toNumber());

    proposalState = (await governorAlpha.state(latestProposal)).toNumber();
    assert(proposalState === ProposalState.Succeeded, "proposal should be succeeded");

    await governorAlpha.queue(latestProposal);

    proposalState = (await governorAlpha.state(latestProposal)).toNumber();
    assert(proposalState === ProposalState.Queued, "proposal should be queued");

    const delay = timelockDelay.toNumber() * 1000;
    logger.info(`Waiting ${delay / 1000} seconds to surpass delay`);

    await wait(delay, truffle);

    await governorAlpha.execute(latestProposal);

    proposalState = (await governorAlpha.state(latestProposal)).toNumber();
    assert(proposalState === ProposalState.Executed, "proposal should be executed");

    const bassetsList = await basketManager.getBassets();

    assert(bassetsList.includes(newBasset.address), "new basset should be added");

    logger.success("Test Completed!");
}
