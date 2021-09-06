/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-use-before-define */
import fs from 'fs';
import { DeployOptions } from 'hardhat-deploy/dist/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { Address } from 'types';

let state: AddressesState = null;
let network = 'localhost';

const emptyState: AddressesState = {};

export function setNetwork(_network: string) {
    network = _network;
}

type DeployFunc = HardhatRuntimeEnvironment['deployments']['deploy'];

export async function conditionalDeploy <T extends Truffle.ContractInstance> (
    contract: Truffle.Contract<T>,
    key: string,
    deployOptions: DeployOptions,
    deployfunc: DeployFunc
): Promise<T> {
    if (!state) {
        state = await readState();
    }

    console.log('Conditional deploy: ', key);
    if (!state[key] || !state[key].address) {
        const { address } = await deployfunc(key, {
            contract: contract.contractName,
            ...deployOptions
        });

        state[key] = { address };
        
        await writeState(state);
        const deployedContract = contract.at(address);

        return deployedContract;
    }

    console.log('Already deployed at: ', state[key].address);
    return contract.at(state[key].address);
}

export async function conditionalInitialize(key: string, initfunc: () => Promise<void>) {
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

export async function getDeployed <T> (contract: Truffle.Contract<T>, key: string) {
    if (!state) {
        state = await readState();
    }
    if (!state[key] || !state[key].address) {
        throw new Error(`Not deployed: ${key}`);
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

export async function readState(): Promise<AddressesState> {
    return new Promise((resolve, reject) => {
        const filePath = `state_${network}.json`;

        fs.readFile(filePath, (readErr, data) => {
            const parsedData = data?.toString('utf-8');
            if (!readErr && parsedData) {
                resolve(JSON.parse(parsedData));
                return;
            }
 
            fs.writeFile(filePath, JSON.stringify(emptyState), (writeErr) => {
                if (writeErr) reject(writeErr);
                resolve(emptyState);
            });
        });
    });
}

export function writeState(obj: AddressesState): Promise<void> {
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

export async function clearState() {
    if (!state) {
        state = await readState();
    }
    state = emptyState;
    await writeState(state);
}

type AddressesState = {
    [k: string]: {
        address?: Address;
        initialized?: boolean;
    };
};

export default { conditionalDeploy, conditionalInitialize, getDeployed, printState, setNetwork, setAddress };
