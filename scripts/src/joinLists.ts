import fs, { promises as fsPromises } from "fs";
import readline from "readline";

export default async function main() {

    const map = [];

    const fileStream1 = fs.createReadStream('snapshot_1.csv');
    const rl1 = readline.createInterface({
        input: fileStream1,
        crlfDelay: Infinity
    });

    for await (const line of rl1) {
        const [address, power] = line.split(",");
        map[address] = [ power, power ];
    }

    const fileStream2 = fs.createReadStream('snapshot_2.csv');
    const rl2 = readline.createInterface({
        input: fileStream2,
        crlfDelay: Infinity
    });

    for await (const line of rl2) {
        const [address, power] = line.split(",");
        if (map[address]) {
            map[address][1] = power;
        } else {
            map[address] = [ 0, power ];
        }
    }

    Object.keys(map).forEach(address => {
        console.log(address+','+map[address][0]+','+map[address][1]);
    });
}

