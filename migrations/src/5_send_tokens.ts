/* eslint-disable @typescript-eslint/triple-slash-reference,spaced-comment */
/// <reference path="../../types/generated/index.d.ts" />
/// <reference path="../../types/generated/types.d.ts" />

import Web3 from 'web3';
import { BN } from "@utils/tools";
import { FishInstance, GovernorAlphaContract, GovernorAlphaInstance, MultiSigWalletInstance, SenderInstance, StakingInstance, StakingProxyInstance, Table1Instance, TableInstance, TimelockContract, TimelockInstance, VestingFactoryInstance, VestingLogicInstance } from "types/generated";
import { conditionalDeploy, conditionalInitialize, printState, setInfo } from "../state";


export default async (
    { artifacts, web3 }: { artifacts: Truffle.Artifacts, web3: Web3 },
    deployer,
    network,
    accounts
): Promise<void> => {
    const [default_] = accounts;

    const FishToken = artifacts.require("Fish");
    const Sender = artifacts.require("Sender");
    const Table1 = artifacts.require("Table1");
    const Table2 = artifacts.require("Table2");


    const token: FishInstance = await deployer.deploy(FishToken, 10000000);

    const table1: TableInstance = await deployer.deploy(Table1);

    const tables = [
        table1.address
    ];

    const sender: SenderInstance = await deployer.deploy(Sender, tables, token.address, 28, 14);
    await token.mint(sender.address, "100000000000000");
    await sender.sendTokens(20);

    const amount1 = await token.balanceOf("0xf738C8ef6F70C759613A1D21C8535c0Acba15bC2");
    const amount2 = await token.balanceOf("0xfA398c3d2D21DfC5c2399448Ca99D33b2fB7f71e");
    const amount3 = await token.balanceOf("0xFFf923F5a1016E422DdB5D5B7D3Ef8152957D2A5");
    const amount4 = await token.balanceOf("0xeA51CA095a9b296d6e60d2533341568b8AaaE05E");


    const addressAt1 = await sender.addressAtIndex(0);
    console.log({ addressAt1 });

    const amountAt1 = await sender.amountAtIndex(0);
    console.log("amountAt1", amountAt1.toString());

    const addressTEst =  await table1.addresses(0);
    console.log({ addressTEst });


    console.log("AMOUNTS", amount1.toString(), amount2.toString(), amount3.toString(), amount4.toString());
};
