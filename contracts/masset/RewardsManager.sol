pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import { SafeMath } from "@openzeppelin/contracts/math/SafeMath.sol";
import { InitializableOwnable } from "../helpers/InitializableOwnable.sol";

contract RewardsManager is InitializableOwnable {
    int256 aCurveDenominator;

    bool initialized;

    // Initializer
    function initialize(int256 _aCurveDenominator) external {
        require(_aCurveDenominator > 0, "x^2/A: A must be greater than zero.");
        require(initialized == false, "already initialized");
        _initialize();

        initialized = true;
        aCurveDenominator = _aCurveDenominator;
    }

    // Public
    function calculateReward(int256 _deviationBefore, int256 _deviationAfter, bool _isDeposit) public view returns(int256 reward) {
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

    function pointOnCurve(int256 _x) public view returns(int256 y) {
        require(_x >= 0, "x must be greater than equal to 0");
        return _x*_x / aCurveDenominator;
    }

    function integrateOnCurve(int256 _x) public view returns(int256 y) {
        require(_x >= 0, "x must be greater than equal to 0");
        return _x*_x*_x / 3 / aCurveDenominator;
    }
}
