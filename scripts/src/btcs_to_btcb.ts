/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from 'fs';
// eslint-disable-next-line import/no-extraneous-dependencies
import state from "../../migrations/state";
import ADDRESSES from '../../migrations/addresses';

export default async (truffle): Promise<void> => {

    const {artifacts} = truffle;
    const {network} = truffle.config;
    const accounts = await truffle.web3.eth.getAccounts();

    const networkState = await readState(network);

    const BTCB_ADDRESS = ADDRESSES[network]?.bassets?.[1];
        
    const c_Masset = artifacts.require("Masset");
    const d_Masset = await c_Masset.at(networkState.MassetProxy.address);
    const res = await d_Masset.redeem(BTCB_ADDRESS, truffle.web3.utils.toWei('0.1', 'ether'), {from: accounts[0]});
    console.log(`Redeemed: `, res);
   

    
  }

  async function readState(network): Promise<any> {
    return new Promise<any>((resolve, reject) => {
        fs.readFile(`state_${network}.json`, (err, data) => {
            if (err) return reject(err);
            return resolve(JSON.parse(data.toString('utf-8')));
        });
    });
}