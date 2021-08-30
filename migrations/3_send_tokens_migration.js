
// Import TypeScript; it can't be run directly, but Truffle must use
// babel because requiring it works.

const sendTokensMigration = require(`./src/5_send_tokens.ts`).default;
const state = require(`./state.ts`).default;

// Bind the first argument of the script to the global truffle argument,
// with `web3`, `artifacts` and so on, and pass in all CLI arguments.
module.exports = async (deployer, network, accounts) => {
    await state.setNetwork(deployer.network);

    await sendTokensMigration(this, deployer, network, accounts);
};
