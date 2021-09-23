pragma solidity ^0.5.17;

contract IVestingRegistry3 {

    /**
     * @notice creates Vesting contract
     * @param _tokenOwner the owner of the tokens
     * @param _amount the amount to be staked
     * @param _cliff the cliff in seconds
     * @param _duration the total duration in seconds
     */
    function createVesting(
        address _tokenOwner,
        uint256 _amount,
        uint256 _cliff,
        uint256 _duration
    ) public;

    /**
     * @notice creates Team Vesting contract
     * @param _tokenOwner the owner of the tokens
     * @param _amount the amount to be staked
     * @param _cliff the cliff in seconds
     * @param _duration the total duration in seconds
     */
    function createTeamVesting(
        address _tokenOwner,
        uint256 _amount,
        uint256 _cliff,
        uint256 _duration
    ) public;

    /**
     * @notice stakes tokens according to the vesting schedule
     * @param _vesting the address of Vesting contract
     * @param _amount the amount of tokens to stake
     */
    function stakeTokens(address _vesting, uint256 _amount) public {}

    /**
     * @notice returns vesting contract address for the given token owner
     * @param _tokenOwner the owner of the tokens
     */
    function getVesting(address _tokenOwner) public view returns (address);

    /**
     * @notice returns team vesting contract address for the given token owner
     * @param _tokenOwner the owner of the tokens
     */
    function getTeamVesting(address _tokenOwner) public view returns (address);

    function addAdmin(address _admin) public;
}
