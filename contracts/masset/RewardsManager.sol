pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import { SignedSafeMath } from "../helpers/SignedSafeMath.sol";
import { ABDKMathQuad } from "../helpers/ABDKMathQuad.sol";

import { InitializableOwnable } from "../helpers/InitializableOwnable.sol";

import "hardhat/console.sol";

/**
 * @title RewardsManager
 * @dev Contract is responsible for rewards calculations using specified curves.
 */
contract RewardsManager is InitializableOwnable {
    using SignedSafeMath for int256;

    // State

    int256 aCurveDenominator;
    bool initialized;

    // Events

    /**
     * @dev Emitted when curve parameter has changed.
     * @param aDominator    New curve parameter.
     */
    event ADenominatorChanged(int256 aDominator);

    // Initializer

    /**
     * @dev Contract initializer.
     * @param _aCurveDenominator  Curve parameter a. f(x) = 1/a * x^2
    */
    function initialize(int256 _aCurveDenominator) external {
        require(initialized == false, "already initialized");
        _initialize();

        setACurveDenominator(_aCurveDenominator);
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
            return -valueOnCurve(-_x);
        }
        return valueOnCurve(_x);
    }

    /**
     * @dev Calculate curve value at given point for x >= 0;
     * @param _x    Point
     * @return y    Value
     */
    function valueOnCurve(int256 _x) public view returns(int256 y) {
        require(_x >= 0, "x must be greater than equal to 0");
        return _x.mul(_x).div(aCurveDenominator);
    }

    /**
     * @dev Integrate curve value from x=0 to given point;
     * @param _x    Point
     * @return y    Value
     */
    function integrateOnCurve(int256 _x) public view returns(int256 y) {
        require(_x >= 0, "x must be greater than equal to 0");
        return _x.mul(_x).mul(_x).div(3).div(aCurveDenominator);
    }

        /**
     * @dev Calculate curve value at given point for x >= 0;
     * @param _x    Point
     * @return y    Value
     */
    function valueOnCurveSigmoid(int256 _x) public view returns(int256 y) {
        require(_x >= 0, "x must be greater than equal to 0");

        uint256 w = 100000;
        uint256 p = 200000;

        bytes16 precision = ABDKMathQuad.fromUInt(100000);

        bytes16 wabd = ABDKMathQuad.fromUInt(w);
        bytes16 rabd = ABDKMathQuad.div(
            ABDKMathQuad.fromUInt(p),
            precision
        );
        rabd = ABDKMathQuad.div(rabd, wabd);

        bytes16 xabd = ABDKMathQuad.fromInt(_x);

        bytes16 nominator = ABDKMathQuad.add(wabd, wabd);

        bytes16 rx = ABDKMathQuad.mul(rabd, xabd);
        rx = ABDKMathQuad.neg(rx);

        bytes16 denominator = ABDKMathQuad.exp(rx);
        denominator = ABDKMathQuad.add(denominator, ABDKMathQuad.fromUInt(1));

        bytes16 value = ABDKMathQuad.div(nominator, denominator);
        value = ABDKMathQuad.sub(value, wabd);
        return ABDKMathQuad.toInt(value);
    }

    /**
     * @dev Integrate curve value from x=0 to given point;
     * @param _x    Point
     * @return y    Value
     */
    function integrateOnCurveSigmoid(int256 _x) public view returns(int256 y) {
        require(_x >= 0, "x must be greater than equal to 0");

        uint256 w = 100000;
        uint256 p = 200000;

        bytes16 precision = ABDKMathQuad.fromUInt(100000);

        /*
            r = p / precission / w
            rx = r * x
            wr = 2w / r
            wx = w * x
            value = ln(e ^ (rx) + 1) * wr - wx
        */

        bytes16 wabd = ABDKMathQuad.fromUInt(w);
        bytes16 rabd = ABDKMathQuad.div(
            ABDKMathQuad.fromUInt(p),
            precision
        );
        rabd = ABDKMathQuad.div(rabd, wabd);

        bytes16 xabd = ABDKMathQuad.fromInt(_x);

        bytes16 rx = ABDKMathQuad.mul(rabd, xabd);

        bytes16 wr = ABDKMathQuad.add(wabd, wabd);
        wr = ABDKMathQuad.div(wr, rabd);
        
        bytes16 wx = ABDKMathQuad.mul(wabd, xabd);
        bytes16 value = ABDKMathQuad.exp(rx);
        value = ABDKMathQuad.add(value, ABDKMathQuad.fromUInt(1));
        value = ABDKMathQuad.ln(value);
        value = ABDKMathQuad.mul(value, wr);
        value = ABDKMathQuad.sub(value, wx);

        console.log("calka");
        console.logInt(ABDKMathQuad.toInt(value));

        return ABDKMathQuad.toInt(value);
    }

    // Getters

    function getACurveDenominator () public view returns(int256) {
        return aCurveDenominator;
    }

    // Governance

    function setACurveDenominator (int256 _aCurveDenominator) public onlyOwner {
        require(_aCurveDenominator > 0, "x^2/A: A must be greater than zero.");
        aCurveDenominator = _aCurveDenominator;

        emit ADenominatorChanged(_aCurveDenominator);
    }
}
