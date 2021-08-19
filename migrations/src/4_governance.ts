import Web3 from 'web3';
import { BN } from "@utils/tools";
import { FishInstance, GovernorAlphaInstance, MultiSigWalletInstance, StakingInstance, StakingProxyInstance, TimelockInstance, VestingFactoryInstance, VestingLogicInstance } from "types/generated";
import { conditionalDeploy, conditionalInitialize, printState, setInfo } from "../state";


export default async (
  { artifacts }: { artifacts: Truffle.Artifacts },
  deployer,
  network,
  accounts
): Promise<void> => {
  const [default_] = accounts;

  const web3 = new Web3("http://localhost:7545");

  const FishToken = artifacts.require("Fish");
  const MultiSigWallet = artifacts.require("MultiSigWallet");
  const Staking = artifacts.require("Staking");
  const StakingProxy = artifacts.require("StakingProxy");
  const VestingLogic = artifacts.require("VestingLogic");
  const VestingFactory = artifacts.require("VestingFactory");
  const VestingRegistry3 = artifacts.require("VestingRegistry3");
  const Timelock = artifacts.require("Timelock");
  const GovernorAlpha = artifacts.require("GovernorAlpha");

  const initialAmount = new BN(1000000);
  const timelockDelay = 1;
  const quorumPercentageVotes = 1;
  const majorityPercentageVotes = 20;
  const feeSharingAddress = "0x0000000000000000000000000000000000000001";
  const multiSigWalletOwners = [default_];
  const multiSigWalletRequiredConfirmations = 1;

  const fishToken: FishInstance = await conditionalDeploy(FishToken, `Fish`,
    () => deployer.deploy(FishToken, initialAmount)
  );

  const multiSigWallet: MultiSigWalletInstance = await conditionalDeploy(MultiSigWallet, `MultiSigWallet`,
    () => deployer.deploy(MultiSigWallet, multiSigWalletOwners, multiSigWalletRequiredConfirmations)
  );

  await conditionalInitialize("MultiSigWallet",
    async () => fishToken.transferOwnership(multiSigWallet.address)
  );

  const stakingLogic: StakingInstance = await conditionalDeploy(Staking, `StakingLogic`,
    () => deployer.deploy(Staking)
  );

  const stakingProxy: StakingProxyInstance = await conditionalDeploy(StakingProxy, `StakingProxy`,
    () => deployer.deploy(StakingProxy, fishToken.address)
  );

  await conditionalInitialize("StakingProxy",
    async () => stakingProxy.setImplementation(stakingLogic.address)
  );

  const staking = await Staking.at(stakingProxy.address);

  await conditionalInitialize("Staking",
    async () => staking.setFeeSharing(feeSharingAddress)
  );

  const vestingLogic: VestingLogicInstance = await conditionalDeploy(VestingLogic, `VestingLogic`,
    () => deployer.deploy(VestingLogic)
  );

  const vestingFactory: VestingFactoryInstance = await conditionalDeploy(VestingFactory, `VestingFactory`,
    () => deployer.deploy(VestingFactory, vestingLogic.address)
  );

  await conditionalDeploy(VestingRegistry3, `VestingRegistry3`,
    () => deployer.deploy(VestingRegistry3, vestingFactory.address, fishToken.address, staking.address, feeSharingAddress, multiSigWallet.address)
  );

  const timelock: TimelockInstance = await conditionalDeploy(Timelock, `Timelock`,
    () => deployer.deploy(Timelock, default_, timelockDelay)
  );

  const governorAlpha: GovernorAlphaInstance = await conditionalDeploy(GovernorAlpha, `GovernorAlpha`,
    () => deployer.deploy(GovernorAlpha, timelock.address, staking.address, default_, quorumPercentageVotes, majorityPercentageVotes)
  );

  await conditionalInitialize("GovernorAlpha",
    async () => {
      const recentBlock = await web3.eth.getBlock("latest");
      const blockTimestamp = Number(recentBlock.timestamp) + 1 + timelockDelay;

      const signature = "setPendingAdmin(address)";
      const abiParameters = web3.eth.abi.encodeParameter("address", governorAlpha.address);

      await timelock.queueTransaction(timelock.address, 0, signature, abiParameters, blockTimestamp);

      await setInfo("Timelock", "setAdminEta", blockTimestamp);
      const etaTime = new Date(blockTimestamp * 1000).toString();

      console.log("ETA FOR ADMIN TRANSFER: ", etaTime);
    }
  );

  printState();
};
