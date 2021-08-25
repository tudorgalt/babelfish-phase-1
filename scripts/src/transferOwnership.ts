import { BasketManagerV3Instance, MassetV3Instance } from "types/generated";
import { getDeployed, getInfo, setNetwork } from "../../migrations/state";

export default async function transferOwnership(truffle, networkName: string): Promise<void> {
    setNetwork(networkName);

    const artifacts: Truffle.Artifacts = truffle.artifacts;

    const BasketManagerV3 = artifacts.require("BasketManagerV3");
    const MassetV3 = artifacts.require("MassetV3");

    const timelockAddress: string = await getInfo("Timelock", "address");

    async function transferForSymbol(symbol: string): Promise<void> {
        const masset: MassetV3Instance = await getDeployed(MassetV3, `${symbol}_MassetProxy`);
        const basketManager: BasketManagerV3Instance = await getDeployed(BasketManagerV3, `${symbol}_BasketManagerProxy`);

        await masset.transferOwnership(timelockAddress);
        await basketManager.transferOwnership(timelockAddress);
    }

    await transferForSymbol('XUSD');
    await transferForSymbol('ETHs');
    await transferForSymbol('BNBs');
}
