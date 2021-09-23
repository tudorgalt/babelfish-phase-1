pragma solidity ^0.5.16;

import "@openzeppelin/contracts/ownership/Ownable.sol";

contract Table {
    address[] public addresses;
    uint256[] public amounts;

    function getRecipentInfo(uint256 index) public view returns(address, uint256, bool) {
        return (addresses[index], amounts[index], index == getSize() - 1);
    }

    function getSize() public view returns(uint256 size);
}
