pragma solidity 0.5.16;
pragma experimental ABIEncoderV2;

import { SafeMath } from "@openzeppelin/contracts/math/SafeMath.sol";
import { Constants } from "../Constants.sol";

contract FeesManager {
    using SafeMath for uint256;

    // Public

    /**
     * @dev Calculate and return fee amount based on massetAmount
     * @param massetAmount  amount of masset to deposit / withdraw
     * @return fee          calculated   amount of fee
     */
    function calculateFee(uint256 massetAmount, uint256 feeAmount) public pure returns(uint256 fee) {
        return massetAmount.mul(feeAmount).div(Constants.getFeePrecision());
    }
}
