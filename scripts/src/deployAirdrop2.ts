/* eslint-disable prefer-destructuring */
/* eslint-disable @typescript-eslint/triple-slash-reference,spaced-comment */
/// <reference path="../../types/generated/index.d.ts" />
/// <reference path="../../types/generated/types.d.ts" />

/* eslint-disable no-await-in-loop */
/* eslint-disable no-plusplus */
/* eslint-disable no-continue */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-restricted-syntax */
import { BN } from "@utils/tools";
import { conditionalDeploy, getDeployed, setNetwork } from "../state";
import { AirdropVesterInstance, FishInstance, SenderInstance, TableInstance } from "types/generated";
import { promises } from "fs";
import Web3 from "web3";

const countTables = async (): Promise<number> => {
    const dir = await promises.readdir("contracts/airDrop/VestingTables", { withFileTypes: true });
    const count = dir.filter(file => file.name.includes("Table_") ).length;
    return count;
};

export default async function main(truffle, networkName): Promise<void> {
    setNetwork(networkName);
    const artifacts: Truffle.Artifacts = truffle.artifacts;
    const web3: Web3 = truffle.web3;

    console.log(1);

    const tablesContracts: TableInstance[] = [];

    const FishToken = artifacts.require("Fish");
    const AirdropVester = artifacts.require("AirdropVester");
    const IVestingRegistry3 = artifacts.require("IVestingRegistry3");

    const vestingRegistry = await IVestingRegistry3.at('0x036ab2DB0a3d1574469a4a7E09887Ed76fB56C41');

    let abi = vestingRegistry.contract.methods['addAdmin(address)']().encodeABI();
    console.log('abi for upgrade: ', abi);

    const numberOfTables = await countTables();

    const tables = [];

    for (let i = 1; i <= numberOfTables; i++) {
        const Name = `Table_${i}`;
        const TableContract = artifacts.require(Name as any);

        const table: TableInstance = await conditionalDeploy(TableContract, `Vesting_${Name}`,
            () => TableContract.new()
        );
        tablesContracts.push(table);
        tables.push(table.address);
    }


    const token: FishInstance = await FishToken.at('0x055A902303746382FBB7D18f6aE0df56eFDc5213');

    const vester: AirdropVesterInstance = await conditionalDeploy(AirdropVester, `AirdropVester`,
        () => AirdropVester.new(tables, token.address)
    );

    let totalGasUsed = 0;

    try {
        while (currentIndex.lt(total)) {
            const { receipt } = await sender.sendTokens(batchSize);
            totalGasUsed += receipt.gasUsed;

            currentIndex = await sender.index();
            console.log(`Sent to ${batchSize} addresses. Index: ${currentIndex.toString()}. Gas used: ${receipt.gasUsed}`);
            let balance = await fishToken.balanceOf(sender.address);
            console.log(`Current balance: ${balance.toString()}`);
        }
    } catch (e) {
        console.log("ERROR");
        console.log(e);
    }

    const finalBalance = await fishToken.balanceOf(sender.address);
    //const expectedBalance = initialBalance.sub(totalValue);

    //assert(finalBalance.eq(expectedBalance), "final balance is not valid");

    console.log(`Sending completed. Total gas used: ${totalGasUsed}`);
};
