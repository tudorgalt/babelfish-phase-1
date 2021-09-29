/* eslint-disable prefer-destructuring */
/* eslint-disable @typescript-eslint/triple-slash-reference,spaced-comment */
/// <reference path="../../types/generated/index.d.ts" />
/// <reference path="../../types/generated/types.d.ts" />

/* eslint-disable no-await-in-loop */
/* eslint-disable no-plusplus */
/* eslint-disable no-continue */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-restricted-syntax */
import BN from "bn.js";
import { conditionalDeploy, getDeployed, setNetwork } from "../state";
import { AirdropVesterInstance, FishInstance, TableInstance } from "types/generated";
import { promises } from "fs";
import Web3 from "web3";

async function countTables() {
    const dir = await promises.readdir("contracts/airDrop/VestingTables", { withFileTypes: true });
    const count = dir.filter(file => file.name.includes("Table_") ).length;
    return count;
};

export default async function main(truffle, networkName): Promise<void> {
    setNetwork(networkName);
    const artifacts: Truffle.Artifacts = truffle.artifacts;
    const web3: Web3 = truffle.web3;

    const address0 = web3.currentProvider['addresses'][0];
    console.log('0: ', address0);


    console.log(1);

    //const MockToken = artifacts.require("MockToken");
    //const token = await await conditionalDeploy(MockToken, "MockToken", () => MockToken.new("test", "test", 18));

    const FishToken = artifacts.require("Fish");
    const token: FishInstance = await FishToken.at('0x055A902303746382FBB7D18f6aE0df56eFDc5213');

    console.log(2);

    const numberOfTables = await countTables();
    const tables = [];
    const tablesContracts: TableInstance[] = [];

    for (let i = 1; i <= numberOfTables; i++) {
        const Name = `Table_${i}`;
        const TableContract = artifacts.require(Name as any);
        const table: TableInstance = await conditionalDeploy(TableContract, `Vesting_${Name}`,
            () => TableContract.new()
        );
        tablesContracts.push(table);
        tables.push(table.address);
    }

    console.log(3);

    const AirdropVester = artifacts.require("AirdropVester");
    const vester: AirdropVesterInstance = await conditionalDeploy(AirdropVester, `AirdropVester`,
        () => AirdropVester.new(tables, token.address)
    );

    console.log(4);

    //await token.mint(vester.address, new BN('2942331958156000000000000'));

    console.log(5);

    let currentIndex = 0;
    const batchSize = 100;

    const totalLength = (await vester.totalLength()).toNumber();
    currentIndex = (await vester.index()).toNumber();
    console.log(`Sending to ${batchSize} addresses from index: ${currentIndex}, total: ${totalLength}`);

    let balance = await token.balanceOf(vester.address);
    console.log(`current balance: ${balance.toString()}`);

    while (true) {
        let [address, amount] = await vester.getCurrent.call();
        console.log(address, amount.toString());
        await vester.sendTokens.sendTransaction(batchSize);
        currentIndex = (await vester.index()).toNumber();
        console.log(`Sent to ${batchSize} addresses. New index: ${currentIndex}`);
        if(currentIndex >= totalLength) break;
    }

    balance = await token.balanceOf(vester.address);
    console.log(`current balance: ${balance.toString()}`);

    console.log(6);
};
