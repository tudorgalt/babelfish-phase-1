pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import { SafeMath } from "@openzeppelin/contracts/math/SafeMath.sol";
import { InitializableOwnable } from "../helpers/InitializableOwnable.sol";
import "hardhat/console.sol";

/**
 * @title RewardsManager
 * @dev Contract is responsible for rewards calculations using specified curves.
 */
contract RewardsManager is InitializableOwnable {
    int256 aCurveDenominator;

    bool initialized;

    // Initializer

    /**
     * @dev Contract initializer.
     * @param _aCurveDenominator  Curve parameter a. f(x) = 1/a * x^2
    */
    function initialize(int256 _aCurveDenominator) external {
        require(_aCurveDenominator > 0, "x^2/A: A must be greater than zero.");
        require(initialized == false, "already initialized");
        _initialize();

        initialized = true;
        aCurveDenominator = _aCurveDenominator;
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
            return -(dx1 - dx2);    
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
        return _x*_x / aCurveDenominator;
    }

    /**
     * @dev Integrate curve value from x=0 to given point;
     * @param _x    Point
     * @return y    Value
     */
    function integrateOnCurve(int256 _x) public view returns(int256 y) {
        require(_x >= 0, "x must be greater than equal to 0");
        return _x*_x*_x / 3 / aCurveDenominator;
    }
}
