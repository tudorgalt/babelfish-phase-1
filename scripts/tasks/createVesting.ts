// createVesting
import Logs from "node-logs";
import { task } from "hardhat/config";
import { getDeployed, setNetwork } from "migrations/utils/state";
import { tokens } from "@utils/tools";
import { FishContract, OrigingVestingCreatorContract, VestingRegistry3Contract } from "types/generated";

const logger = new Logs().showInConsole(true);

const TOKEN_AMOUNT = tokens("10");

const CLIFF = 60 * 60 * 24 * 14 * 2; // TWO WEEKS
const DURATION = 60 * 60 * 24 * 14 * 4;

task("createVesting", "creates Vesting").setAction(async (_, hre) => {
    const { network, artifacts } = hre;
    setNetwork(network.name);
    const [owner] = await hre.getUnnamedAccounts();

    const FishToken: FishContract = await artifacts.require("Fish");
    const VestingRegistry3: VestingRegistry3Contract = artifacts.require("VestingRegistry3");
    const OrigingVestingCreator: OrigingVestingCreatorContract = artifacts.require("OrigingVestingCreator");

    const fishToken = await getDeployed(FishToken, "FishToken");
    const vestingRegistry3 = await getDeployed(VestingRegistry3, "XUSD_VestingRegistry3");
    const origingVestingCreator = await getDeployed(OrigingVestingCreator, "XUSD_OrigingVestingCreator");

    await fishToken.transfer(vestingRegistry3.address, TOKEN_AMOUNT);

    await origingVestingCreator.createVesting(owner, TOKEN_AMOUNT, CLIFF, DURATION);

    logger.success(`Vesting created`);
});
