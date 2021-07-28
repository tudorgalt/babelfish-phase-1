pragma solidity 0.5.16;
pragma experimental ABIEncoderV2;
import "./Token.sol";

import { SafeMath } from "@openzeppelin/contracts/math/SafeMath.sol";

contract RewardsManager {
    // State

    using SafeMath for uint256;

    // Public

    function calculateReward (int256 deviationBefore, int256 deviationAfter) public view returns(int256 reward) {
        // !!  MOCK   !!
        return 200;
    }

}
