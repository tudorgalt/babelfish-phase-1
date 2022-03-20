export declare const migrations_directory: string;
export declare const contracts_build_directory: string;
export declare const plugins: string[];
export declare namespace api_keys {
    export const etherscan: string;
}
export declare namespace networks {
    export namespace development {
        export const host: string;
        export const port: number;
        export const network_id: string;
        export const gas: number;
        export const gasPrice: number;
    }
    export namespace fork {
        const host_1: string;
        export { host_1 as host };
        const port_1: number;
        export { port_1 as port };
        const network_id_1: string;
        export { network_id_1 as network_id };
        const gas_1: number;
        export { gas_1 as gas };
    }
    export namespace coverage {
        const host_2: string;
        export { host_2 as host };
        const port_2: number;
        export { port_2 as port };
        const network_id_2: string;
        export { network_id_2 as network_id };
        const gas_2: number;
        export { gas_2 as gas };
        const gasPrice_1: number;
        export { gasPrice_1 as gasPrice };
    }
    export namespace ropsten {
        export function provider(): import("@truffle/hdwallet-provider");
        export function provider(): import("@truffle/hdwallet-provider");
        const network_id_3: number;
        export { network_id_3 as network_id };
        const gasPrice_2: number;
        export { gasPrice_2 as gasPrice };
        export const skipDryRun: boolean;
        const gas_3: number;
        export { gas_3 as gas };
    }
    export namespace kovan {
        export function provider(): import("@truffle/hdwallet-provider");
        export function provider(): import("@truffle/hdwallet-provider");
        const network_id_4: number;
        export { network_id_4 as network_id };
        const gasPrice_3: number;
        export { gasPrice_3 as gasPrice };
        const skipDryRun_1: boolean;
        export { skipDryRun_1 as skipDryRun };
        const gas_4: number;
        export { gas_4 as gas };
    }
    export namespace rskTestnet {
        export function provider(): import("@truffle/hdwallet-provider");
        export function provider(): import("@truffle/hdwallet-provider");
        const network_id_5: number;
        export { network_id_5 as network_id };
        const gasPrice_4: number;
        export { gasPrice_4 as gasPrice };
        const skipDryRun_2: boolean;
        export { skipDryRun_2 as skipDryRun };
        export const networkCheckTimeout: number;
    }
    export namespace rsk {
        export function provider(): import("@truffle/hdwallet-provider");
        export function provider(): import("@truffle/hdwallet-provider");
        const network_id_6: number;
        export { network_id_6 as network_id };
        const gasPrice_5: number;
        export { gasPrice_5 as gasPrice };
        const skipDryRun_3: boolean;
        export { skipDryRun_3 as skipDryRun };
        const networkCheckTimeout_1: number;
        export { networkCheckTimeout_1 as networkCheckTimeout };
    }
}
export declare namespace mocha {
    export const reporter: string;
    export namespace reporterOptions {
        export const currency: string;
    }
}
export declare namespace compilers {
    export namespace solc {
        export const version: string;
        export namespace settings {
            export namespace optimizer {
                export const enabled: boolean;
                export const runs: number;
            }
        }
    }
}
