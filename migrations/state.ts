import fs from 'fs';
import Truffle from 'truffle';

let state = null;

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

export async function getDeployed(contract: Truffle.Contract, key: string): Truffle.Contract {
    if (!state) {
        state = await readState();
    }
    if (!state[key] || !state[key].address) {
        throw new Error('Not deployed: ' + key);
    }

    return contract.at(state[key].address);
}

async function readState(): Promise<any> {
    return new Promise<any>((resolve, reject) => {
        fs.readFile('state.json', (err, data) => {
            if (err) reject(err);
            resolve(JSON.parse(data.toString('utf-8')));
        });
    });
}

async function writeState(obj) {
    fs.writeFile('state.json', JSON.stringify(obj, null, 2), (err) => {
        if (err) throw err;
    });
}
