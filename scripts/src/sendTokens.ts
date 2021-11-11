/* eslint-disable prefer-destructuring */
/* eslint-disable @typescript-eslint/triple-slash-reference,spaced-comment */
/// <reference path="../../types/generated/index.d.ts" />
/// <reference path="../../types/generated/types.d.ts" />

/* eslint-disable no-await-in-loop */
/* eslint-disable no-plusplus */
/* eslint-disable no-continue */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-restricted-syntax */
import { getDeployed, setNetwork } from "../state";
import { FishInstance, SenderInstance } from "types/generated";
import assert from "./utils/assert";

//const batchSize = 150;
const batchSize = 100;


export default async function main(truffle, networkName): Promise<void> {
    setNetwork(networkName);

    const Sender = truffle.artifacts.require("Sender");
    const Fish = truffle.artifacts.require("Fish");

    const sender: SenderInstance = await getDeployed(Sender, "Sender");
    const fishToken: FishInstance = await Fish.at('0x055A902303746382FBB7D18f6aE0df56eFDc5213');

/*
    await sender.returnTokens('38810000000000000000000');
    return;
*/
    const total = await sender.totalLength();
    //const totalValue = new BN('2982000000000000000000000');

    //onsole.log(`Total value of tokens to send: ${totalValue}`);

    let currentIndex = await sender.index();
    console.log(`Going to send to index ${currentIndex.toString()}...`);
    let balance = await fishToken.balanceOf(sender.address);
    console.log(`Current balance: ${balance.toString()}`);


    let totalGasUsed = 0;

    try {
        while (currentIndex.lt(total)) {
            const { receipt } = await sender.sendTokens(batchSize);
            totalGasUsed += receipt.gasUsed;

            currentIndex = await sender.index();
            console.log(`Sent to ${batchSize} addresses. Index: ${currentIndex.toString()}. Gas used: ${receipt.gasUsed}`);
            let balance = await fishToken.balanceOf(sender.address);
            console.log(`Current balance: ${balance.toString()}`);
        }
    } catch (e) {
        console.log("ERROR");
        console.log(e);
    }

    const finalBalance = await fishToken.balanceOf(sender.address);
    //const expectedBalance = initialBalance.sub(totalValue);

    //assert(finalBalance.eq(expectedBalance), "final balance is not valid");

    console.log(`Sending completed. Total gas used: ${totalGasUsed}`);
};

