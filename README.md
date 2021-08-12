<img src="images/UML_diagram.png" />

**1. Project structue.**

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
