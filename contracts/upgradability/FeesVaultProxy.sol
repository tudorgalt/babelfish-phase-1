pragma solidity 0.5.16;

import { InitializableAdminUpgradeabilityProxy } from "../helpers/InitializableAdminUpgradeabilityProxy.sol";

/**
 * @title FeesVaultProxy
 * @dev Implements a proxy that allows to change the
 * FeesVault contract address.
 */
contract FeesVaultProxy is InitializableAdminUpgradeabilityProxy {}
