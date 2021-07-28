pragma solidity 0.5.16;
pragma experimental ABIEncoderV2;
import "./Token.sol";

import { SafeMath } from "@openzeppelin/contracts/math/SafeMath.sol";

contract RewardsManager {
    // State

    using SafeMath for uint256;

    // Public

    function calculateDepositReward (uint256 amount) public view returns(int256 reward) {
        // !!  MOCK   !!
        return int256(amount.mul(2).div(100)); 
    }

    function calculateWithdrawalReward (uint256 amount) public view returns(int256 reward) {
        // !!  MOCK   !!
        return int256(amount.mul(2).div(100)); 
    }
}
