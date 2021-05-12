/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable spaced-comment */
/* eslint-disable @typescript-eslint/triple-slash-reference,spaced-comment */
/// <reference path="../../types/generated/index.d.ts" />
/// <reference path="../../types/generated/types.d.ts" />

import { conditionalDeploy, conditionalInitialize, printState } from "../state";

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

async function loadBassetsLocal(
    artifacts: Truffle.Artifacts,
    deployer,
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
    if (deployer.network === "fork") {
        // Don't bother running these migrations -- speed up the testing
        return;
    }

    /***************************************
    0. TYPECHAIN IMPORTS
    Imports parallel to folder layout
    ****************************************/

    // Masset
    const c_BasketManager = artifacts.require("BasketManager");
    const c_MockERC20 = artifacts.require("MockERC20"); // Merely used to initialize BM

    // - mUSD
    const c_Masset = artifacts.require("Masset");

    // Proxy
    // - Admin
    const c_ThresholdProxyAdmin = artifacts.require("ThresholdProxyAdmin");

    // - BaseProxies
    const c_MassetProxy = artifacts.require("MassetProxy");
    const c_BasketManagerProxy = artifacts.require("BasketManagerProxy");

    /***************************************
    0. Mock platforms and bAssets
    Dependencies: []
    ****************************************/

    const [default_, governor] = accounts;
    const newGovernor = governor; // This should be an external multisig
    let bassetDetails;
    if (deployer.network === "ropsten") {
        console.log("Loading Ropsten bAssets and lending platforms");
        bassetDetails = await loadBassetsRopsten(artifacts);
    } else if (deployer.network === "kovan") {
        console.log("Loading Kovan bAssets and lending platforms");
        bassetDetails = await loadBassetsKovan(artifacts);
    } else {
        console.log(`Generating mock bAssets and lending platforms`);
        bassetDetails = await loadBassetsLocal(artifacts, default_);
    }

    const d_ThresholdProxyAdmin_Masset = await conditionalDeploy(c_ThresholdProxyAdmin, 'ThresholdProxyAdmin_Masset',
        () => deployer.deploy(c_ThresholdProxyAdmin, { from: default_ }));

    const d_ThresholdProxyAdmin_BasketManager = await conditionalDeploy(c_ThresholdProxyAdmin, 'ThresholdProxyAdmin_BridgeManager',
        () => deployer.deploy(c_ThresholdProxyAdmin, { from: default_ }));

    const d_Masset = await conditionalDeploy(c_Masset, 'Masset',  () => deployer.deploy(c_Masset, { from: default_ }));

    const d_MassetProxy = await conditionalDeploy(c_MassetProxy, 'MassetProxy',
        () => deployer.deploy(c_MassetProxy));

    const d_BasketManager = await conditionalDeploy(c_BasketManager, 'BasketManager',
        () => deployer.deploy(c_BasketManager) );

    const d_BasketManagerProxy = await conditionalDeploy(c_BasketManagerProxy, 'BasketManagerProxy',
        () => deployer.deploy(c_BasketManagerProxy));

    const initializationData_mUSD: string = d_Masset.contract.methods
        .initialize(
            "BabelFish USD",
            "xUSD",
            d_BasketManagerProxy.address,
        )
        .encodeABI();
    await conditionalInitialize('MassetProxy', () => {
        return d_MassetProxy.methods["initialize(address,address,bytes)"](
            d_Masset.address,
            d_ThresholdProxyAdmin_Masset.address,
            initializationData_mUSD,
        );
    });

    const initializationData_BasketManager: string = d_BasketManager.contract.methods
        .initialize(
            d_MassetProxy.address,
            bassetDetails.bAssets,
            bassetDetails.factors
        )
        .encodeABI();
    await conditionalInitialize('BasketManagerProxy', () => {
        return d_BasketManagerProxy.methods["initialize(address,address,bytes)"](
            d_BasketManager.address,
            d_ThresholdProxyAdmin_BasketManager.address,
            initializationData_BasketManager,
        );
    });

    printState();
};
