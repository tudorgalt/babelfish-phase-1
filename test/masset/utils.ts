/* eslint-disable no-plusplus */
import { BN } from "@utils/tools";
import { BasketManagerProxyInstance, BasketManagerV3Instance, BasketManagerV4Instance } from "types/generated";

const Token = artifacts.require("Token");
const BasketManagerV3 = artifacts.require("BasketManagerV3");
const BasketManagerV4 = artifacts.require("BasketManagerV4");

export const createToken = async (massetAddress: string) => {
    const token = await Token.new("Mock1", "MK1", 18);
    token.transferOwnership(massetAddress);
    return token;
};

export type CreateBasketV3Args = {
    admin: string,
    massetAddress: string,
    txDetails?: Truffle.TransactionDetails
};

export type UpgradeBasketToV4Args = Omit<CreateBasketV3Args, 'massetAddress'>;

export const RATIO_PRECISION = new BN(10 ** 10);

export const createBasketManagerV3 = async (
    proxy: BasketManagerProxyInstance,
    config: CreateBasketV3Args
): Promise<BasketManagerV3Instance> => {
    const { admin, massetAddress, txDetails } = config;

    const basketManagerV3 = await BasketManagerV3.new(txDetails);

    const initV3Abi: string = basketManagerV3.contract.methods['initialize(address)'](massetAddress).encodeABI();
    await proxy.methods["initialize(address,address,bytes)"](basketManagerV3.address, admin, initV3Abi);

    const basketManagerV3Mock = await BasketManagerV3.at(proxy.address);

    return basketManagerV3Mock;
};

export const upgradeBasketManagerToV4 = async (
    proxy: BasketManagerProxyInstance,
    config: UpgradeBasketToV4Args,
    ratios: Parameters<BasketManagerV4Instance['initialize']>[0] = []
): Promise<BasketManagerV4Instance> => {
    const { admin, txDetails } = config;

    const basketManagerV4 = await BasketManagerV4.new(txDetails);

    await proxy.upgradeTo(basketManagerV4.address, { from: admin });

    const basketManagerV4Mock = await BasketManagerV4.at(proxy.address);
    await basketManagerV4Mock.initialize(ratios, RATIO_PRECISION);

    return basketManagerV4Mock;
};

export const SLOPE = new BN(900);
export const SLOPE_PRECISION = new BN(1000);

export const calculateDeviation = (targetRatios: BN[], assets: BN[]) => {
    let sum = new BN(0);
    const total = assets.reduce((prev, curr) => prev.add(curr), new BN(0));

    for (let i = 0; i < assets.length; i++) {
        const asssetAmount = assets[i];
        const ratio = asssetAmount.mul(RATIO_PRECISION).div(total);

        const target = targetRatios[i].mul(RATIO_PRECISION).div(new BN(1000));

        const deviation = target.sub(ratio);
        sum = sum.add(deviation.mul(deviation));
    }

    const deviation = sum.div(new BN(targetRatios.length)).div(RATIO_PRECISION);

    return { total, deviation };
};

export const calculateValue = (deviation: BN, total: BN) => {
    const denominator = RATIO_PRECISION.sub(deviation);
    const nominator = SLOPE.mul(total).mul(deviation);

    const value = nominator.div(denominator).div(SLOPE_PRECISION);

    return value;
};

export const calculateReward = (deviation: BN, deviationAfter: BN, total: BN, totalAfter: BN) => {
    const value = calculateValue(deviation, total);
    const valueAfter = calculateValue(deviationAfter, totalAfter);

    return valueAfter.sub(value).neg();
};
