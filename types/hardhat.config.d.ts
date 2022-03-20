declare const _default: {
    networks: {
        hardhat: {
            allowUnlimitedContractSize: boolean;
        };
        localhost: {
            url: string;
        };
    };
    solidity: {
        version: string;
        settings: {
            optimizer: {
                enabled: boolean;
                runs: number;
            };
        };
    };
    paths: {
        artifacts: string;
    };
    gasReporter: {
        currency: string;
        gasPrice: number;
    };
    mocha: {
        timeout: number;
    };
    typechain: {
        outDir: string;
        target: string;
    };
    tenderly: {
        username: string;
        project: string;
    };
};
export default _default;
