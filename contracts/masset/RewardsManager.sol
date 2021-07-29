pragma solidity 0.5.16;
pragma experimental ABIEncoderV2;

import { SafeMath } from "@openzeppelin/contracts/math/SafeMath.sol";
import { InitializableOwnable } from "../helpers/InitializableOwnable.sol";

contract RewardsManager is InitializableOwnable {
    
    bool initialized;
    using SafeMath for uint256;

// Initializer

    function initialize() external {
        require(initialized == false, "already initialized");
        initialized = true;
        _initialize();
    }
    // Public

    function calculateReward (int256 deviationBefore, int256 deviationAfter) public view returns(int256 reward) {
        if (deviationBefore == deviationAfter) {
            return pointOnCurve(deviationBefore);
        }else if(deviationBefore > deviationAfter) {
            return segmentOnCurve(deviationAfter, deviationBefore);
        }

        return segmentOnCurve(deviationBefore, deviationAfter);
    }

    function segmentOnCurve(int256 x1, int256 x2) public view returns(int256 y) {
        require(x1 < x2, "x1 must be less than x2");

        if(x1 == 0) {
            return integrateOnCurve(x2);
        }else if(x2 == 0) {
            return -integrateOnCurve(-x1);
        }else if(x1 < 0 && x2 > 0) {
            int256 dx1 = integrateOnCurve(-x1);
            int256 dx2 = integrateOnCurve(x2);
            return dx2 - dx1;
        }else if(x1 < 0 && x2 < 0) {
            int256 dx2 = integrateOnCurve(-x2);
            int256 dx1 = integrateOnCurve(-x1);
            return -(dx1 - dx2);    
        }

        int256 dx1 = integrateOnCurve(x1);
        int256 dx2 = integrateOnCurve(x2);
        return dx2 - dx1;
    }

    function pointOnCurve(int256 x) public view returns(int256 y) {
        return x*x;
    }

    function integrateOnCurve(int256 x) public view returns(int256 y) {
        return x*x*x/3;
    }
}
