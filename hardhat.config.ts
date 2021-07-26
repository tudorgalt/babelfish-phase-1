import { HardhatUserConfig } from "hardhat/types";

import "hardhat-gas-reporter";
import "solidity-coverage";
import "@nomiclabs/hardhat-truffle5";
import "@tenderly/hardhat-tenderly";
import "hardhat-deploy";
import "ts-node/register";
import "tsconfig-paths/register";
import "hardhat-typechain";

const config: HardhatUserConfig = {
    networks: {
        development: {
            url: "http://127.0.0.1:7545",
            saveDeployments: false
        },
        hardhat: {
            live: false
        },
        fork: {
            url: "http://127.0.0.1:7545",
            gas: 8000000
        },
        coverage: {
            url: "http://127.0.0.1:7546",
            gas: 0xfffffffffff, // <-- Use this high gas value
            gasPrice: 0x01      // <-- Use this low gas price
        },
        ropsten: {
            accounts: {
                mnemonic: "seek danger physical menu pen arrest clutch blade weird detect digital frog",
                initialIndex: 0,
                count: 3
            },
            url: `https://ropsten.infura.io/v3/42af85fbc97845a0974cbbf003834c28`,
            chainId: 3,
            gasPrice: 1000000000, // 100 GWei,
            gas: 70000000,
            timeout: 160000
            // provider() {
            //     return new HDWalletProvider("seek danger physical menu pen arrest clutch blade weird detect digital frog",
            //         `wss://ropsten.infura.io/ws/v3/42af85fbc97845a0974cbbf003834c28`, 0, 3);
            // },
            // network_id: 3,
            // skipDryRun: true,
        },
        rinkeby: {
            accounts: {
                mnemonic: "seek danger physical menu pen arrest clutch blade weird detect digital frog",
                initialIndex: 0,
                count: 3
            },
            url: "https://rinkeby.infura.io/v3/4326f844557341a89a24bdcfc571fc10",
            chainId: 4,
            gasPrice: 1000000000, // 100 GWei,
            gas: 2000000,
            timeout: 160000
        }
        // kovan: {
        //     provider() {
        //         return new HDWalletProvider("seek danger physical menu pen arrest clutch blade weird detect digital frog",
        //             "wss://kovan.infura.io/ws/v3/42af85fbc97845a0974cbbf003834c28", 0, 42);
        //     },
        //     network_id: 42,
        //     gasPrice: 20000000000, // 20 GWei,
        //     skipDryRun: true,
        //     gas: 2000000
        // },
        // rskTestnet: {
        //     provider() {
        //         return new HDWalletProvider('chimney toss kit now firm true scan laundry hazard buffalo tiny west',
        //             'https://testnet.sovryn.app/rpc', 0, 31);
        //     },
        //     network_id: 31,
        //     gasPrice: 71680400, // 71GWei,
        //     skipDryRun: true,
        //     networkCheckTimeout: 1e9
        // },
        // rsk: {
        //     provider() {
        //         return new HDWalletProvider('chimney toss kit now firm true scan laundry hazard buffalo tiny west', // totally bogus
        //             'wss://mainnet.sovryn.app/ws', 0, 30);
        //     },
        //     network_id: 30,
        //     gasPrice: 71680400, // 71GWei,
        //     skipDryRun: true,
        //     networkCheckTimeout: 1e9
        // },
    },
    solidity: {
        version: "0.5.16",
        settings: {
            optimizer: {
                enabled: false,
            },
        },
    },
    paths: {
        artifacts: "./build/contracts",
        deploy: "./migrations",
        deployments: "./deployments",
        sources: './contracts'
    },
    gasReporter: {
        currency: "USD",
        gasPrice: 30,
    },
    mocha: {
        timeout: 240000, // 4 min timeout
    },
    typechain: {
        outDir: "types/generated",
        target: "truffle-v5",
    },
    tenderly: {
        username: "mStable",
        project: "mStable-contracts",
    },

};

export default config;
