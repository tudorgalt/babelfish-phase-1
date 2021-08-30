/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-plusplus */
/* eslint-disable @typescript-eslint/triple-slash-reference,spaced-comment */
/// <reference path="../../types/generated/index.d.ts" />
/// <reference path="../../types/generated/types.d.ts" />

import Web3 from 'web3';
import { toWei } from 'web3-utils';
import fs, { promises } from "fs";
import { BN } from "@utils/tools";
import { FishInstance, SenderInstance, TableInstance } from "types/generated";
import { conditionalDeploy } from 'migrations/state';

const tokens = (amount: string | number): BN => toWei(new BN(amount), 'ether');

export default async (
    { artifacts, web3 }: { artifacts: Truffle.Artifacts, web3: Web3 },
    deployer,
    network,
    accounts
): Promise<void> => {
    const [default_] = accounts;

    const tablesContracts: TableInstance[] = [];

    const FishToken = artifacts.require("Fish");
    const Sender = artifacts.require("Sender");

    const numberOfTables = await countTables();

    const tables = [];

    for (let i = 1; i <= numberOfTables; i++) {
        const Name = `Table_${i}`;
        const TableContract = artifacts.require(Name as any);

        const table: TableInstance = await conditionalDeploy(TableContract, Name,
            () => deployer.deploy(TableContract)
        );
        tablesContracts.push(table);
        tables.push(table.address);
    }

    const token: FishInstance = await conditionalDeploy(FishToken, `FishToken`,
        () => deployer.deploy(FishToken, tokens("1000000000000000000"))
    );

    const sender: SenderInstance = await conditionalDeploy(Sender, `Sender`,
        () => deployer.deploy(Sender, tables, token.address)
    );
    await token.mint(sender.address, tokens("1000000000000000000"));

    // eslint-disable-next-line no-restricted-syntax
    for await (const table of tablesContracts) {
        await table.transferOwnership(sender.address);
    }
};

const countTables = async (): Promise<number> => {
    const dir = await promises.readdir("contracts/airDrop/tables", { withFileTypes: true });
    const count = dir.filter(file => file.name.includes("Table_") ).length;

    return count;
};
