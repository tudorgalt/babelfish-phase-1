/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable spaced-comment */
/* eslint-disable @typescript-eslint/triple-slash-reference,spaced-comment */
/// <reference path="../../types/generated/index.d.ts" />
/// <reference path="../../types/generated/types.d.ts" />

import { conditionalDeploy, conditionalInitialize } from "../state";

import { percentToWeight } from "@utils/math";
import {
    ZERO_ADDRESS,
    DEAD_ADDRESS,
    RopstenAccounts,
    KovanAccounts,
    KEY_PROXY_ADMIN,
    KEY_SAVINGS_MANAGER,
} from "@utils/constants";
import * as t from "../../types/generated";
import { Address } from "../../types";

export interface ATokenDetails {
    bAsset: Address;
    aToken: Address;
}
export interface CTokenDetails {
    bAsset: Address;
    cToken: Address;
}

export enum Platform {
    aave,
    compound,
}

export interface BassetIntegrationDetails {
    bAssets: Array<t.MockERC20Instance>;
    platforms: Array<Platform>;
    aavePlatformAddress: Address;
    aTokens: Array<ATokenDetails>;
    cTokens: Array<CTokenDetails>;
}

async function loadBassetsRopsten(artifacts: Truffle.Artifacts): Promise<BassetIntegrationDetails> {
    const c_MockERC20 = artifacts.require("MockERC20");

    const ra = new RopstenAccounts();
    // load all the REAL bAssets from Ropsten
    const bAsset_DAI = await c_MockERC20.at(ra.DAI);
    const bAsset_USDC = await c_MockERC20.at(ra.USDC);
    const bAsset_TUSD = await c_MockERC20.at(ra.TUSD);
    const bAsset_USDT = await c_MockERC20.at(ra.USDT);
    const bAssets = [bAsset_DAI, bAsset_USDC, bAsset_TUSD, bAsset_USDT];
    // return all the addresses
    return {
        bAssets,
        platforms: [Platform.compound, Platform.compound, Platform.aave, Platform.aave],
        aavePlatformAddress: ra.aavePlatform,
        cTokens: [
            {
                bAsset: bAsset_DAI.address,
                cToken: ra.cDAI,
            },
            {
                bAsset: bAsset_USDC.address,
                cToken: ra.cUSDC,
            },
        ],
        aTokens: [
            {
                bAsset: bAsset_TUSD.address,
                aToken: ra.aTUSD,
            },
            {
                bAsset: bAsset_USDT.address,
                aToken: ra.aUSDT,
            },
        ],
    };
}

async function loadBassetsKovan(artifacts: Truffle.Artifacts): Promise<BassetIntegrationDetails> {
    const c_MockERC20 = artifacts.require("MockERC20");

    const ra = new KovanAccounts();
    // load all the REAL bAssets from Ropsten
    const bAsset_DAI = await c_MockERC20.at(ra.DAI);
    const bAsset_USDC = await c_MockERC20.at(ra.USDC);
    const bAsset_TUSD = await c_MockERC20.at(ra.TUSD);
    const bAsset_USDT = await c_MockERC20.at(ra.USDT);
    const bAssets = [bAsset_DAI, bAsset_USDC, bAsset_TUSD, bAsset_USDT];
    // return all the addresses
    return {
        bAssets,
        platforms: [Platform.compound, Platform.compound, Platform.aave, Platform.aave],
        aavePlatformAddress: ra.aavePlatform,
        cTokens: [
            {
                bAsset: bAsset_DAI.address,
                cToken: ra.cDAI,
            },
            {
                bAsset: bAsset_USDC.address,
                cToken: ra.cUSDC,
            },
        ],
        aTokens: [
            {
                bAsset: bAsset_TUSD.address,
                aToken: ra.aTUSD,
            },
            {
                bAsset: bAsset_USDT.address,
                aToken: ra.aUSDT,
            },
        ],
    };
}

