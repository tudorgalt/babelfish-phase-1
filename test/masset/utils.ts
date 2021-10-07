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

export const RATIO_PRECISION = 1000;

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

export const SLOPE = new BN(400);
export const SLOPE_PRECISION = new BN(1000);
export const DEVIATION_PRECISION = new BN(1000);

// const calculateDeviation = (targetRatios: number[], ratios: number[]) => {

// }

export const calculateValue = (deviation: number, total: number) => {
    const c = SLOPE.toNumber() / SLOPE_PRECISION.toNumber();
    const preciseDeviation = deviation / DEVIATION_PRECISION.toNumber();

    const denominator = 1 - preciseDeviation;
    const nominator = c * total * preciseDeviation;

    return Math.floor(nominator / denominator);
};

export const calculateReward = (deviation: number, deviationAfter: number, total: number, totalAfter: number) => {
    const value = calculateValue(deviation, total);
    const valueAfter = calculateValue(deviationAfter, totalAfter);

    return valueAfter - value;
};
