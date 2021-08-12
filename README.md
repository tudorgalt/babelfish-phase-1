# **1. Project overview"**
Sovryn is a decentralized protocol for Bitcoin lending and margin trading. The protocol is built on Bitcoin-based smart contract platform RSK.

**2. Diagram**

<img src="images/UML_diagram.png" />

**3. Project structue**

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

**4. yarn commands**
There are some commands which improve work with the code. All of them can be found in _pachage.json_ file. To execute command it enough to write 'yarn <command>', eg _'yarn migrate'_.
    "migrate"
    "migrate:ropsten"
    "migrate:kovan"
    "migrate:rskTestnet"
    "lint"
    "lint-ts"
    "lint-sol"
    "coverage"
    "script"
    "script:rskTestnet"
    "script:rsk"
    "test"
    "test-file"
    "test:fork"
    "compile"
    "prettify"
    "flatten"
    "prepublishOnly"
    "docgen"