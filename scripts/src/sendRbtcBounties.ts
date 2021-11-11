/* eslint-disable prefer-destructuring */
/* eslint-disable @typescript-eslint/triple-slash-reference,spaced-comment */
/// <reference path="../../types/generated/index.d.ts" />
/// <reference path="../../types/generated/types.d.ts" />

/* eslint-disable no-await-in-loop */
/* eslint-disable no-plusplus */
/* eslint-disable no-continue */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-restricted-syntax */
import { conditionalDeploy, setNetwork } from "../state";
import BN from "bn.js";
import { toWei } from "web3-utils";
import Web3 from "web3";

export default async function main(truffle, networkName): Promise<void> {
    setNetwork(networkName);
    const artifacts: Truffle.Artifacts = truffle.artifacts;
    const web3: Web3 = truffle.web3;
    const address0 = web3.currentProvider['addresses'][0];
    console.log('0: ', address0);
    return;

    const Sender = artifacts.require('RbtcSender');
    const sender = await conditionalDeploy(Sender, 'RbtcSender', () => Sender.new());

    for(var i=0; i<data.length; i++) {

        const d = data[i];
        const amount = new BN(d[0]);
        const address = d[1];
        console.log(address, amount.toString());
        await sender.send(address, { value: amount });
    }
};

const data = [
    //[ '112000000000000', '0x4F66b17A1E1da5ACE2E6bB307992f4DBabAe3959' ],
    //[ '365333333333333', '0x5d464a46fcd05af3404f75c1b0d8a1a6854888ea' ],
    //[ '560000000000000', '0xf49f4c935a7d659a851b38752e2b2dc1b019663c' ],
    //[ '560000000000000', '0x558886060428ffa6da7b480dac4f21b3b7bf5249' ],
    //[ '733333333333333', '0xf48d2be651baea78a5c8c850c740a06a0423be96' ],
    //[ '733333333333333', '0x06db1437f345660789c8a75105702cab07aa62e3' ],
    //[ '733333333333333', '0xf8c7c720195e1b81f3e697ca1233355fe52a81cb' ],
    //[ '1066666666666670', '0xec9a4b3c93b295d73c08a51dd638f6cfb4c88c9c' ],
    [ '2424000000000000', '0x23a80f13775e9a2b67af97536ad0925817940419' ],
    [ '2784000000000000', '0x244d1a181b6fa17b807d5aeca1053c4b26e8fecd' ],
    [ '2936000000000000', '0xbfad31e87a78930bd942ec2686c5684e7b98d656' ],
    [ '5333333333333330', '0xe70b8ab9d51e48f05d73823aa692a054c3fbee41' ],
    [ '5592000000000000', '0x9fb96c6556562e660811c99da2351d99dbfdb188' ],
    [ '5600000000000000', '0x4754569e50baa9ce6a53e661058e1d4622f76313' ],
    [ '5698666666666670', '0xcab56c67f6af4a95f39bdb0db4085b8b486480ea' ],
    [ '5701333333333330', '0x63dc55dfd84de26700f57a4982c67f8b7ab0f371' ],
    [ '5936000000000000', '0xe52c75be08a3cdd5ebdbed49fc6ca507b78bb5be' ],
    [ '6320000000000000', '0xe43b4b81128be975f39c4d1960c2d2a3205273cb' ],
    [ '6720000000000000', '0x6ff5bb6cf54d1d890bfcf4bf78b9244cc831479e' ],
    [ '6738666666666670', '0xf5366a3445adf491311a6e86443bfb5392f08265' ],
    [ '7752000000000000', '0xc62940d164a26343357e992cafe96f7fc4411c78' ],
    [ '10666666666666700', '0x623e85405aba38dddcabb822cda1fd2eb65105aa' ],
    [ '12816000000000000', '0x6769c884d334c396810fe3ad72f40b1e151bf1ec' ],
    [ '13333333333333300', '0xf5a18e396337072ddb7d6ceff292da578f0dddd6' ],
    [ '13698666666666700', '0x4f239a52df4f4778897711203c4ea87469d2af89' ],
    [ '14544000000000000', '0x3160abd7d704749802c96851084746c960b8a18d' ],
    [ '16800000000000000', '0x3c79a6a9c188753a532cf38d5f951beebbaed5ae' ],
    [ '18666666666666700', '0x034499df879fc90a9d228d3c3276c24b6dec09b6' ],
    [ '19392000000000000', '0x7af2a27665d5bbc5352342fcaf072a6f4a4011d2' ],
    [ '22400000000000000', '0x067afeb4e122f1bf84544d1557adb27feff40f91' ],
    [ '23280000000000000', '0x55ed66e5e8371c66bc710a4fee4e8e7bf2d825fd' ],
    [ '25993333333333300', '0x5cc971d54e108193b987f34058330f7e53e1d469' ],
    [ '26666666666666700', '0x6cc133df47149f3c714c3a8c42a979e582e6b839' ],
    [ '28628666666666700', '0xc71de7c0a71137037678c70beb82077c0c729289' ],
    [ '29832000000000000', '0xb958a3e1666b612102ba88ba31515c31285ec450' ],
    [ '32000000000000000', '0xe87d638d0223ffb5e51dfad7e0403ff77bc61d8f' ],
    [ '37333333333333300', '0xfdedc0a5b5052913b5d026fd58db1f0c5210c090' ],
    [ '38789333333333300', '0x673b37941ab527e0eee13c1ff09298ef1911d7d6' ],
    [ '112000000000000000', '0x86bbda15cb47728d5c8857c8ee7c19eec3020cd4' ],
    [ '112000000000000000', '0x9da5a98a6033a0333c700765052327ede3c82491' ],
    [ '112000000000000000', '0xed878594b9e18d8c184acb3acb1812766c4e922c' ],
    [ '118522666666667000', '0xed878594b9e18d8c184acb3acb1812766c4e922c' ],
    [ '128733333333333000', '0x81496130a7e5fe1ff6fdb63c5679b5c35370e966' ],
    [ '173333333333333000', '0x09afa73d003dbabb799c12fe4f604cd6d327b985' ],
    [ '173333333333333000', '0x0a77ba41ee4ad7aae8c918d0ea67c25c0c892cdb' ],
    [ '336000000000000000', '0xcbebcf4fd59e082d8f95f8c9a7d2585c3229da84' ],
    [ '339200000000000000', '0x4a177cc32e4fa3a9a832225433fe8ecbe78122f6' ],
    [ '339333333333333000', '0xb400a11936ea64626dc7c15fc1e2cd391481fa65' ]
];
