/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable spaced-comment */
/* eslint-disable @typescript-eslint/triple-slash-reference,spaced-comment */
/// <reference path="../../types/generated/index.d.ts" />
/// <reference path="../../types/generated/types.d.ts" />

import state from "../state";
import addresses from '../addresses';

class BassetInstanceDetails {
    bassets: Array<string>;
    factors: Array<number>;
    bridges: Array<string>;
    multisig: string;
}

export default async (
    { artifacts }: { artifacts: Truffle.Artifacts },
    deployer, network, accounts): Promise<void> => {

    const c_Token = artifacts.require("Token");
    const c_BasketManager = artifacts.require("BasketManager");
    const c_Masset = artifacts.require("Masset");
    const c_MassetProxy = artifacts.require("MassetProxy");

    const [default_] = accounts;
    const addressesForNetwork = addresses[deployer.network];

    async function deployInstance(symbol: string, addressesForInstance: BassetInstanceDetails) {

        const d_Token = await state.conditionalDeploy(c_Token, `${symbol}_Token`,
            () => deployer.deploy(c_Token, symbol, symbol, 18));

        const d_Masset = await state.conditionalDeploy(c_Masset, `${symbol}_Masset`,
            () => deployer.deploy(c_Masset, { from: default_ }));

        const d_MassetProxy = await state.conditionalDeploy(c_MassetProxy, `${symbol}_MassetProxy`,
            () => deployer.deploy(c_MassetProxy));

        if (await d_Token.owner() !== d_MassetProxy.address) {
            await d_Token.transferOwnership(d_MassetProxy.address);
        }

        const d_BasketManager = await state.conditionalDeploy(c_BasketManager, `${symbol}_BasketManager`,
            () => deployer.deploy(c_BasketManager, addressesForInstance.bassets, addressesForInstance.factors, addressesForInstance.bridges));

        const initdata: string = d_Masset.contract.methods
            .initialize(
                d_BasketManager.address,
                d_Token.address,
                deployer.network !== 'development').encodeABI();
        await state.conditionalInitialize('MassetProxy', () => {
            return d_MassetProxy.methods["initialize(address,address,bytes)"](
                d_Masset.address,
                addressesForInstance.multisig,
                initdata,
            );
        });
    }

    await deployInstance('ETHs', addressesForNetwork['ETHs']);
    await deployInstance('XUSD', addressesForNetwork['XUSD']);
    await deployInstance('BNBs', addressesForNetwork['BNBs']);

    state.printState();
};
