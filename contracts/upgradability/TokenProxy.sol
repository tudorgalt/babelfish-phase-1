pragma solidity 0.5.16;

import { AdminUpgradeabilityProxy } from "../openzeppelin/upgrades/contracts/upgradeability/AdminUpgradeabilityProxy.sol";

contract TokenProxy is AdminUpgradeabilityProxy {
    constructor(address _logic) AdminUpgradeabilityProxy(_logic, msg.sender, "") public payable {
    }
}
