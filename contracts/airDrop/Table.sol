pragma solidity ^0.5.16;

import "@openzeppelin/contracts/ownership/Ownable.sol";

contract Table is Ownable {
    address[] public addresses;
    uint256[] public amounts;

    uint256 public totalValue;
    uint256 public totalLength;

    function getRecipentInfo(uint256 index) public view returns(address, uint256, bool) {
        return (addresses[index], amounts[index], index == totalLength -1);
    } 

    function totalAmount() public view returns(uint256 total){
        return 0;
    }

    function getSize() public view returns(uint256 size) {
        return 0;
    }

    function destroy() public {

    }
}
