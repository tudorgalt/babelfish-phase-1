/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from 'fs';
// eslint-disable-next-line import/no-extraneous-dependencies
import state from "../../migrations/state";
import ADDRESSES from '../../migrations/addresses';

export default async (truffle): Promise<void> => {

    const {artifacts} = truffle;
    const {network} = truffle.config;

    const addresses = ADDRESSES[network];
    const networkState = await readState(network);
    
    const c_BasketManager = artifacts.require("BasketManager");
    
    state.setNetwork(network);
    const d_BasketManager = await state.conditionalDeploy(c_BasketManager, 'BasketManager',
        () => c_BasketManager.new(addresses.bassets, addresses.factors, addresses.bridges));

    console.log(`Deployed BasketManager at ${d_BasketManager.address}. Assets: `, addresses.bassets);

    const c_Masset = artifacts.require("Masset");
    const d_Masset = await c_Masset.at(networkState.MassetProxy.address);

    
    let res = await d_Masset.getBasketManager();
    console.log(`Previous BasketManager: ${res}`);
    
    res = await d_Masset.setBasketManager(d_BasketManager.address);
    console.log(`Called Set BasketManager on ${d_Masset.address}`, res);
    
  }

  async function readState(network): Promise<any> {
    return new Promise<any>((resolve, reject) => {
        fs.readFile(`state_${network}.json`, (err, data) => {
            if (err) return reject(err);
            resolve(JSON.parse(data.toString('utf-8')));
        });
    });
}