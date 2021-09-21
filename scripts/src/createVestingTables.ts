/* eslint-disable no-plusplus */
/* eslint-disable no-continue */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-restricted-syntax */
import fs, { promises as fsPromises } from "fs";
import readline from "readline";
import Web3 from "web3";
import BN from "bn.js";

const precision = new BN(10).pow(new BN(18));
const totalFish = new BN('420000000').mul(precision);

const batchSize = 100;
const fileName = "airdrop_1_final_fixed.csv";

export default async function main(): Promise<void> {

    const map = await readAirdrop2();

    let addresses = Object.keys(map);

    console.log("Starting...");

    const batch = [];
    const amounts = [];
    let tableNumber = 1;
    let totalAmount = new BN(0);

    for (let index = 0; index < addresses.length; index++) {

        const address = addresses[index];
        const amount = map[address];

        console.log(`${address},${amount.toString()}`);

        batch.push(Web3.utils.toChecksumAddress(address));
        amounts.push(amount);

        if (batch.length === batchSize || index + 1 >= addresses.length) {
            await createContract(batch, amounts, tableNumber);
            tableNumber++;
            batch.length = 0;
            amounts.length = 0;
        }

        totalAmount = totalAmount.add(amount);
    }

    console.log("Total amount:", totalAmount.toString());
}

async function createContract(addresses: string[], values: string[], tableNumber: number) {
    const buffor = `pragma solidity ^0.5.16;
    
import { Table } from "../Table.sol";

contract Table_${tableNumber} is Table {
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

    await fsPromises.writeFile(`contracts/airDrop/tables/Table_${tableNumber}.sol`, buffor);
    console.log(`Created cotract with ${addresses.length} stakers`);
};

async function readAirdrop2() {
    const filestream = fs.createReadStream('airdrop_2_amounts.csv');
    const rl = readline.createInterface({
        input: filestream,
        crlfDelay: Infinity
    });

    let map = {};
    let counter = 0;
    for await (const line of rl) {
        let [address, amount] = line.split(",");
        address = address.toLowerCase();
        if(address == '' || address == 'address') continue;
        map[address] = new BN(amount);
    }
    return map;
}
