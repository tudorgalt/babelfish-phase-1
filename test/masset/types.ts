export type Fees = Record<
    | "deposit"
    | "depositBridge"
    | "withdrawal"
    | "withdrawalBridge",
    BN
>;
