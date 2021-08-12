## **1. Project overview**
Sovryn is a non-custodial and permission-less smart contract based system for bitcoin lending, borrowing and margin trading. With Sovryn, you send your Bitcoin to a smart contract that allows you to keep custody of your private keys, allowing you to withdraw your funds at any time. Sovryn is permissionless in the sense that no one can censor a transaction, ban your account or require you to undergo KYC before trading.
Sovryn is built on the Rootstock(RSK) platform, which is a Bitcoin sidechain compatible with the Ethereum Virtual Machine that can support the smart contracts protocol.

Currently Available Features: 
- Spot-Exchange - a low cost, low-slippage, AMM allowing instant trades between tokens.
- Margin Trading - Creates up to 5X long/short trades, allowing users to borrow leverage from the lending pool.
- Lending Pool - Allows HODLers to earn interest by lending tokens to margin traders and borrowers.
- FastBTC Relay - Allows use of bitcoin almost instantly with smart contracts and decentralized products, from any bitcoin wallet.
     
Future Features:
- Borrow - Allows users and smart contracts to borrow tokens from the lending pool. All lending is over-collateralized.
- Perpetual Swaps - BTC backed perpetual swaps allowing trades with up to 20X leverage.
- Bitcoin-backed stablecoin - users can use a USD-pegged token, backed by overcollateralized bitcoin.


## **2. Diagram**

<img src="images/UML_diagram.png" />

## **3. Project structue**

Sources:
* contracts/
  - Migrations
* helpers/
  - BaseAdminUpgradeabilityProxy
  - InitializableAdminUpgradeabilityProxy
  - InitializableOwnable
  - InitializableReentrancyGuard
* masset/
  - BasketManager
  - BasketManagerV3
  - IBridge
  - Masset
  - MassetV3
  - Token
* mocks/
  * helpers/
    - InitializableOwnableWrapper
    - IReentrantMock
    - InitializableReentrancyMock
    - NonReentrantMock
    - ReentrantMock
* masset/
  - MockBasketManager
  - MockBridge
  - MockDummy
  - MockProxyImplementation
* shared/
  - MockERC20
  - MockProxy
* upgradability/
  - MockImplementation
* upgradability/
  - BasketManagerProxy
  - FeesVaultProxy
  - MassetProxy
* vault/
  - FeesVault 

## **4. yarn scripts**
Some scripts were defined in _pachage.json_ file. To execute the script run the following command: _yarn command_, for example _'yarn migrate'_. 
Here is the list of available scripts:
-    "migrate" - run migrations development network
-    "migrate:ropsten" - run migrations ropsten network
-    "migrate:kovan" - run migrations kowan network
-    "migrate:rskTestnet" - run migrations rskTestnet network
-    "lint"
-    "lint-ts"
-    "lint-sol"
-    "coverage"
-    "script"
-    "script:rskTestnet"
-    "script:rsk"
-    "test"
-    "test-file"
-    "test:fork"
-    "compile" - install project dependencies and compile
-    "prettify"
-    "flatten"
-    "prepublishOnly" - compile
-    "docgen" - generate docgen
