pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/math/SafeMath.sol";
import { InitializableOwnable } from "../helpers/InitializableOwnable.sol";

/**
 * @title RewardsManager
 * @dev Contract is responsible for rewards calculations using specified curves.
 */
contract RewardsManager is InitializableOwnable {
    using SafeMath for uint256;

    // State
    uint256 constant SLOPE_PRECISION = 1000;
    uint256 public deviationPrecision;
    uint256 private slope;

    bool initialized;

    // Events

    /**
     * @dev Emitted when curve parameters has changed.
     * @param slope  New curve parameter.
     */
    event CurveParametersChanged(uint256 slope);

    // Initializer

    /**
     * @dev Contract initializer.
     * @param _slope                Slope regulation value. In thousands parts.
     * @param _deviationPrecision   Deviation precision. Should be the same as in BasketManagerv4.
    */
    function initialize(uint256 _slope, uint256 _deviationPrecision) external {
        require(initialized == false, "already initialized");
        require(isPowerOfTen(_deviationPrecision), "precision must be a power of 10");

        _initialize();

        setSlope(_slope);
        deviationPrecision = _deviationPrecision;
        initialized = true;
    }

    // Public

    /**
     * @dev Calculate and return reward amount based on deviation before action and deviation after action.
     * @param _deviation        Deviation before action.
     * @param _deviationAfter   Deviation after action.
     * @param _total            Total pool amount before action.
     * @param _totalAfter       Total pool amount after action.
     * @return reward           Calculated reward amount.
     */
    function calculateReward(uint256 _deviation, uint256 _deviationAfter, uint256 _total, uint256 _totalAfter) public view returns(int256 reward) {
        require(initialized, "not initialized");

        uint256 value = calculateValue(_deviation, _total);
        uint256 valueAfter = calculateValue(_deviationAfter, _totalAfter);

        int256 reward = valueAfter > value
            ? int256(valueAfter.sub(value))
            : int256(-value.sub(valueAfter));
        reward = -reward;

        return reward;
    }

    // Internal

    /**
     * @dev Calculate reward amount for certain deviation.
     * @param _deviation        Deviation before action.
     * @param _total            Total pool amount before action.
     * @return reward           Calculated reward value.
     */
    function calculateValue(uint256 _deviation, uint256 _total) internal view returns(uint256 value) {
        require(_deviation < deviationPrecision, "deviaiton must be less than 1");

        uint256 nominator = slope.mul(_total).mul(_deviation);
        uint256 denominator = deviationPrecision.sub(_deviation);
        uint256 value = nominator.div(denominator).div(SLOPE_PRECISION);

        return value;
    }

    /**
     * @dev Returns true if the number is power of ten.
     * @param x     Number to be checked.
     * @return      Is the number power of ten.
     */
    function isPowerOfTen(uint256 x) public view returns (bool result) {
        uint256 number = x;

        while (number >= 10 && number % 10 == 0) {
            number /= 10;
        }

        result = number == 1;
    }

    // Getters

    function getSlope () public view returns(uint256) {
        return slope;
    }

    // Governance

    function setSlope (uint256 _slope) public onlyOwner {
        require(_slope > 0, "slope must be > 0");
        require(_slope < SLOPE_PRECISION, "slope must be lesser than precision");
        slope = _slope;

        emit CurveParametersChanged( _slope);
    }
}
