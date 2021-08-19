import { ZERO_ADDRESS } from "@utils/constants";
import { BasketManagerV3Instance, FishInstance, GovernorAlphaInstance, MassetV3Instance, StakingInstance } from "types/generated";
import Web3 from "web3";
import { getDeployed, getInfo, setNetwork } from "../../migrations/state";

enum ProposalState { Pending, Active, Canceled, Defeated, Succeeded, Queued, Expired, Executed }

export default async function e2e(truffle, networkName: string): Promise<void> {
    const web3: Web3 = truffle.web3;
    const artifacts: Truffle.Artifacts = truffle.artifacts;

    const defaultAccount = (await web3.eth.getAccounts())[0];

    setNetwork(networkName);

    const BasketManagerV3 = artifacts.require("BasketManagerV3");
    const GovernorAlpha = artifacts.require("GovernorAlpha");
    const Staking = artifacts.require("Staking");
    const Fish = artifacts.require("Fish");

    const MassetV3 = artifacts.require("MassetV3");

    const governorAlpha: GovernorAlphaInstance = await getDeployed(GovernorAlpha, `GovernorAlpha`);
    const basketManager: BasketManagerV3Instance = await getDeployed(BasketManagerV3, `XUSD_BasketManagerProxy`);
    const staking: StakingInstance = await getDeployed(Staking, `StakingProxy`);
    const fish: FishInstance = await getDeployed(Fish, `Fish`);

    const stakeAddress: string = await getInfo("StakingProxy", "address");
    const basketManagerAddress: string = await getInfo("XUSD_BasketManagerProxy", "address");

    const [basset] = await basketManager.getBassets();

    const stakeAmount = 1000000;
    const stakeUntilDate = Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7 * 3);

    await fish.approve(stakeAddress, stakeAmount);
    await staking.stake(stakeAmount, stakeUntilDate, ZERO_ADDRESS, ZERO_ADDRESS);

    const targets = [basketManagerAddress];
    const values = [0];
    const signatures = ["setPaused(address,bool)"];
    const calldatas = [web3.eth.abi.encodeParameters(["address", "bool"], [basset, true])];

    // await governorAlpha.propose(targets, values, signatures, calldatas, "test propsal");

    const latestProposal = await governorAlpha.latestProposalIds(defaultAccount);

    let proposalState = await governorAlpha.state(latestProposal);

    console.log({
        latestProposal: latestProposal.toString(),
        proposalState: proposalState.toString()
    });

    // await new Promise((resolve) => truffle.setTimeout(resolve, 2000));

    // await governorAlpha.castVote(latestProposal, true);

    // return;

    proposalState = await governorAlpha.state(latestProposal);
    console.log("proposalState", proposalState.toString());

    await governorAlpha.queue(latestProposal);

    proposalState = await governorAlpha.state(latestProposal);
    console.log("proposalState", proposalState.toString());

    await governorAlpha.execute(latestProposal);
    proposalState = await governorAlpha.state(latestProposal);
    console.log("proposalState", proposalState.toString());

    const paused = await basketManager.getPaused(basset);
    console.log({ paused });
}
