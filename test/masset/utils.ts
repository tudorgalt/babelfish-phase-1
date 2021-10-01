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
    await basketManagerV4Mock.initialize(ratios);

    return basketManagerV4Mock;
};

export const A_CURVE_DENOMINATOR = new BN(1000);

export const calculateCurve = (deviation: BN, aDeniminator = A_CURVE_DENOMINATOR) => {
    return deviation.pow(new BN(3)).div(new BN(3)).div(aDeniminator);
};
