import Truffle from 'truffle';
import Web3 from 'web3';

import { getDeployed, getInfo, setNetwork } from "../../migrations/state";

export default async function getVersions(truffle: Truffle, networkName: string): Promise<void> {
    setNetwork(networkName);
    const web3 = new Web3("http://localhost:7545");

    const artifacts: Truffle.Artifacts = truffle.artifacts;

    const Timelock = artifacts.require("Timelock");
    const GovernorAlpha = artifacts.require("GovernorAlpha");

    const timelock = await getDeployed(Timelock, "Timelock");
    const governorAlpha = await getDeployed(GovernorAlpha, "GovernorAlpha");

    const eta = await getInfo("Timelock", "setAdminEta");
    const currentTime = Date.now() / 1000;

    if (eta > currentTime) {
        const etaTime = new Date(eta * 1000).toString();
        console.error("Invalid time for transfering admin. ETA FOR ADMIN TRANSFER: ", etaTime);
    }

    const signature = "setPendingAdmin(address)";
    const abiParameters = web3.eth.abi.encodeParameter("address", governorAlpha.address);

    await timelock.executeTransaction(timelock.address, 0, signature, abiParameters, eta);

    const pendingAdmin = await timelock.pendingAdmin();
    console.log({ pendingAdmin, governor: governorAlpha.address });
    // eslint-disable-next-line no-underscore-dangle
    await governorAlpha.__acceptAdmin();
    const admin = await timelock.admin();
    console.log({ admin, governor: governorAlpha.address });
}
