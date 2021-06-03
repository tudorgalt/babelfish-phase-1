/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable spaced-comment */
/* eslint-disable @typescript-eslint/triple-slash-reference,spaced-comment */
/// <reference path="../../types/generated/index.d.ts" />
/// <reference path="../../types/generated/types.d.ts" />

import state from "../state";
import ADDRESSES from '../addresses';

class BassetIntegrationDetails {
    bAssets: Array<string>;

    factors: Array<number>;
}

export default async ({ artifacts }: { artifacts: Truffle.Artifacts },
    deployer, network, accounts): Promise<void> => {

    const c_Token = artifacts.require("Token");
    const c_BasketManager = artifacts.require("BasketManager");
    const c_Masset = artifacts.require("Masset");
    const c_MassetProxy = artifacts.require("MassetProxy");
    const c_TokenProxy = artifacts.require("TokenProxy");

    const [default_] = accounts;
    const addresses = ADDRESSES[network];

    console.log(1);

    const d_Token = await state.conditionalDeploy(c_Token, 'Token',
        () => c_Token.new('XUSD','XUSD', 18));

    console.log(2);

    const d_TokenProxy = await state.conditionalDeploy(c_TokenProxy, 'TokenProxy',
        () => c_Token.new(d_Token.address, default_));

    console.log(3);

    const d_Masset = await state.conditionalDeploy(c_Masset, 'Masset',
        () => deployer.deploy(c_Masset));

    console.log(4);

    const d_MassetProxy = await state.conditionalDeploy(c_MassetProxy, 'MassetProxy',
        () => deployer.deploy(c_MassetProxy));

    console.log(5);

    if (await d_TokenProxy.owner() !== d_MassetProxy.address) {
        await d_TokenProxy.transferOwnership(d_MassetProxy.address);
    }

    console.log(6);

    const d_BasketManager = await state.conditionalDeploy(c_BasketManager, 'BasketManager',
        () => c_BasketManager.new(addresses.bassets, addresses.factors, addresses.bridges));

    console.log(7);

    const initData: string = d_Masset.contract.methods
        .initialize(
            d_BasketManager.address,
            d_TokenProxy.address,
            deployer.network !== 'development').encodeABI();
    await state.conditionalInitialize('MassetProxy', () => {
        return d_MassetProxy.methods["initialize(address,address,bytes)"](
            d_Masset.address,
            default_,
            initData,
        );
    });

    state.printState();
};
