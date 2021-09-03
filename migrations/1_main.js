
// Import TypeScript; it can't be run directly, but Truffle must use
// babel because requiring it works.

const initialMigration = require(`./src/1_initial_migration.ts`).default;
const systemMigration = require(`./src/2_system.ts`).default;
const upgradeToV3Migration = require(`./src/3_upgradeToV3.ts`).default;
const upgradeTo43Migration = require(`./src/5_upgradeToV4`).default;

const state = require(`./state.ts`).default;

// Bind the first argument of the script to the global truffle argument,
// with `web3`, `artifacts` and so on, and pass in all CLI arguments.
module.exports = async (deployer, network, accounts) => {
    await state.setNetwork(deployer.network);

    await initialMigration(this, deployer);
    await systemMigration(this, deployer, network, accounts);
    await upgradeToV3Migration(this, deployer, network, accounts);
    await upgradeTo43Migration(this, deployer, network, accounts);
};
