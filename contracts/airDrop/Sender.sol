pragma solidity ^0.5.16;

import "@openzeppelin/contracts/ownership/Ownable.sol";
import "../fish/interfaces/IERC20.sol";
import {Table} from "./Table.sol";

contract Sender is Ownable {
    uint256 public index;

    IERC20 public token;
    address[] private tables;
    uint256 public total;
    uint256 public batchSize;

    constructor(address[] memory _tables, address _token) public {
        tables = _tables;
        token = IERC20(_token);
        batchSize = Table(_tables[0]).getSize();

        uint256 numberOfAddresses = 0;
        for (uint256 i = 0; i < tables.length; i++) {
            numberOfAddresses += Table(tables[i]).getSize();
        }

        total = numberOfAddresses;
    }

    function sendTokens (uint256 _numberOfTransfers) public onlyOwner {
        uint256 i = index;
        uint256 toIndex = _numberOfTransfers + index;
        if (toIndex > total) {
            toIndex = total;
        }

        for (;i < toIndex; i++) {
            uint256 contractIndex = i / batchSize;
            uint256 insideIndex = i % batchSize;

            require(tables[contractIndex] != address(0), "Invalid table address");
            Table table = Table(tables[contractIndex]);

            address recipient = table.addresses(insideIndex);
            uint256 value = table.amounts(insideIndex);

            require(recipient != address(0), "Invalid address");
            require(value > 0, "Value should be > 0");
            require(token.transfer(recipient, value), "transfer failed");
        }

        index = i;
    }

    function addressAtIndex (uint256 _index) public view onlyOwner returns(address) {
        uint256 i = _index;

        uint256 contractIndex = i / batchSize;
        uint256 insideIndex = i % batchSize;

        Table table = Table(tables[contractIndex]);

        address recipient = table.addresses(insideIndex);
        return recipient;
    }

    function amountAtIndex (uint256 _index) public view onlyOwner returns(uint256) {
        uint256 i = _index;

        uint256 contractIndex = i / batchSize;
        uint256 insideIndex = i % batchSize;

        Table table = Table(tables[contractIndex]);

        uint256 amount = table.amounts(insideIndex);
        return amount;
    }
}
