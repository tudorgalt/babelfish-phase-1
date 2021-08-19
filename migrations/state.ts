import fs from 'fs';
import Truffle from 'truffle';

let state = null;
let network = 'localhost';

export function setNetwork(_network: string) {
    network = _network;
}

export async function conditionalDeploy(contract: Truffle.Contract, key: string, deployfunc): Promise<any> {
    if (!state) {
        state = await readState();
    }
    console.log('Conditional deploy: ', key);
    if (!state[key] || !state[key].address) {
        const c = await deployfunc();
        state[key] = { address: c.address };
        await writeState(state);
        return c;
    }
    console.log('Already deployed at: ', state[key].address);
    return contract.at(state[key].address);
}

export async function conditionalInitialize(key: string, initfunc) {
    if (!state) {
        state = await readState();
    }
    console.log('Conditional initialization: ', key);
    if (!state[key]) state[key] = {};
    if (state[key].initialized) {
        console.log('Already initialized');
        return;
    }
    await initfunc();
    state[key].initialized = true;
    await writeState(state);
}

export async function setInfo(contract: string, key: string, value: any) {
    if (!state) {
        state = await readState();
    }
    if (!state[contract]) state[contract] = {};
    state[contract][key] = value;
    await writeState(state);
}

export async function getInfo(contract: string, key: string): Promise<any> {
    if (!state) {
        state = await readState();
    }
    return state[contract][key];
}

export async function getDeployed(contract: Truffle.Contract, key: string): Truffle.Contract {
    if (!state) {
        state = await readState();
    }
    if (!state[key] || !state[key].address) {
        throw new Error('Not deployed: ' + key);
    }

    return contract.at(state[key].address);
}

export async function setAddress(key: string, address: string) {
    if (!state) {
        state = await readState();
    }
    state[key].address = address;
    await writeState(state);
}

export async function readState(): Promise<any> {
    return new Promise<any>((resolve, reject) => {
        const filePath = `state_${network}.json`;
        const emptyState = {};

        fs.readFile(filePath, (readErr, data) => {
            if (!readErr) {
                resolve(JSON.parse(data.toString('utf-8')));
                return;
            }

            fs.writeFile(filePath, JSON.stringify(emptyState), (writeErr) => {
                if (writeErr) reject(writeErr);
                resolve(emptyState);
            });
        });
    });
}

export function writeState(obj): Promise<void> {
    return new Promise((resolve, reject) => {
        fs.writeFile(`state_${network}.json`, JSON.stringify(obj, null, 2), (err) => {
            if (err) return reject(err);
            resolve();
        });
    });
}

export async function printState() {
    console.log(state);
}

export default { conditionalDeploy, conditionalInitialize, getDeployed, printState, setNetwork, setAddress };
