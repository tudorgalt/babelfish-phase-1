pragma solidity 0.5.16;

/// @notice Constants for development testnet usages;
/// Created for testing and should NOT be deployed on mainnet or mainnet-like ("staging") environments.

library DevelopmentConstants {
    uint256 constant MAX_BASKET_VALUE = 1000;

    // Precisions
    /**
     * @dev Factor of fees. 1000 means that fees are in promils
     */
    uint256 constant private FEE_PRECISION = 1000;
    uint256 constant private REWARDS_PRECISION = 1000;

    // Getter for easy access
    function getMaxBasketValue() external pure returns (uint256) { return MAX_BASKET_VALUE; }

    function getFeePrecision() external pure returns (uint256) { return FEE_PRECISION; }
    function getRewardsPrecision() external pure returns (uint256) { return REWARDS_PRECISION; }
}
