import Logs from "node-logs";
import { task } from "hardhat/config";
import { setNetwork } from "migrations/utils/state";
import { fromWei, tokens } from "@utils/tools";
import { ERC20MintableContract } from "types/generated";

const logger = new Logs().showInConsole(true);

const RECIPIENT = "0x5170F3D5158653DDd8649c483cd1cd9bae6803EF";

const TOKEN_AMOUNT = tokens("10000");
const RBTC_AMOUNT = tokens("10");

// const TOKEN_SYMBOL = "FishToken";
const TOKEN_ADDRESS = "0x5250D37B096099678b0957bae32153915ca2C043";

task("getTokens", "mints tokens and transfers RBTC").setAction(async (_, hre) => {
    const { network, web3, artifacts } = hre;
    setNetwork(network.name);
    const [owner] = await hre.getUnnamedAccounts();

    const ERC20Mintable: ERC20MintableContract = artifacts.require("ERC20Mintable");
    // const token = await getDeployed(ERC20Mintable, TOKEN_SYMBOL);
    const token = await ERC20Mintable.at(TOKEN_ADDRESS);

    await token.mint(RECIPIENT, TOKEN_AMOUNT, { from: owner });
    logger.success(`Minted ${fromWei(TOKEN_AMOUNT)} tokens for ${RECIPIENT}`);

    await web3.eth.sendTransaction({ from: owner, to: RECIPIENT, value: RBTC_AMOUNT });
    logger.success(`Transferred ${fromWei(RBTC_AMOUNT)} RBTC for ${RECIPIENT}`);
});
