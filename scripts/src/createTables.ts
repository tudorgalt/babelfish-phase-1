/* eslint-disable no-plusplus */
/* eslint-disable no-continue */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-restricted-syntax */
import fs, { promises as fsPromises } from "fs";
import Logs from "node-logs";
import readline from "readline";
import Web3 from "web3";

const logger = new Logs().showInConsole(true);

const batchSize = 100;
const fileName = "airdrop_1_final.csv";

const main = async (): Promise<void> => {
    const fileStream = fs.createReadStream(fileName);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let iterator = 1;

    let addresses: string[] = [];
    let values: string[] = [];

    for await (const line of rl) {
        const [address, power] = line.split(",");

        if (!isLineValid(address, power)) {
            continue;
        }

        addresses.push(Web3.utils.toChecksumAddress(address));
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

    uint256 public totalLength;

    constructor () public {
        totalLength = addresses.length;
    }

    function getRecipentInfo(uint256 index) public view returns(address, uint256, bool) {
        return (addresses[index], amounts[index], index == totalLength -1);
    } 

    function getSize() public view returns(uint256 size) {
        return totalLength;
    }

    function destroy() public onlyOwner {
        selfdestruct(msg.sender);
    }
}`;

    await fsPromises.writeFile(`contracts/airDrop/tables/Table_${index}.sol`, buffor);

    logger.info(`Created cotract with ${addresses.length} stakers`);
};

const isLineValid = (address: string, power: string): boolean => {
    if (!address || !power) return false; // ignore empty lines
    if (address === "Address") return false; // ignore header

    return true;
};

export default main;
