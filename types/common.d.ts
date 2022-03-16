export type Address = string;
export type Bytes32 = string;

export type Fees = Record<
    | "withdrawal"
    | "withdrawalBridge",
    BN
>;
