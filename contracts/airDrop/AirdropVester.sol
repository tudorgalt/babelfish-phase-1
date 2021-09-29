pragma solidity ^0.5.16;

import "@openzeppelin/contracts/ownership/Ownable.sol";
import "../fish/interfaces/IERC20.sol";
import {Table} from "./Table.sol";

contract AirdropVester {

    address public constant MULTISIG = 0x26712A09D40F11f34e6C14633eD2C7C34c903eF0;
    address public constant FISH_TOKEN = 0x055A902303746382FBB7D18f6aE0df56eFDc5213;

    uint256 public index;
    IERC20 public token;
    address[] private tables;
    uint256 public lastSent;
    uint256 batchSize;
    uint256 public totalLength;

    constructor(address[] memory _tables, address _token) public {
        tables = _tables;
        token = IERC20(_token);
        index = 0;
        lastSent = now;
        batchSize = Table(_tables[0]).getSize();
        for(uint8 i = 0; i < _tables.length; i++) {
            totalLength += Table(_tables[i]).getSize();
        }
    }

    function sendTokens (uint256 _numberOfTransfers) public returns(bool finished){

        address[] memory tablesList = tables;

        if (index >= totalLength) {
            require(now / (4 weeks) > lastSent / (4 weeks), "too soon");
            index = 0;
            lastSent = now;
        }

        uint256 toIndex = index + _numberOfTransfers;
        if (toIndex > totalLength) {
            toIndex = totalLength;
        }

        uint256 i = index;
        for (;i < toIndex; i++) {

            uint256 tableIndex = i / batchSize;
            uint256 innerIndex = i % batchSize;

            Table table = Table(tablesList[tableIndex]);

            (address recipient, uint256 amount, bool isLast) = table.getRecipentInfo(innerIndex);

            require(token.transfer(recipient, amount / 9), "transfer failed");
        }

        index = i;
        return index >= totalLength;
    }

    function getCurrent() public returns(address, uint256) {
        if (index >= totalLength) return (address(0), 0);
        uint256 tableIndex = index / batchSize;
        uint256 innerIndex = index % batchSize;
        Table table = Table(tables[tableIndex]);
        (address recipient, uint256 amount, bool isLast) = table.getRecipentInfo(innerIndex);
        return (recipient, amount);
    }

    function returnTokens(uint256 amount) public {
        require(token.transfer(MULTISIG, amount), "transfer failed");
    }
}
