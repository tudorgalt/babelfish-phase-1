pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import { SafeMath } from "@openzeppelin/contracts/math/SafeMath.sol";
import { InitializableOwnable } from "../helpers/InitializableOwnable.sol";

/**
 * @title FeesManager
 * @dev Contract is responsible for fees calculations.
 */
contract FeesManager is InitializableOwnable {
    using SafeMath for uint256;

    // State

    /**
     * @dev Factor of fees.
     * @notice a value of 10000 means that 223 equals 2.23% and 10000 equals 100%
     */
    uint256 constant public PRECISION = 10000;
    uint256 private withdrawalFee;

    // Events
    /**
     * @dev Emitted when withdrawal fee has changed.
     * @param withdrawalFee         Amount of the fee.
     */
    event WithdrawalFeeChanged (uint256 withdrawalFee);

    // Initializer

    /**
     * @dev Contract initializer.
     * @param _withdrawalFee        Amount of redeem fee in promils.
    */
    function initialize(uint256 _withdrawalFee) external {
        InitializableOwnable._initialize();
        setWithdrawalFee(_withdrawalFee);
    }

    // Public

    /**
     * @dev Calculate and return redeem fee amount based on massetAmount.
     * @param _divergence  Amount of masset.
     * @return fee           Calculated fee amount.
     */
    function calculateRedeemFee(uint256 _divergence) external view returns(uint256) {
        return _divergence.mul(withdrawalFee).div(PRECISION);
    }
    // Getters

    function getWithdrawalFee() external view returns(uint256) {
        return withdrawalFee;
    }

    // Governance methods
    function setWithdrawalFee (uint256 _amount) public onlyOwner {
        require(_amount <= PRECISION, "invalid fee amount");

        withdrawalFee = _amount;
        emit WithdrawalFeeChanged(_amount);
    }
}
