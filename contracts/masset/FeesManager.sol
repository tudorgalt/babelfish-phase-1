pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import { SafeMath } from "@openzeppelin/contracts/math/SafeMath.sol";
import { InitializableOwnable } from "../helpers/InitializableOwnable.sol";

/**
 * @title RewaFeesManagerrdsManager
 * @dev Contract is responsible for fees calculations.
 */
contract FeesManager is InitializableOwnable {
    using SafeMath for uint256;

    // State

    /**
     * @dev Factor of fees.
     * @notice 1000 means that fees are in per mille.
     */
    uint256 constant public PRECISION = 1000;

    uint256 private depositFee;
    uint256 private depositBridgeFee;
    uint256 private withdrawalFee;
    uint256 private withdrawalBridgeFee;

    // Events

    /**
     * @dev Emitted when deposit fee has changed.
     * @param depositFee            Amount of the fee.
     */
    event DepositFeeChanged (uint256 depositFee);

    /**
     * @dev Emitted when deposit bridge fee has changed.
     * @param depositBridgeFee      Amount of the fee.
     */
    event DepositBridgeFeeChanged (uint256 depositBridgeFee);

    /**
     * @dev Emitted when withdrawal fee has changed.
     * @param withdrawalFee         Amount of the fee.
     */
    event WithdrawalFeeChanged (uint256 withdrawalFee);

    /**
     * @dev Emitted when withdrawal bridge fee has changed.
     * @param withdrawalBridgeFee   Amount of the fee.
     */
    event WithdrawalBridgeFeeChanged (uint256 withdrawalBridgeFee);

    // Initializer

    /**
     * @dev Contract initializer.
     * @param _depositFee           Amount of deposit fee in promils.
     * @param _depositBridgeFee     Amount of deposit through bridge fee in promils.
     * @param _withdrawalFee        Amount of redeem fee in promils.
     * @param _withdrawalBridgeFee  Amount of redeem through bridge fee in promils.
    */
    function initialize(
        uint256 _depositFee,
        uint256 _depositBridgeFee,
        uint256 _withdrawalFee,
        uint256 _withdrawalBridgeFee
    ) public {
        InitializableOwnable._initialize();

        setDepositFee(_depositFee);
        setDepositBridgeFee(_depositBridgeFee);
        setWithdrawalFee(_withdrawalFee);
        setWithdrawalBridgeFee(_withdrawalBridgeFee);
    }

    // Internal

    /**
     * @dev Calculate and return fee amount based on massetAmount and type of fee.
     */
    function _calculateFee(uint256 _massetAmount, uint256 _fee) internal pure returns(uint256) {
        return _massetAmount.mul(_fee).div(PRECISION);
    }

    // Public

    /**
     * @dev Calculate and return deposit fee amount based on massetAmount.
     * @param _massetAmount  Amount of masset to deposit.
     * @return fee           Calculated fee amount.
     */
    function calculateDepositFee(uint256 _massetAmount) public view returns(uint256) {
        return _calculateFee(_massetAmount, depositFee);
    }

    /**
     * @dev Calculate and return fee for deposit through bridge.
     * @param _massetAmount  Amount of masset to deposit.
     * @return fee           Calculated fee amount.
     */
    function calculateDepositBridgeFee(uint256 _massetAmount) public view returns(uint256) {
        return _calculateFee(_massetAmount, depositBridgeFee);
    }

    /**
     * @dev Calculate and return redeem fee amount based on massetAmount.
     * @param _massetAmount  Amount of masset.
     * @return fee           Calculated fee amount.
     */
    function calculateRedeemFee(uint256 _massetAmount) public view returns(uint256) {
        return _calculateFee(_massetAmount, withdrawalFee);
    }

    /**
     * @dev Calculate and return fee for redeem through bridge.
     * @param _massetAmount  Amount of masset.
     * @return fee           Calculated fee amount.
     */
    function calculateRedeemBridgeFee(uint256 _massetAmount) public view returns(uint256) {
        return _calculateFee(_massetAmount, withdrawalBridgeFee);
    }

    // Getters

    function getDepositFee () external view returns(uint256) {
        return depositFee;
    }

    function getDepositBridgeFee () external view returns(uint256) {
        return depositBridgeFee;
    }

    function getWithdrawalFee () external view returns(uint256) {
        return withdrawalFee;
    }

    function getWithdrawalBridgeFee () external view returns(uint256) {
        return withdrawalBridgeFee;
    }

    // Governance methods

    function setDepositFee (uint256 _amount) public onlyOwner {
        depositFee = _amount;

        emit DepositFeeChanged(_amount);
    }

    function setDepositBridgeFee (uint256 _amount) public onlyOwner {
        depositBridgeFee = _amount;

        emit DepositBridgeFeeChanged(_amount);
    }

    function setWithdrawalFee (uint256 _amount) public onlyOwner {
        withdrawalFee = _amount;

        emit WithdrawalFeeChanged(_amount);
    }

    function setWithdrawalBridgeFee (uint256 _amount) public onlyOwner {
        withdrawalBridgeFee = _amount;

        emit WithdrawalBridgeFeeChanged(_amount);
    }
}
