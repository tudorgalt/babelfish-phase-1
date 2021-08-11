pragma solidity 0.5.16;

import { InitializableAdminUpgradeabilityProxy } from "../helpers/InitializableAdminUpgradeabilityProxy.sol";

/**
 * @title MassetProxy
 * @dev This contract implements a proxy that allows to change the
 * Masset contract address.
 */
contract MassetProxy is InitializableAdminUpgradeabilityProxy {}
