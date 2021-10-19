pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import { SignedSafeMath } from "../helpers/SignedSafeMath.sol";
import { SafeMath } from "@openzeppelin/contracts/math/SafeMath.sol";

import { InitializableOwnable } from "../helpers/InitializableOwnable.sol";
import "./BasketManagerV4.sol";

/**
 * @title RewardsManager
 * @dev Contract is responsible for rewards calculations using specified curves.
 */
contract RewardsManager is InitializableOwnable {
    using SignedSafeMath for int256;
    using SafeMath for uint256;

    int256 public constant PRECISION = 1000000;

    // State
    uint256 private slope;

    // Events

    /**
     * @dev Emitted when curve parameters has changed.
     * @param slope  New curve parameter.
     */
    event CurveParametersChanged(uint256 slope);

    // Initializer

    /**
     * @dev Contract initializer.
     * @param _slope    Slope value.
    */
    function initialize(uint256 _slope) external {

        _initialize();
        setSlope(_slope);
    }

    // Public

    function calculateReward(address _basset, int256 _bassetAmount, BasketManagerV4 _basketManager) public view returns(int256) {

        int256 deviationBefore = 0;
        int256 deviationAfter = 0;
        address[] bassets = _basketManager.getBassets();

        for(uint i=0; i<bassets.length; i++) {
            address currentBasset = bassets[i];

            uint256 weight = _adjustWeightPrecision(_basketManager.WEIGHT_PRECISION,
                _basketManager.getBassetWeight(currentBasset));
            uint256 simulatedWeight = _adjustWeightPrecision(_basketManager.WEIGHT_PRECISION,
                _basketManager.getSimulatedBassetWeight(currentBasset, _basset, _bassetAmount));
            uint256 targetWeight = _adjustWeightPrecision(_basketManager.WEIGHT_PRECISION,
                _basketManager.getBassetTargetWeight(currentBasset));

            deviationBefore = deviationBefore.add(_weightDifferenceSquare(weight, targetWeight));
            deviationAfter = deviationAfter.add(_weightDifferenceSquare(simulatedWeight, targetWeight));
        }
        deviationBefore = deviationBefore.div(bassets.length);
        deviationAfter = deviationAfter.div(bassets.length);

        return _calculateReward(deviationBefore, deviationAfter);
    }

    function _adjustWeightPrecision(uint256 _fromPrecision, uint256 _v) public view returns(uint256) {
        return _v.mul(PRECISION).div(_fromPrecision);
    }

    function _weightDifferenceSquare(uint256 _d1, uint256 _d2) internal pure returns(uint256) {
        int256 d = int256(_d1).sub(int256(_d2));
        return uint256(d.mul(d).div(PRECISION));
    }

    /**
     * @dev Calculate and return reward amount based on deviation before action and deviation after action.
     * @param _deviationBefore      Deviation before action.
     * @param _deviationAfter       Deviation after action.
     * @return reward               Calculated reward amount.
     */
    function _calculateReward(uint256 _deviationBefore, uint256 _deviationAfter) internal view returns(int256 reward) {

        if(slope == 0) return 0;

        uint256 vBefore = _calculateV(_deviationBefore);
        uint256 vAfter = _calculateV(_deviationAfter);

        reward = int256(vBefore).sub(int256(vAfter));
    }

    function _calculateV(uint256 _d) internal view returns(uint256 v) {

        uint256 v = slope.mul(_d).div(PRECISION);
        v = v.mul(PRECISION).div(PRECISION.sub(_d));
    }

    // Getters

    function getSlope() public view returns(uint256) {
        return slope;
    }

    // Governance

    function setSlope(uint256 _slope) public onlyOwner {
        slope = _slope;
        emit CurveParametersChanged(maxValue, _slope);
    }
}
