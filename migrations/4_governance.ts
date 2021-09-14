import Logs from 'node-logs';
import { BN } from "@utils/tools";
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import {
    FishContract,
    TimelockContract,
    StakingProxyContract,
    GovernorAlphaContract,
    VestingFactoryContract,
    MultiSigWalletContract,
    VestingRegistry3Contract
} from "types/generated";
import {
    setInfo,
    printState,
    setNetwork,
    conditionalDeploy,
    conditionalInitialize,
    contractConstructorArgs
} from "./utils/state";
import { isDevelopmentNetwork } from './utils/addresses';
import { DeploymentTags } from './utils/DeploymentTags';

const FishToken = artifacts.require("Fish");
const MultiSigWallet = artifacts.require("MultiSigWallet");
const Staking = artifacts.require("Staking");
const StakingProxy = artifacts.require("StakingProxy");
const VestingLogic = artifacts.require("VestingLogic");
const VestingFactory = artifacts.require("VestingFactory");
const VestingRegistry3 = artifacts.require("VestingRegistry3");
const Timelock = artifacts.require("Timelock");
const TimelockMock = artifacts.require("TimelockMock");
const GovernorAlpha = artifacts.require("GovernorAlpha");
const GovernorAlphaMock = artifacts.require("GovernorAlphaMock");

const logger = new Logs().showInConsole(true);

const deployFunc = async ({ network, deployments, getUnnamedAccounts, web3 }: HardhatRuntimeEnvironment) => {
    logger.info("Starting governance migration");
    setNetwork(network.name);

    const { deploy } = deployments;
    const [default_] = await getUnnamedAccounts();

    const initialAmount = new BN(1000000000).toString(); // DO SOMETHING WITH BIGNUMBER
    const quorumPercentageVotes = 1;
    const majorityPercentageVotes = 20;
    const feeSharingAddress = "0x0000000000000000000000000000000000000001";
    const multiSigWalletOwners = [default_];
    const multiSigWalletRequiredConfirmations = 1;

    const fishArgs = contractConstructorArgs<FishContract>(initialAmount);
    const fishToken = await conditionalDeploy({
        contract: FishToken,
        key: "FishToken",
        deployfunc: deploy,
        deployOptions: { from: default_, args: fishArgs }
    });

    const multiSigArgs = contractConstructorArgs<MultiSigWalletContract>(multiSigWalletOwners, multiSigWalletRequiredConfirmations);
    const multiSigWallet = await conditionalDeploy({
        contract: MultiSigWallet,
        key: "MultiSigWallet",
        deployfunc: deploy,
        deployOptions: { from: default_, args: multiSigArgs }
    });

    await conditionalInitialize("MultiSigWallet",
        async () => { await fishToken.transferOwnership(multiSigWallet.address); }
    );

    const stakingLogic = await conditionalDeploy({
        contract: Staking,
        key: "StakingLogic",
        deployfunc: deploy,
        deployOptions: { from: default_ }
    });

    const stakingProxyArgs = contractConstructorArgs<StakingProxyContract>(fishToken.address);
    const stakingProxy = await conditionalDeploy({
        contract: StakingProxy,
        key: "StakingProxy",
        deployfunc: deploy,
        deployOptions: { from: default_, args: stakingProxyArgs }
    });

    await conditionalInitialize("StakingProxy",
        async () => { await stakingProxy.setImplementation(stakingLogic.address); }
    );

    const staking = await Staking.at(stakingProxy.address);

    await conditionalInitialize("Staking",
        async () => { await staking.setFeeSharing(feeSharingAddress); }
    );

    const vestingLogic = await conditionalDeploy({
        contract: VestingLogic,
        key: "VestingLogic",
        deployfunc: deploy,
        deployOptions: { from: default_ }
    });

    const vestingFactoryArgs = contractConstructorArgs<VestingFactoryContract>(vestingLogic.address);
    const vestingFactory = await conditionalDeploy({
        contract: VestingFactory,
        key: "VestingFactory",
        deployfunc: deploy,
        deployOptions: { from: default_, args: vestingFactoryArgs }
    });

    const vestingRegistryArgs = contractConstructorArgs<VestingRegistry3Contract>(
        vestingFactory.address,
        fishToken.address,
        staking.address,
        feeSharingAddress,
        multiSigWallet.address
    );
    await conditionalDeploy({
        contract: VestingRegistry3,
        key: "VestingRegistry3",
        deployfunc: deploy,
        deployOptions: { from: default_, args: vestingRegistryArgs }
    });

    let timelockContract: TimelockContract;

    let timelockDelay: number;
    if (isDevelopmentNetwork(network.name)) {
        timelockContract = TimelockMock;
        timelockDelay = 50;
    } else {
        timelockContract = Timelock;
        timelockDelay = 3 * 60 * 60;
    }

    const timelockArgs = contractConstructorArgs<TimelockContract>(default_, timelockDelay);
    const timelock = await conditionalDeploy({
        contract: timelockContract,
        key: "Timelock",
        deployfunc: deploy,
        deployOptions: { from: default_, args: timelockArgs }
    });

    let governorAlphaContract: GovernorAlphaContract;

    if (isDevelopmentNetwork(network.name)) {
        governorAlphaContract = GovernorAlphaMock;
    } else {
        governorAlphaContract = GovernorAlpha;
    }

    const governorAlphaArgs = contractConstructorArgs<GovernorAlphaContract>(
        timelock.address,
        staking.address,
        default_,
        quorumPercentageVotes,
        majorityPercentageVotes
    );
    const governorAlpha = await conditionalDeploy({
        contract: governorAlphaContract,
        key: "GovernorAlpha",
        deployfunc: deploy,
        deployOptions: { from: default_, args: governorAlphaArgs }
    });

    await conditionalInitialize("GovernorAlpha",
        async () => {
            const recentBlock = await web3.eth.getBlock("latest");
            const blockTimestamp = Number(recentBlock.timestamp) + timelockDelay + 30;

            const signature = "setPendingAdmin(address)";
            const abiParameters = web3.eth.abi.encodeParameter("address", governorAlpha.address);

            await timelock.queueTransaction(timelock.address, 0, signature, abiParameters, blockTimestamp);

            await setInfo("Timelock", "setAdminEta", blockTimestamp);
            const etaTime = new Date(blockTimestamp * 1000).toString();

            logger.warn(`Eta for admin: ${etaTime}`);
        }
    );

    logger.success("Migration completed");
    printState();
};

deployFunc.tags = [
    DeploymentTags.Governance
];

export default deployFunc;
