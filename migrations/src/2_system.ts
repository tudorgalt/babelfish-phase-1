import { conditionalDeploy, conditionalInitialize, printState } from "../state";
import addresses, { BassetInstanceDetails } from '../addresses';

export default async (
    { artifacts }: { artifacts: Truffle.Artifacts },
    deployer, network, accounts): Promise<void> => {

    const cToken = artifacts.require("Token");
    const cBasketManager = artifacts.require("BasketManager");
    const cMasset = artifacts.require("Masset");
    const cMassetProxy = artifacts.require("MassetProxy");

    const [default_, _admin] = accounts;
    const addressesForNetwork = addresses[deployer.network];

    async function deployInstance(symbol: string, addressesForInstance: BassetInstanceDetails) {

        const dToken = await conditionalDeploy(cToken, `${symbol}_Token`,
            () => deployer.deploy(cToken, symbol, symbol, 18));

        const dMasset = await conditionalDeploy(cMasset, `${symbol}_Masset`,
            () => deployer.deploy(cMasset, { from: default_ }));

        const dMassetProxy = await conditionalDeploy(cMassetProxy, `${symbol}_MassetProxy`,
            () => deployer.deploy(cMassetProxy));

        if (await dToken.owner() !== dMassetProxy.address) {
            await dToken.transferOwnership(dMassetProxy.address);
        }

        if(deployer.network === 'development') {
            const mockToken = await deployer.deploy(cToken, 'MOCK', 'MOCK', 18);
            addressesForInstance.bassets = [ mockToken.address ];
            addressesForInstance.factors = [ 1 ];
            addressesForInstance.bridges = [ '0x0000000000000000000000000000000000000000' ];
        }

        const dBasketManager = await conditionalDeploy(cBasketManager, `${symbol}_BasketManager`,
            () => deployer.deploy(cBasketManager, addressesForInstance.bassets, addressesForInstance.factors, addressesForInstance.bridges));

        const initdata: string = dMasset.contract.methods
            .initialize(
                dBasketManager.address,
                dToken.address,
                deployer.network !== 'development').encodeABI();
        await conditionalInitialize(`${symbol}_MassetProxy`, () => {
            return dMassetProxy.methods["initialize(address,address,bytes)"](
                dMasset.address,
                deployer.network !== 'development' ? addressesForInstance.multisig : _admin,
                initdata,
            );
        });
    }

    await deployInstance('ETHs', addressesForNetwork.ETHs);
    await deployInstance('XUSD', addressesForNetwork.XUSD);
    await deployInstance('BNBs', addressesForNetwork.BNBs);

    printState();
};
