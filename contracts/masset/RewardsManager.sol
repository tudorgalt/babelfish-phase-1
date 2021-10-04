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
    uint256 public deviationPrecision;

    uint256 private maxValue;
    uint256 private slope;

    bool initialized;

    // Events

    /**
     * @dev Emitted when curve parameters has changed.
     * @param maxValue  New max value parameter.
     * @param slope     New slope parameter.
     */
    event CurveParametersChanged(uint256 maxValue, uint256 slope);

    // Initializer

    /**
     * @dev Contract initializer.
     * @param _maxValue             Max value of curve in point.
     * @param _slope                Slope regulation value.
     * @param _deviationPrecision   Deviation precision. Should be the same as in BasketManagerv4.
    */
    function initialize(uint256 _maxValue, uint256 _slope, uint256 _deviationPrecision) external {
        require(initialized == false, "already initialized");
        require(_deviationPrecision >= 1000, "precision should be greater or equal to 1000");

        _initialize();

        setMaxValue(_maxValue);
        setSlope(_slope);
        // we div by 1000 because we operate on promils
        deviationPrecision = _deviationPrecision / 1000;
        initialized = true;
    }

    // Public

    /**
     * @dev Calculate and return reward amount based on deviation before action and deviation after action.
     * @param _deviationBefore      Deviation before action.
     * @param _deviationAfter       Deviation after action.
     * @param _isDeposit            Flag to determine action(mint/redeem).
     * @return reward               Calculated reward amount.
     */
    function calculateReward(int256 _deviationBefore, int256 _deviationAfter, bool _isDeposit) public view returns(int256 reward) {
        require(initialized, "not initialized");

        int256 y = 0;
        if (_deviationBefore == _deviationAfter) {
            y = pointOnCurve(_deviationBefore);
        }else if(_deviationBefore > _deviationAfter) {
            y = segmentOnCurve(_deviationAfter, _deviationBefore);
        }else {
            y = segmentOnCurve(_deviationBefore, _deviationAfter);
        }

        int256 ammount = y;

        return _isDeposit ? -ammount : ammount;
    }

    /**
     * @dev Calculate a surface area under a segment of a curve.
     * @param _x1   From point
     * @param _x2   To point
     * @return y    Area
     */
    function segmentOnCurve(int256 _x1, int256 _x2) public view returns(int256 y) {
        require(_x1 < _x2, "x1 must be less than x2");

        if(_x1 == 0) {
            return integrateOnCurve(_x2);
        }else if(_x2 == 0) {
            return -integrateOnCurve(-_x1);
        }else if(_x1 < 0 && _x2 > 0) {
            int256 dx1 = integrateOnCurve(-_x1);
            int256 dx2 = integrateOnCurve(_x2);
            return dx2 - dx1;
        }else if(_x1 < 0 && _x2 < 0) {
            int256 dx2 = integrateOnCurve(-_x2);
            int256 dx1 = integrateOnCurve(-_x1);
            return -(dx1.sub(dx2));    
        }

        int256 dx1 = integrateOnCurve(_x1);
        int256 dx2 = integrateOnCurve(_x2);
        return dx2 - dx1;
    }

    /**
     * @dev Calculate curve value at given point.
     * @param _x    Point
     * @return y    Value
     */
    function pointOnCurve(int256 _x) public view returns(int256 y) {
        if(_x < 0) {
            return -valueOnSigmoidCurve(-_x);
        }
        return valueOnSigmoidCurve(_x);
    }

    function integrateOnCurve(int256 _x) public view returns(int256 y) {
        return integrateOnSigmoidCurve(_x);
    }

    /**
     * @dev Calculate curve value at given point for x >= 0;
     * @param _x    Point
     * @return y    Value
     */
    function valueOnSigmoidCurve(int256 _x) public view returns(int256 y) {
        require(_x >= 0, "x must be greater than equal to 0");

        uint256 w = maxValue;
        uint256 z = slope;

        bytes16 wabd = ABDKMathQuad.fromUInt(w);
        bytes16 zabd = ABDKMathQuad.fromUInt(z);
        bytes16 xabd = ABDKMathQuad.fromInt(_x);
        xabd = ABDKMathQuad.div(xabd, ABDKMathQuad.fromUInt(deviationPrecision));

        bytes16 wz = ABDKMathQuad.mul(wabd, zabd);
        bytes16 nominator = ABDKMathQuad.mul(wabd, xabd);
        bytes16 xsqr = ABDKMathQuad.mul(xabd, xabd);
        
        bytes16 denominator = ABDKMathQuad.add(xsqr, wz);
        denominator = ABDKMathQuad.sqrt(denominator);

        bytes16 value = ABDKMathQuad.div(nominator, denominator);
        
        return ABDKMathQuad.toInt(value);
    }

    /**
     * @dev Integrate curve value from x=0 to given point;
     * @param _x    Point
     * @return y    Value
     */
    function integrateOnSigmoidCurve(int256 _x) public view returns(int256 y) {
        require(_x >= 0, "x must be greater than equal to 0");

        uint256 w = maxValue;
        uint256 z = slope;

        bytes16 wabd = ABDKMathQuad.fromUInt(w);
        bytes16 zabd = ABDKMathQuad.fromUInt(z);
        bytes16 xabd = ABDKMathQuad.fromInt(_x);
        xabd = ABDKMathQuad.div(xabd, ABDKMathQuad.fromUInt(deviationPrecision));

        bytes16 wz = ABDKMathQuad.mul(wabd, zabd);
        bytes16 xsqr = ABDKMathQuad.mul(xabd, xabd);
        
        bytes16 wzsqrt =ABDKMathQuad.sqrt(wz);

        bytes16 value = ABDKMathQuad.add(xsqr, wz);
        value = ABDKMathQuad.sqrt(value);
        value = ABDKMathQuad.sub(value, wzsqrt);
        value = ABDKMathQuad.mul(value, wabd);

        return ABDKMathQuad.toInt(value);
    }

    // Getters

    function getMaxValue () public view returns(uint256) {
        return maxValue;
    }

    function getSlope () public view returns(uint256) {
        return slope;
    }

    // Governance

    function setMaxValue (uint256 _maxValue) public onlyOwner {
        require(_maxValue > 0, "max value must be greater than 0");
        maxValue = _maxValue;

        emit CurveParametersChanged(_maxValue, slope);
    }


    function setSlope (uint256 _slope) public onlyOwner {
        require(_slope > 0, "slope must be greater than 0");
        slope = _slope;

        emit CurveParametersChanged(maxValue, _slope);
    }
}
