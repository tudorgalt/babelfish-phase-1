import { conditionalDeploy, conditionalInitialize, getDeployed, printState, setAddress } from "../state";
import addresses from '../addresses';
import { ZERO_ADDRESS } from "@utils/constants";

const MAX_VALUE = 1000;

class BassetInstanceDetails {
    bassets: Array<string>;
    factors: Array<number>;
    bridges: Array<string>;
    multisig: string;
}

export default async (
    { artifacts }: { artifacts: Truffle.Artifacts },
    deployer, network, accounts): Promise<void> => {

    const BasketManagerV3 = artifacts.require("BasketManagerV3");
    const BasketManagerProxy = artifacts.require("BasketManagerProxy");

    const MassetV3 = artifacts.require("MassetV3");
    const MassetProxy = artifacts.require("MassetProxy");

    const [default_, _admin] = accounts;
    const addressesForNetwork = addresses[deployer.network];

    async function upgradeInstance(symbol: string, addressesForInstance: BassetInstanceDetails) {

        const massetFake = await getDeployed(MassetV3, `${symbol}_MassetProxy`);
        const massetVersion =  await massetFake.getVersion();
        console.log(symbol, ' Masset version: ', massetVersion);
        if (massetVersion >= '3.0') {
            console.log('Skipping...');
            return;
        }

        const tokenAddress = await massetFake.getToken();

        const basketManager = await conditionalDeploy(BasketManagerV3, `${symbol}_BasketManagerV3`,
            () => deployer.deploy(BasketManagerV3));

        const basketManagerProxy = await conditionalDeploy(BasketManagerProxy, `${symbol}_BasketManagerProxy`,
            () => deployer.deploy(BasketManagerProxy));

        const initAbi = basketManager.contract.methods['initialize(address)'](massetFake.address).encodeABI();
        await conditionalInitialize(`${symbol}_BasketManagerProxy`,
    async () => basketManagerProxy.initialize(basketManager.address, _admin, initAbi));

        const basketManagerFake = await BasketManagerV3.at(basketManagerProxy.address);

        if (network === 'development') {
            const ERC20 = artifacts.require("ERC20");
            addressesForInstance.bassets = [(await ERC20.new()).address, (await ERC20.new()).address, (await ERC20.new()).address];
            addressesForInstance.factors = [1, 1, 1];
            addressesForInstance.bridges = [ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS];
        }

        let currentAdmin;
        try {
            currentAdmin = await basketManagerProxy.admin.call({ from: _admin });
        } catch(e) { console.log(e) }
        let promises: Array<Promise<any>> = [];
        if (currentAdmin === _admin) {
            const existingAssets = await basketManagerFake.getBassets();
            const addAsset = (index) => {
                console.log('adding asset: ',
                    addressesForInstance.bassets[index],
                    addressesForInstance.factors[index],
                    addressesForInstance.bridges[index]);
                promises.push(basketManagerFake.addBasset(
                    addressesForInstance.bassets[index],
                    addressesForInstance.factors[index],
                    addressesForInstance.bridges[index], 0, MAX_VALUE));
            };

            for(let i=0; i<addressesForInstance.bassets.length; i++) {
                if (!existingAssets.find(ta => ta === addressesForInstance.bassets[i])) {
                    addAsset(i);
                }
            }

            await Promise.all(promises);

            if (network !== 'development') {
                if (await basketManagerFake.isOwner()) {
                    await basketManagerFake.transferOwnership(addressesForInstance.multisig);
                }
                await basketManagerProxy.changeAdmin(addressesForInstance.multisig, { from: _admin });
            }
        }

        const masset = await conditionalDeploy(MassetV3, `${symbol}_MassetV3`,
            () => deployer.deploy(MassetV3));

        const abiInner = masset.contract.methods['upgradeToV3(address,address)'](basketManager.address, tokenAddress).encodeABI();
        const massetProxy = await MassetProxy.at(massetFake.address);
        const abi = massetProxy.contract.methods['upgradeToAndCall(address,bytes)'](masset.address, abiInner).encodeABI();
        console.log('ABI for upgrade: ', abi);
    }

    await upgradeInstance('ETHs', addressesForNetwork.ETHs);
    await upgradeInstance('XUSD', addressesForNetwork.XUSD);
    await upgradeInstance('BNBs', addressesForNetwork.BNBs);

    printState();
};
