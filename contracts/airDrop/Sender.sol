pragma solidity ^0.5.16;

import "@openzeppelin/contracts/ownership/Ownable.sol";
import "../fish/interfaces/IERC20.sol";
import {Table} from "./Table.sol";

contract Sender is Ownable {
    uint256 index;

    IERC20 token;
    address[] private tables;
    uint256 total;
    uint256 batchSize;

    constructor(address[] memory _tables, address _token, uint256 _totalSize, uint256 _batchSize) public {
        tables = _tables;
        token = IERC20(_token);
        total = _totalSize;
        batchSize = _batchSize;
    }

    function sendTokens (uint256 _numberOfTransfers) public onlyOwner {
        uint256 i = index;
        uint256 toIndex = _numberOfTransfers + index > total
            ? total
            : _numberOfTransfers + index;

        for (;i < toIndex; i++) {
            uint256 contractIndex = i / batchSize;
            uint256 insideIndex = i % batchSize;

            Table table = Table(tables[contractIndex]);

            address recipient = table.addresses(insideIndex);
            uint256 value = table.amounts(insideIndex);
            require(token.transfer(recipient, value), "transfer failed");
        }
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
