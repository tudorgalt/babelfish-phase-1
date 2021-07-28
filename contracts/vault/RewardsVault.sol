pragma solidity 0.5.16;

import { Token } from "../masset/Token.sol";
import { ApproverRole } from "../roles/ApproverRole.sol";

contract RewardsVault is ApproverRole {
    // State

    bool isInitialized = false;

    // Initializer

    function initialize() external {
        require(isInitialized == false, "already initialized");

        ApproverRole._initialize();
        isInitialized = true;
    }

    // Public

    /**
     * @dev Get approval to spend vault's funds
     * @param  amount       Amount of tokens to approve
     * @param  tokenAddress Address of token to approve
     */
    function getApproval(uint256 amount, address tokenAddress) public onlyApprover {
        Token(tokenAddress).approve(msg.sender, amount);
    }
}
