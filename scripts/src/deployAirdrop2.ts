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
import { FishInstance, SenderInstance, TableInstance } from "types/generated";
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

    /*
    const token: FishInstance = await conditionalDeploy(FishToken, `FishToken`,
        () => FishToken.new('2982000000000000000000000')
    );
    */

    const token: FishInstance = await FishToken.at('0x055A902303746382FBB7D18f6aE0df56eFDc5213');

    const sender: SenderInstance = await conditionalDeploy(AirdropVester, `Sender`,
        () => AirdropVester.new(tables, token.address)
    );

    //await token.transfer(sender.address, '2982000000000000000000000');

    /*
    // eslint-disable-next-line no-restricted-syntax
    for await (const table of tablesContracts) {
        await table.transferOwnership(sender.address);
    }
    */
};
