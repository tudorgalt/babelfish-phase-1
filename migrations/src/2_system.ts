/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable spaced-comment */
/* eslint-disable @typescript-eslint/triple-slash-reference,spaced-comment */
/// <reference path="../../types/generated/index.d.ts" />
/// <reference path="../../types/generated/types.d.ts" />

import state from "../state";
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
    const mockBasset1 = await state.conditionalDeploy(c_MockERC20, "Mock1", () => {
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
    const mockBasset1 = await state.conditionalDeploy(c_MockERC20, "Mock1", () => {
        return c_MockERC20.new("Mock1", "MK1", 18, deployer, 1000);
    });
    //  - Mock bAssets
    const mockBasset2 = await state.conditionalDeploy(c_MockERC20, "Mock2", () => {
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
    } else if (deployer.network === "rskTestnet") {
        console.log("Loading RSK testnet bAssets and lending platforms");
        bassetDetails = await loadBassetsRskTestnet(artifacts, default_, deployer.network);
    } else {
        console.log(`Generating mock bAssets and lending platforms`);
        bassetDetails = await loadBassetsLocal(artifacts, default_);
    }

    const d_ThresholdProxyAdmin_Masset = await state.conditionalDeploy(c_ThresholdProxyAdmin, 'ThresholdProxyAdmin_Masset',
        () => deployer.deploy(c_ThresholdProxyAdmin, { from: default_ }));

    const d_ThresholdProxyAdmin_BasketManager = await state.conditionalDeploy(c_ThresholdProxyAdmin, 'ThresholdProxyAdmin_BasketManager',
        () => deployer.deploy(c_ThresholdProxyAdmin, { from: default_ }));

    const d_Masset = await state.conditionalDeploy(c_Masset, 'Masset',  () => deployer.deploy(c_Masset, { from: default_ }));

    const d_MassetProxy = await state.conditionalDeploy(c_MassetProxy, 'MassetProxy',
        () => deployer.deploy(c_MassetProxy));

    await state.conditionalInitialize('ThresholdProxyAdmin_Masset', async () => {
        return d_ThresholdProxyAdmin_Masset.initialize(d_MassetProxy.address, [ admin1, admin2, admin3 ], 2);
    });

    const d_BasketManager = await state.conditionalDeploy(c_BasketManager, 'BasketManager',
        () => deployer.deploy(c_BasketManager) );

    const d_BasketManagerProxy = await state.conditionalDeploy(c_BasketManagerProxy, 'BasketManagerProxy',
        () => deployer.deploy(c_BasketManagerProxy));

    await state.conditionalInitialize('ThresholdProxyAdmin_BasketManager', async () => {
        return d_ThresholdProxyAdmin_BasketManager.initialize(d_BasketManagerProxy.address, [ admin1, admin2, admin3 ], 2);
    });

    const initializationData_mUSD: string = d_Masset.contract.methods
        .initialize(
            "BabelfishUSD",
            "xUSD",
            d_BasketManagerProxy.address,
        )
        .encodeABI();
    await state.conditionalInitialize('MassetProxy', () => {
        return d_MassetProxy.methods["initialize(address,address,bytes)"](
            d_Masset.address,
            d_ThresholdProxyAdmin_Masset.address,
            initializationData_mUSD,
        );
    });

    console.log(bassetDetails);

    const initializationData_BasketManager: string = d_BasketManager.contract.methods
        .initialize(
            d_MassetProxy.address,
            bassetDetails.bAssets,
            bassetDetails.factors
        )
        .encodeABI();
    await state.conditionalInitialize('BasketManagerProxy', () => {
        return d_BasketManagerProxy.methods["initialize(address,address,bytes)"](
            d_BasketManager.address,
            d_ThresholdProxyAdmin_BasketManager.address,
            initializationData_BasketManager,
        );
    });

    state.printState();
};
