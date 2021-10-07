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

    int256 constant MAX_PERMILLE = 1000;

    // State
    uint256 private slope;

    // Events

    /**
     * @dev Emitted when curve parameters has changed.
     * @param slope     New slope parameter.
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

    /**
     * @dev Calculate and return reward amount based on deviation before action and deviation after action.
     * @param _deviationBefore      Deviation before action.
     * @param _deviationAfter       Deviation after action.
     * @return reward               Calculated reward amount.
     */
    function calculateReward(int256 _deviationBefore, int256 _deviationAfter) public view returns(int256 reward) {

        require(_deviationBefore >= -MAX_PERMILLE && _deviationBefore <= MAX_PERMILLE, "invalud value for _deviationBefore");
        require(_deviationAfter >= -MAX_PERMILLE && _deviationAfter <= MAX_PERMILLE, "invalud value for _deviationAfter");

        int256 vBefore = calculateVault(_deviationBefore);
        int256 vAfter = calculateVault(_deviationAfter);

        reward = vAfter - vBefore;
    }

    function calculateVault(int256 _d) internal view returns(int256 v) {

        int256 v = int256(slope);
        v = v.mul(_d).div(MAX_PERMILLE);
        v = v.mul(MAX_PERMILLE).div(MAX_PERMILLE - _d);
    }

    // Getters

    function getSlope () public view returns(uint256) {
        return slope;
    }

    // Governance

    function setSlope (uint256 _slope) public onlyOwner {
        require(_slope > 0, "slope must be greater than 0");
        slope = _slope;

        emit CurveParametersChanged(_slope);
    }
}
