/* eslint-disable no-plusplus */
/* eslint-disable no-continue */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-restricted-syntax */
import fs, { promises as fsPromises } from "fs";
import Logs from "node-logs";
import readline from "readline";

const logger = new Logs().showInConsole(true);

type StakerInfo = Record<"address" | "power", string>;


const main = async (): Promise<void> => {
    const fileStream = fs.createReadStream("addressList_joined");
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let iterator = 1;
    const batchSize = 100;

    let addresses: string[] = [];
    let values: string[] = [];

    for await (const line of rl) {
        const [address, power] = line.split(",");

        if (!isLineValid(address, power)) {
            continue;
        }

        addresses.push(address);
        values.push(power);

        if (addresses.length === batchSize) {
            await createContract(addresses, values, iterator);

            iterator++;
            addresses = [];
            values = [];
        }
    }

    if (addresses.length > 0) {
        await createContract(addresses, values, iterator);
    }
};

const createContract = async (addresses: string[], values: string[], index: number): Promise<any> => {
    const buffor = `pragma solidity ^0.5.16;
import { Table } from "../Table.sol";

contract Table_${index} is Table {
    address[] public addresses = [
        ${addresses.join(",\n")}
    ];

    uint256[] public amounts = [
        ${values.join(",\n")}
    ];

    function totalAmount() public view returns(uint256 total) {
        for (uint256 index = 0; index < amounts.length; index ++) {
            total += amounts[index];
        }
    }

    function getSize() public view returns(uint256 size) {
        return addresses.length;
    }
}`;

    await fsPromises.writeFile(`contracts/airDrop/tables/Table_${index}.sol`, buffor);
};

const isLineValid = (address: string, power: string): boolean => {
    if (!address || !power) return false; // ignore empty lines
    if (address === "Address") return false; // ignore header

    return true;
};

export default main;