async function loadBassetsLocal(
    artifacts: Truffle.Artifacts,
    deployer,
): Promise<BassetIntegrationDetails> {
    const c_MockERC20 = artifacts.require("MockERC20");
    const c_MockAave = artifacts.require("MockAaveV2");
    const c_MockAToken = artifacts.require("MockAToken");
    const c_MockCToken = artifacts.require("MockCToken");
    //  - Mock bAssets
    const mockBasset1 = await c_MockERC20.new("Mock1", "MK1", 12, deployer, 100000000);
    const mockBasset2 = await c_MockERC20.new("Mock2", "MK2", 18, deployer, 100000000);
    const mockBasset3 = await c_MockERC20.new("Mock3", "MK3", 6, deployer, 100000000);
    const mockBasset4 = await c_MockERC20.new("Mock4", "MK4", 18, deployer, 100000000);

    //  - Mock Aave integration
    const d_MockAave = await c_MockAave.new({ from: deployer });

    //  - Mock aTokens
    const mockAToken1 = await c_MockAToken.new(d_MockAave.address, mockBasset1.address);
    const mockAToken2 = await c_MockAToken.new(d_MockAave.address, mockBasset2.address);
    const mockAToken3 = await c_MockAToken.new(d_MockAave.address, mockBasset3.address);

    //  - Add to the Platform
    await d_MockAave.addAToken(mockAToken1.address, mockBasset1.address);
    await d_MockAave.addAToken(mockAToken2.address, mockBasset2.address);
    await d_MockAave.addAToken(mockAToken3.address, mockBasset3.address);

    // Mock C Token
    const mockCToken4 = await c_MockCToken.new(mockBasset4.address);
    return {
        bAssets: [mockBasset1, mockBasset2, mockBasset3, mockBasset4],
        platforms: [Platform.aave, Platform.aave, Platform.aave, Platform.compound],
        aavePlatformAddress: d_MockAave.address,
        aTokens: [
            {
                bAsset: mockBasset1.address,
                aToken: mockAToken1.address,
            },
            {
                bAsset: mockBasset2.address,
                aToken: mockAToken2.address,
            },
            {
                bAsset: mockBasset3.address,
                aToken: mockAToken3.address,
            },
        ],
        cTokens: [
            {
                bAsset: mockBasset4.address,
                cToken: mockCToken4.address,
            },
        ],
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
    // - ForgeValidator
    const c_ForgeValidator = artifacts.require("ForgeValidator");
    // - Platforms (u)
    //    - Aave
    const c_AaveIntegration = artifacts.require("AaveV2Integration");
    //    - Compound
    const c_CompoundIntegration = artifacts.require("CompoundIntegration");
    // - BasketManager (u)
    const c_BasketManager = artifacts.require("BasketManager");
    const c_DeadIntegration = artifacts.require("DeadIntegration"); // Merely used to initialize BM
    const c_MockERC20 = artifacts.require("MockERC20"); // Merely used to initialize BM
    // - mUSD
    const c_Masset = artifacts.require("Masset");

    // Nexus
    const c_Nexus = artifacts.require("Nexus");

    // Proxy
    // - Admin
    const c_DelayedProxyAdmin = artifacts.require("DelayedProxyAdmin");
    // - BaseProxies
    const c_MassetProxy = artifacts.require("MassetProxy");
    const c_BasketManagerProxy = artifacts.require("BasketManagerProxy");
    const c_VaultProxy = artifacts.require("VaultProxy");

    // Savings
    // - Contract
    const c_SavingsContract = artifacts.require("SavingsContract");
    // - Manager
    const c_SavingsManager = artifacts.require("SavingsManager");

    /***************************************
    0. Mock platforms and bAssets
    Dependencies: []
    ****************************************/

    const [default_, governor] = accounts;
    const newGovernor = governor; // This should be an external multisig
    let bassetDetails: BassetIntegrationDetails;
    if (deployer.network === "ropsten") {
        console.log("Loading Ropsten bAssets and lending platforms");
        bassetDetails = await loadBassetsRopsten(artifacts);
    } else if (deployer.network === "kovan") {
        console.log("Loading Kovan bAssets and lending platforms");
        bassetDetails = await loadBassetsKovan(artifacts);
    } else {
        console.log(
            `==============================================\n` +
                `Generating mock bAssets and lending platforms\n` +
                `==============================================\n`,
        );
        bassetDetails = await loadBassetsLocal(artifacts, default_);
    }

    /***************************************
    1. Nexus
    Dependencies: []
    ****************************************/

    const d_Nexus = await conditionalDeploy(c_Nexus, 'Nexus', () => deployer.deploy(c_Nexus, governor, { from: default_ }));

    /***************************************
    2. mUSD
        Dependencies: [
            BasketManager [
                ProxyAdmin,
                PlatformIntegrations [ 
                    MockPlatforms
                ]
            ]
        ]
    ****************************************/

    // 2.0. Deploy ProxyAdmin
    const d_DelayedProxyAdmin = await conditionalDeploy(c_DelayedProxyAdmin, 'DelayedProxyAdmin', () => deployer.deploy(c_DelayedProxyAdmin, d_Nexus.address, { from: default_ }));

    // 2.1. Deploy no Init BasketManager
    //  - Deploy Implementation
    const d_BasketManager = await conditionalDeploy(c_BasketManager, 'BasketManager', () => deployer.deploy(c_BasketManager) );

    //  - Initialize the BasketManager implementation to avoid someone else doing it
    await conditionalInitialize('BasketManager', async () => {
        const d_DeadIntegration = await c_DeadIntegration.new();
        const d_DeadErc20 = await c_MockERC20.new("DEAD", "D34", 18, DEAD_ADDRESS, 1);
        await d_BasketManager.initialize(
            DEAD_ADDRESS,
            DEAD_ADDRESS,
            [d_DeadErc20.address],
            [d_DeadIntegration.address],
            [percentToWeight(100).toString()],
            [false],
        );
    });

    //  - Deploy Initializable Proxy
    const d_BasketManagerProxy = await conditionalDeploy(c_BasketManagerProxy, 'BasketManagerProxy', () => deployer.deploy(c_BasketManagerProxy));

    // 2.2. Deploy no Init AaveIntegration
    //  - Deploy Implementation with dummy params (this storage doesn't get used)
    const d_AaveIntegration = await conditionalDeploy(c_AaveIntegration, 'AaveIntegration', () => deployer.deploy(c_AaveIntegration));

    // await tai.initialize(DEAD_ADDRESS, [DEAD_ADDRESS], DEAD_ADDRESS, [], []);

    //  - Deploy Initializable Proxy
    const d_AaveIntegrationProxy = await conditionalDeploy(c_VaultProxy, 'AaveIntegrationProxy', () => c_VaultProxy.new());

    // 2.3. Deploy no Init CompoundIntegration
    //  - Deploy Implementation
    // We do not need platform address for compound
    const d_CompoundIntegration = await conditionalDeploy(c_CompoundIntegration, 'CompoundInteghration', () => deployer.deploy(c_CompoundIntegration));

    // await tci.initialize(DEAD_ADDRESS, [DEAD_ADDRESS], DEAD_ADDRESS, [], []);

    //  - Deploy Initializable Proxy
    const d_CompoundIntegrationProxy = await conditionalDeploy(c_VaultProxy, 'CompoundInteghrationProxy', () => c_VaultProxy.new());

    // 2.4. Deploy mUSD (w/ BasketManager addr)
    // 2.4.1. Deploy ForgeValidator
    const d_ForgeValidator = await conditionalDeploy(c_ForgeValidator, 'ForgeValidator', () => deployer.deploy(c_ForgeValidator, { from: default_ }));

    // 2.4.2. Deploy mUSD
    const d_mUSD = await conditionalDeploy(c_Masset, 'Masset',  () => deployer.deploy(c_Masset, { from: default_ }));

    // await tmusd.initialize("", "", DEAD_ADDRESS, DEAD_ADDRESS, DEAD_ADDRESS);

    // Deploy mUSD proxy
    const d_mUSDProxy = await conditionalDeploy(c_MassetProxy, 'MassetProxy', () => deployer.deploy(c_MassetProxy));

    /***************************************
     3. Savings
     Dependencies: [
     mUSD
     ]
     ****************************************/

    // Savings Contract
    const d_SavingsContract = await conditionalDeploy(c_SavingsContract, 'SavingsContract',  () => deployer.deploy(c_SavingsContract, d_Nexus.address, d_mUSDProxy.address, { from: default_ }));

    // Initiaize everything

    console.log('Initialize mUsd');

    // Initialize proxy data
    const initializationData_mUSD: string = d_mUSD.contract.methods
        .initialize(
            "BabelFish USD",
            "xUSD",
            d_Nexus.address,
            d_ForgeValidator.address,
            d_BasketManagerProxy.address,
        )
        .encodeABI();
    await conditionalInitialize('MassetProxy', () => {
        return d_mUSDProxy.methods["initialize(address,address,bytes)"](
            d_mUSD.address,
            d_DelayedProxyAdmin.address,
            initializationData_mUSD,
        );
    });

    console.log('Initialize aave');

    // 2.5. Init AaveIntegration
    const initializationData_AaveIntegration: string = d_AaveIntegration.contract.methods
        .initialize(
            d_Nexus.address,
            [d_mUSDProxy.address, d_BasketManagerProxy.address],
            bassetDetails.aavePlatformAddress,
            bassetDetails.aTokens.map((a) => a.bAsset),
            bassetDetails.aTokens.map((a) => a.aToken),
        )
        .encodeABI();
    await conditionalInitialize('AaveIntegrationProxy', () => {
        return d_AaveIntegrationProxy.methods["initialize(address,address,bytes)"](
            d_AaveIntegration.address,
            d_DelayedProxyAdmin.address,
            initializationData_AaveIntegration,
        );
    });

    console.log('Initialize compound');

    // 2.6. Init CompoundIntegration
    const initializationData_CompoundIntegration: string = d_CompoundIntegration.contract.methods
        .initialize(
            d_Nexus.address,
            [d_mUSDProxy.address, d_BasketManagerProxy.address],
            ZERO_ADDRESS, // We don't need Compound sys addr
            bassetDetails.cTokens.map((c) => c.bAsset),
            bassetDetails.cTokens.map((c) => c.cToken),
        )
        .encodeABI();
    await conditionalInitialize('CompoundIntegrationProxy', () => {
        return d_CompoundIntegrationProxy.methods["initialize(address,address,bytes)"](
            d_CompoundIntegration.address,
            d_DelayedProxyAdmin.address,
            initializationData_CompoundIntegration,
        );
    });

    console.log('Initialize BasketManager');

    // 2.7. Init BasketManager
    const initializationData_BasketManager: string = d_BasketManager.contract.methods
        .initialize(
            d_Nexus.address,
            d_mUSDProxy.address,
            bassetDetails.bAssets.map((b) => b.address),
            bassetDetails.platforms.map((p) =>
                p === Platform.aave
                    ? d_AaveIntegrationProxy.address
                    : d_CompoundIntegrationProxy.address,
            ),
            bassetDetails.bAssets.map(() => percentToWeight(100).toString()),
            bassetDetails.bAssets.map(() => false),
        )
        .encodeABI();
    await conditionalInitialize('BasketManagerProxy', () => {
        return d_BasketManagerProxy.methods["initialize(address,address,bytes)"](
            d_BasketManager.address,
            d_DelayedProxyAdmin.address,
            initializationData_BasketManager,
        );
    });

    // Savings Manager
    const d_SavingsManager = await conditionalDeploy(c_SavingsManager, 'SavingsManager', () => {
        return deployer.deploy(
            c_SavingsManager,
            d_Nexus.address,
            d_mUSDProxy.address,
            d_SavingsContract.address,
            { from: default_ },
        );
    });

    /***************************************
    4. Initialize Nexus Modules
    Dependencies: [
      New Governor,
      SavingsManager
    ]
  ****************************************/

    console.log('Initialize Nexus');

    const module_keys = [KEY_SAVINGS_MANAGER, KEY_PROXY_ADMIN];
    const module_addresses = [d_SavingsManager.address, d_DelayedProxyAdmin.address];
    const module_isLocked = [false, true];

    await conditionalInitialize('Nexus', () => {
        return d_Nexus.initialize(module_keys, module_addresses, module_isLocked, newGovernor, {
            from: governor,
        });
    });

    console.log(`[mUSD]: '${d_mUSDProxy.address}'`);
    console.log(`[mUSD impl]: '${d_mUSD.address}'`);
    console.log(`[BasketManager]: '${d_BasketManagerProxy.address}'`);
    console.log(`[BasketManager impl]: '${d_BasketManager.address}'`);
    console.log(`[AaveIntegration]: '${d_AaveIntegrationProxy.address}'`);
    console.log(`[CompoundIntegration]: '${d_CompoundIntegrationProxy.address}'`);
    console.log(`[SavingsManager]: '${d_SavingsManager.address}'`);
    console.log(`[SavingsContract]: '${d_SavingsContract.address}'`);
    console.log(`[Nexus]: '${d_Nexus.address}'`);
    console.log(`[ProxyAdmin]: '${d_DelayedProxyAdmin.address}'`);
};
