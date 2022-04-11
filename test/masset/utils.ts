import { BasketManagerV4Instance } from "types/generated";

const Token = artifacts.require("Token");
const BasketManagerV4 = artifacts.require("BasketManagerV4");

export const createToken = async (massetAddress: string) => {
    const token = await Token.new("Mock1", "MK1", 18);
    token.transferOwnership(massetAddress);
    return token;
};

export type CreateBasketV4Args = {
    massetAddress: string,
    txDetails?: Truffle.TransactionDetails
};

export type UpgradeBasketToV4Args = Omit<CreateBasketV4Args, 'massetAddress'>;

export const RATIO_PRECISION = 1000;

export const createBasketManagerV4 = async (
    config: CreateBasketV4Args
): Promise<BasketManagerV4Instance> => {
    const { massetAddress, txDetails } = config;

    const basketManagerV4 = await BasketManagerV4.new(txDetails);
    await basketManagerV4.initialize(massetAddress);

    return basketManagerV4;
};
