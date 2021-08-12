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