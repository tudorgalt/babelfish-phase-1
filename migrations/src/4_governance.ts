import Web3 from 'web3';
import addresses from '../addresses';
import { BN } from "@utils/tools";
import { FishInstance, GovernorAlphaInstance, MultiSigWalletInstance, StakingInstance, StakingProxyInstance, TimelockInstance, VestingFactoryInstance, VestingLogicInstance, VestingRegistry3Instance } from "types/generated";
import { conditionalDeploy, conditionalInitialize, getDeployed, printState } from "../state";


export default async (
  { artifacts }: { artifacts: Truffle.Artifacts },
  deployer,
  network,
  accounts
): Promise<void> => {
  const [default_, _admin] = accounts;
  const addressesForNetwork = addresses[network];

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

  const fishToken: FishInstance = await conditionalDeploy(FishToken, `Fish`,
    () => deployer.deploy(FishToken, initialAmount)
  );

  const multiSigWalletOwners = [default_];
  const multiSigWalletRequiredConfirmations = 1;

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

  const feeSharingAddress = "0x0000000000000000000000000000000000000001";

  await conditionalInitialize("Staking",
    async () => staking.setFeeSharing(feeSharingAddress)
  );

  const vestingLogic: VestingLogicInstance = await conditionalDeploy(VestingLogic, `VestingLogic`,
    () => deployer.deploy(VestingLogic)
  );

  const vestingFactory: VestingFactoryInstance = await conditionalDeploy(VestingFactory, `VestingFactory`,
    () => deployer.deploy(VestingFactory, vestingLogic.address)
  );

  const vestingRegistry: VestingRegistry3Instance = await conditionalDeploy(VestingRegistry3, `VestingRegistry3`,
    () => deployer.deploy(VestingRegistry3, vestingFactory.address, fishToken.address, staking.address, feeSharingAddress, multiSigWallet.address)
  );

  const timelockDelay = 1;

  const timelock: TimelockInstance = await conditionalDeploy(Timelock, `Timelock`,
    () => deployer.deploy(Timelock, default_, timelockDelay)
  );

  // address timelock_,
  // address staking_,
  // address guardian_,
  // uint96 _quorumPercentageVotes,
  // uint96 _majorityPercentageVotes

  const quorumPercentageVotes = 1;
  const majorityPercentageVotes = 20;

  const governorAlpha: GovernorAlphaInstance = await conditionalDeploy(GovernorAlpha, `GovernorAlpha`,
    () => deployer.deploy(GovernorAlpha, timelock.address, staking.address, default_, quorumPercentageVotes, majorityPercentageVotes)
  );

  await conditionalInitialize("GovernorAlpha",
    async () => {
      // await governorAlpha.__queueSetTimelockPendingAdmin(governorAlpha.address, 0);
      // await governorAlpha.__executeSetTimelockPendingAdmin(governorAlpha.address, 0);
      const recentBlock = await web3.eth.getBlock("latest");
      const blockTimestamp = Number(recentBlock.timestamp) + 1 + timelockDelay;

      console.log({ blockTimestamp });
      const signature = "setPendingAdmin(address)";
      const abiParameters = web3.eth.abi.encodeParameter("address", governorAlpha.address);

      await timelock.queueTransaction(timelock.address, 0, signature, abiParameters, blockTimestamp);
      // DELAY !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      await timelock.executeTransaction(timelock.address, 0, signature, abiParameters, blockTimestamp);

      const pendingAdmin = await timelock.pendingAdmin();
      console.log({ pendingAdmin, governor: governorAlpha.address });

      // eslint-disable-next-line no-underscore-dangle
      await governorAlpha.__acceptAdmin();

      const admin = await timelock.admin();
      console.log({ admin, governor: governorAlpha.address });
    }
  );

  // __queueSetTimelockPendingAdmin

  printState();
};
