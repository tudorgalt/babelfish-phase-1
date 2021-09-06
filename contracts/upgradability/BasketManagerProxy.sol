pragma solidity 0.5.17;

import { InitializableAdminUpgradeabilityProxy } from "../helpers/InitializableAdminUpgradeabilityProxy.sol";

/**
 * @title BasketManagerProxy
 * @dev Implements a proxy that allows to change the
 * BasketManager contract address.
 */
contract BasketManagerProxy is InitializableAdminUpgradeabilityProxy {}
