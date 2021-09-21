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

    const alreadyPaid = await readAlreadyPaid();
    const { snapshots, total1, total2 } = await readSnapshots();

    let addresses = Object.keys(snapshots);

    console.log("Starting...");

    const batch = [];
    const amounts = [];
    let tableNumber = 1;
    let totalAmount = new BN(0);

    for (let index = 0; index < addresses.length; index++) {

        const address = addresses[index];

        const weight1 = snapshots[address][0].mul(precision).div(total1);
        const weight2 = snapshots[address][1].mul(precision).div(total2);
        const amount = howMuch(weight1, weight2);

        let ap = alreadyPaid[address];
        if(!ap) ap = new BN(0);
        let toPay = amount;
        toPay = toPay.sub(ap);
        toPay = toPay.isNeg() ? new BN(0) : toPay;

        console.log(`${address},${ap.toString()},${amount.toString()},${toPay.toString()}`);

        batch.push(Web3.utils.toChecksumAddress(address));
        amounts.push(toPay.toString());

        if (batch.length === batchSize || index + 1 >= addresses.length) {
            await createContract(batch, amounts, tableNumber);
            tableNumber++;
            batch.length = 0;
            amounts.length = 0;
        }

        totalAmount = totalAmount.add(toPay);
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

function howMuch(weight1, weight2): BN {
    const forSnapshot1 = totalFish.mul(weight1)
        .div(precision)
        .mul(new BN(21))
        .div(new BN(10000));
    const forSnapshot2 = totalFish.mul(weight2)
        .div(precision)
        .mul(new BN(50))
        .div(new BN(10000));
    return forSnapshot1.add(forSnapshot2);
}

async function readAlreadyPaid() {
    const filestream = fs.createReadStream('already_dropped.csv');
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
        if(!map[address]) map[address] = new BN(0);
        map[address] = map[address].add(new BN(amount));
    }
    return map;
}

async function readSnapshots() {
    const filestream = fs.createReadStream('airdrop_1_snapshots_full_no_contracts.csv');
    const rl = readline.createInterface({
        input: filestream,
        crlfDelay: Infinity
    });

    let map = {};
    let total1 = new BN(0);
    let total2 = new BN(0);

    let counter = 0;
    for await (const line of rl) {
        let [address, weight1, weight2] = line.split(",");
        address = address.toLowerCase();
        if(address == '' || address == 'address') continue;
        map[address] = [ new BN(weight1), new BN(weight2)];
        total1 = total1.add(new BN(weight1));
        total2 = total2.add(new BN(weight2));
    }
    return { snapshots: map, total1, total2 };
}
