pragma solidity ^0.5.16;

import "@openzeppelin/contracts/ownership/Ownable.sol";

contract Table {

    function getRecipentInfo(uint256 index) public view returns(address, uint256, bool);
    function getSize() public view returns(uint256 size);
}
