pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import { SignedSafeMath } from "../helpers/SignedSafeMath.sol";
import { ABDKMathQuad } from "../helpers/ABDKMathQuad.sol";

import { InitializableOwnable } from "../helpers/InitializableOwnable.sol";

/**
 * @title RewardsManager
 * @dev Contract is responsible for rewards calculations using specified curves.
 */
contract RewardsManager is InitializableOwnable {
    using SignedSafeMath for int256;

    // State
    bytes16 public deviationPrecision;
    bytes16 private slope;

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
        require(_deviationPrecision >= 1000, "precision should be greater or equal to 1000");

        _initialize();

        setSlope(_slope);
        // we div by 1000 because we operate on promils
        deviationPrecision = ABDKMathQuad.fromUInt(_deviationPrecision / 1000);
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

        bytes16 value = calculateValue(_deviation, _total);
        bytes16 valueAfter = calculateValue(_deviationAfter, _totalAfter);

        bytes16 reward = ABDKMathQuad.sub(valueAfter, value);

        return ABDKMathQuad.toInt(reward);
    }

    // Internal

    /**
     * @dev Calculate reward amount for certain deviation.
     * @param _deviation        Deviation before action.
     * @param _total            Total pool amount before action.
     * @return reward           Calculated reward value.
     */
    function calculateValue(uint256 _deviation, uint256 _total) internal view returns(bytes16 value) {
        bytes16 total = ABDKMathQuad.fromUInt(_total);

        bytes16 deviation = ABDKMathQuad.fromUInt(_deviation);
        deviation = ABDKMathQuad.div(deviation, deviationPrecision);

        bytes16 c = ABDKMathQuad.div(slope, ABDKMathQuad.fromUInt(1000));

        bytes16 denominator = ABDKMathQuad.fromUInt(1);
        denominator = ABDKMathQuad.sub(denominator, deviation);

        bytes16 nominator = ABDKMathQuad.mul(c, total);
        nominator = ABDKMathQuad.mul(nominator, deviation);

        bytes16 value = ABDKMathQuad.div(nominator, denominator);
        return value;
    }

    // Getters

    function getSlope () public view returns(uint256) {
        return ABDKMathQuad.toUInt(slope);
    }

    // Governance

    function setSlope (uint256 _slope) public onlyOwner {
        require(_slope > 0, "slope must be greater than 0");
        slope = ABDKMathQuad.fromUInt(_slope);

        emit CurveParametersChanged( _slope);
    }
}
