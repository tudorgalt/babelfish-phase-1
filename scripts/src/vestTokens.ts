/* eslint-disable prefer-destructuring */
/* eslint-disable @typescript-eslint/triple-slash-reference,spaced-comment */
/// <reference path="../../types/generated/index.d.ts" />
/// <reference path="../../types/generated/types.d.ts" />

/* eslint-disable no-await-in-loop */
/* eslint-disable no-plusplus */
/* eslint-disable no-continue */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-restricted-syntax */
import { conditionalDeploy, getDeployed, setNetwork } from "../state";
import { FishInstance, SenderInstance } from "types/generated";
import assert from "./utils/assert";
import { AirdropVesterInstance } from "../../types/generated";

//const batchSize = 150;
const batchSize = 100;


export default async function main(truffle, networkName): Promise<void> {
    setNetwork(networkName);

    const Fish = truffle.artifacts.require("Fish");
    const fishToken: FishInstance = await Fish.at('0x055A902303746382FBB7D18f6aE0df56eFDc5213');

    const AirdropVester = truffle.artifacts.require("AirdropVester");
    const IVestingRegistry3 = truffle.artifacts.require("IVestingRegistry3");

    const vestingRegistry = await IVestingRegistry3.at('0x036ab2DB0a3d1574469a4a7E09887Ed76fB56C41');

    const vester: AirdropVesterInstance = await getDeployed(AirdropVester, `AirdropVester`);

    const SimpleVester = truffle.artifacts.require("SimpleVester");
    const simpleVester = await getDeployed(SimpleVester, "SimpleVester");

    let abi = vestingRegistry.contract.methods['addAdmin(address)'](vester.address).encodeABI();
    console.log('abi for upgrade: ', abi);

    abi = vestingRegistry.contract.methods['addAdmin(address)'](simpleVester.address).encodeABI();
    console.log('abi for upgrade: ', abi);
    return;

    const total = await vester.totalLength();
    let currentIndex = await vester.index();
    console.log(`Going to send to index ${currentIndex.toString()}...`);
    let balance = await fishToken.balanceOf(vester.address);
    console.log(`Current balance: ${balance.toString()}`);

    let totalGasUsed = 0;

    try {
        while (currentIndex.lt(total)) {
            const { receipt } = await vester.vestTokens(batchSize);
            totalGasUsed += receipt.gasUsed;

            currentIndex = await vester.index();
            console.log(`Sent to ${batchSize} addresses. Index: ${currentIndex.toString()}. Gas used: ${receipt.gasUsed}`);
            let balance = await fishToken.balanceOf(vester.address);
            console.log(`Current balance: ${balance.toString()}`);
        }
    } catch (e) {
        console.log("ERROR");
        console.log(e);
    }

    const finalBalance = await fishToken.balanceOf(vester.address);
    console.log(`Sending completed. Total gas used: ${totalGasUsed}`);
};
