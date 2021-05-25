/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable spaced-comment */
/* eslint-disable @typescript-eslint/triple-slash-reference,spaced-comment */
/// <reference path="../../types/generated/index.d.ts" />
/// <reference path="../../types/generated/types.d.ts" />

import { ZERO_ADDRESS } from "@utils/constants";
import { conditionalDeploy, conditionalInitialize, printState } from "../state";
import addresses from '../addresses';

const admin1 = '0x94e907f6B903A393E14FE549113137CA6483b5ef';
const admin2 = '0x78514Eedd8678b8055Ca19b55c2711a6AACc09F8';
const admin3 = '0xfa82e8Bb8517BE31f64fe517E1E63B87183414Ad';

class BassetIntegrationDetails {
    bAssets: Array<string>;

    factors: Array<number>;
}

async function loadBassetsRopsten(artifacts: Truffle.Artifacts): Promise<BassetIntegrationDetails> {
    return { bAssets: [], factors: [] };
}

async function loadBassetsKovan(artifacts: Truffle.Artifacts): Promise<BassetIntegrationDetails> {
    return { bAssets: [], factors: [] };
}

async function loadBassetsRskTestnet(
    artifacts: Truffle.Artifacts,
    deployerAddress, network: string
): Promise<BassetIntegrationDetails> {
    const c_MockERC20 = artifacts.require("MockERC20");

    //  - Mock bAssets
    const mockBasset1 = await conditionalDeploy(c_MockERC20, "Mock1", () => {
        return c_MockERC20.new("Mock1", "MK1", 18, deployerAddress, 1000);
    });
    return {
        bAssets: [mockBasset1.address, addresses[network].ESETH_ADDRESS],
        factors: [1, 1]
    };
}

async function loadBassetsLocal(
    artifacts: Truffle.Artifacts,
    deployer
): Promise<BassetIntegrationDetails> {
    const c_MockERC20 = artifacts.require("MockERC20");

    //  - Mock bAssets
    const mockBasset1 = await conditionalDeploy(c_MockERC20, "Mock1", () => {
        return c_MockERC20.new("Mock1", "MK1", 18, deployer, 1000);
    });
    //  - Mock bAssets
    const mockBasset2 = await conditionalDeploy(c_MockERC20, "Mock2", () => {
        return c_MockERC20.new("Mock1", "MK1", 18, deployer, 1000);
    });

    return {
        bAssets: [mockBasset1.address, mockBasset2.address],
        factors: [1, 1]
    };
}

export default async (
    { artifacts }: { artifacts: Truffle.Artifacts },
    deployer,
    network,
    accounts,
): Promise<void> => {

    /***************************************
    0. TYPECHAIN IMPORTS
    Imports parallel to folder layout
    ****************************************/

    // Token
    const c_Token = artifacts.require("Token");

    // Masset
    const c_BasketManager = artifacts.require("BasketManager");

    // - mUSD
    const c_Masset = artifacts.require("Masset");

    // Proxy
    // - Admin
    const c_ThresholdProxyAdmin = artifacts.require("ThresholdProxyAdmin");

    // - BaseProxies
    const c_MassetProxy = artifacts.require("MassetProxy");

    /***************************************
    0. Mock platforms and bAssets
    Dependencies: []
    ****************************************/

    const [default_, governor] = accounts;
    const newGovernor = governor; // This should be an external multisig
    let bassetDetails;
    console.log("Generating bAssets..");
    if (deployer.network === "ropsten") {
        bassetDetails = await loadBassetsRopsten(artifacts);
    } else if (deployer.network === "kovan") {
        bassetDetails = await loadBassetsKovan(artifacts);
    } else if (deployer.network === "rskTestnet") {
        bassetDetails = await loadBassetsRskTestnet(artifacts, default_, deployer.network);
    } else {
        bassetDetails = await loadBassetsLocal(artifacts, default_);
    }

    const d_Token = await conditionalDeploy(c_Token, 'Token',() => c_Token.new('ETHs','ETHs', 18));

    const d_Masset = await conditionalDeploy(c_Masset, 'Masset',  () => deployer.deploy(c_Masset, { from: default_ }));

    const d_MassetProxy = await conditionalDeploy(c_MassetProxy, 'MassetProxy',
        () => deployer.deploy(c_MassetProxy));

    console.log(1);

    if (await d_Token.owner() !== d_MassetProxy.address) {
        await d_Token.transferOwnership(d_MassetProxy.address);
    }

    console.log(2);

    const d_ThresholdProxyAdmin_Masset = await conditionalDeploy(c_ThresholdProxyAdmin, 'ThresholdProxyAdmin_Masset',
        () => c_ThresholdProxyAdmin.new(d_MassetProxy.address, [ admin1, admin2, admin3 ], 2));

    const d_BasketManager = await conditionalDeploy(c_BasketManager, 'BasketManager',
        () => c_BasketManager.new(bassetDetails.bAssets, bassetDetails.factors));

    const initializationData_mUSD: string = d_Masset.contract.methods
        .initialize(
            d_BasketManager.address,
            d_Token.address,
            addresses[deployer.network].BRIDGE_ADDRESS,
            deployer.network !== 'development').encodeABI();
    await conditionalInitialize('MassetProxy', () => {
        return d_MassetProxy.methods["initialize(address,address,bytes)"](
            d_Masset.address,
            d_ThresholdProxyAdmin_Masset.address,
            initializationData_mUSD,
        );
    });

    printState();
};