const data = [[ new BN('0.112'), '0x86bbdA15Cb47728d5C8857C8EE7c19eeC3020cd4' ],
    [ new BN('0.001066666667'), '0xec9a4B3C93B295d73c08a51DD638F6CFB4c88C9c' ],
    [ new BN('0.005592'), '0x9fB96C6556562e660811C99dA2351d99dbFDb188' ],
    [ new BN('0.005701333333'), '0x63DC55DFD84De26700f57A4982c67f8B7Ab0F371' ],
    [ new BN('0.00632'), '0xE43b4B81128bE975F39c4D1960c2D2a3205273CB' ],
    [ new BN('0.006738666667'), '0xF5366a3445Adf491311a6e86443bfb5392f08265' ],
    [ new BN('0.005936'), '0xE52c75Be08A3cdd5eBdBEd49FC6cA507B78Bb5bE' ],
    [ new BN('0.1185226667'), '0xEd878594b9E18D8C184AcB3aCb1812766C4E922c' ],
    [ new BN('0.007752'), '0xc62940D164a26343357e992caFE96f7Fc4411c78' ],
    [ new BN('0.002424'), '0x23A80F13775E9a2b67aF97536AD0925817940419' ],
    [ new BN('0.002784'), '0x244D1A181B6FA17b807d5aecA1053c4b26e8fECD' ],
    [ new BN('0.012816'), '0x6769c884d334C396810fE3Ad72f40b1E151Bf1Ec' ],
    [ new BN('0.02862866667'), '0xC71de7C0A71137037678C70BEB82077c0C729289' ],
    [ new BN('0.019392'), '0x7aF2A27665D5bBc5352342FCAF072A6f4a4011D2' ],
    [ new BN('0.014544'), '0x3160Abd7d704749802c96851084746C960B8A18d' ],
    [ new BN('0.02328'), '0x55Ed66E5E8371C66bc710A4feE4e8e7Bf2d825fd' ],
    [ new BN('0.03878933333'), '0x673B37941AB527E0eeE13C1fF09298Ef1911D7D6' ],
    [ new BN('0.3392'), '0x4A177Cc32e4FA3A9a832225433fe8eCBe78122F6' ],
    [ new BN('0.002936'), '0xbfaD31E87a78930bD942ec2686C5684e7B98D656' ],
    [ new BN('0.0007333333333'), '0xf48D2bE651Baea78A5c8c850c740a06A0423be96' ],
    [ new BN('0.0007333333333'), '0x06Db1437F345660789C8a75105702CAb07aa62e3' ],
    [ new BN('0.0007333333333'), '0xF8C7C720195e1b81f3E697CA1233355fe52A81CB' ],
    [ new BN('0.0003653333333'), '0x5D464a46fCd05AF3404f75C1b0d8a1A6854888EA' ],
    [ new BN('0.336'), '0xCBebCF4fD59e082D8f95F8C9a7D2585C3229Da84' ],
    [ new BN('0.005333333333'), '0xe70b8Ab9d51e48F05d73823aa692a054C3FBEE41' ],
    [ new BN('0.03733333333'), '0xFDedC0a5B5052913b5D026FD58Db1f0C5210c090' ],
    [ new BN('0.01369866667'), '0x4F239a52Df4f4778897711203C4EA87469D2aF89' ],
    [ new BN('0.029832'), '0xb958A3E1666B612102ba88bA31515c31285EC450' ],
    [ new BN('0.032'), '0xE87d638d0223ffb5e51dFaD7E0403Ff77bc61D8F' ],
    [ new BN('0.0056'), '0x4754569e50BAA9cE6A53E661058E1D4622f76313' ],
    [ new BN('0.005698666667'), '0xcab56C67f6af4a95f39BDb0Db4085b8B486480Ea' ],
    [ new BN('0.01066666667'), '0x623E85405aBa38dddCabB822Cda1fD2EB65105aA' ],
    [ new BN('0.0224'), '0x067afEb4E122F1BF84544D1557Adb27feFf40f91' ],
    [ new BN('0.1733333333'), '0x09AFa73D003DBabb799c12fe4F604CD6d327b985' ],
    [ new BN('0.1287333333'), '0x81496130A7E5FE1Ff6fdB63C5679b5c35370e966' ],
    [ new BN('0.1733333333'), '0x0A77Ba41Ee4Ad7aae8C918d0Ea67c25C0c892cdB' ],
    [ new BN('0.01333333333'), '0xF5A18E396337072DdB7d6CEfF292Da578F0DDdD6' ],
    [ new BN('0.01866666667'), '0x034499df879fc90A9d228d3c3276c24b6DEC09B6' ],
    [ new BN('0.3393333333'), '0xb400a11936ea64626dc7C15FC1E2CD391481fa65' ],
    [ new BN('0.0168'), '0x3c79a6a9C188753a532cF38d5f951BEEBBaEd5aE' ],
    [ new BN('0.00672'), '0x6fF5Bb6Cf54d1D890bFcF4BF78b9244cC831479e' ],
    [ new BN('0.112'), '0x9DA5A98A6033a0333c700765052327Ede3c82491' ],
    [ new BN('0.02599333333'), '0x5Cc971d54E108193b987F34058330f7e53E1D469' ],
    [ new BN('0.00056'), '0xF49f4c935a7D659a851b38752E2b2Dc1b019663c' ],
    [ new BN('0.00056'), '0x558886060428ffa6da7b480dac4f21b3b7bf5249' ],
    [ new BN('0.000112'), '0x4F66b17A1E1da5ACE2E6bB307992f4DBabAe3959' ],
    [ new BN('0.112'), '0xEd878594b9E18D8C184AcB3aCb1812766C4E922c' ],
    [ new BN('0.02666666667'), '0x6cC133DF47149F3C714c3a8C42a979e582e6b839' ]];

