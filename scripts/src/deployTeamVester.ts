/* eslint-disable prefer-destructuring */
/* eslint-disable @typescript-eslint/triple-slash-reference,spaced-comment */
/// <reference path="../../types/generated/index.d.ts" />
/// <reference path="../../types/generated/types.d.ts" />

/* eslint-disable no-await-in-loop */
/* eslint-disable no-plusplus */
/* eslint-disable no-continue */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-restricted-syntax */
import { BN } from "@utils/tools";
import { conditionalDeploy, getDeployed, setNetwork } from "../state";
import { FishInstance, SenderInstance, TableInstance } from "types/generated";
import { promises } from "fs";
import Web3 from "web3";

export default async function main(truffle, networkName): Promise<void> {
    setNetwork(networkName);
    const artifacts: Truffle.Artifacts = truffle.artifacts;
    const web3: Web3 = truffle.web3;

    const SimpleVester = artifacts.require("SimpleVester");
    const simpleVester = await conditionalDeploy(SimpleVester, 'SimpleVester', () => SimpleVester.new());

    await simpleVester.doIt1();
    //await simpleVester.doIt2();
    //await simpleVester.doIt3();
};
