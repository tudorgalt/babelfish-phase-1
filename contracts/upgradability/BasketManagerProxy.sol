pragma solidity 0.5.16;

import { InitializableAdminUpgradeabilityProxy } from "../helpers/InitializableAdminUpgradeabilityProxy.sol";

/**
 * @title BasketManagerProxy
 * @dev This contract implements a proxy that allows to change the
 * BasketManager contract address.
 */
contract BasketManagerProxy is InitializableAdminUpgradeabilityProxy {}
