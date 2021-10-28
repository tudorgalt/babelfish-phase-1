import { BasketManagerProxyInstance, BasketManagerV3Instance } from "types/generated";

const Token = artifacts.require("Token");
const BasketManagerV3 = artifacts.require("BasketManagerV3");

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
