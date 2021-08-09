pragma solidity ^0.5.16;

import { InitializableOwnable } from "../../helpers/InitializableOwnable.sol";

contract InitializableOwnableWrapper is InitializableOwnable {
    function initialize() public {
        _initialize();
    }
}
