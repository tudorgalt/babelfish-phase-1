pragma solidity ^0.5.16;

import "@openzeppelin/contracts/ownership/Ownable.sol";
import "../fish/interfaces/IERC20.sol";
import {Table} from "./Table.sol";
import "./IVestingRegistry3.sol";

contract AirdropVester is Ownable {

    address public constant MULTISIG = 0x26712A09D40F11f34e6C14633eD2C7C34c903eF0;
    address public constant VESTING_REGISTRY = 0x036ab2DB0a3d1574469a4a7E09887Ed76fB56C41;
    address public constant FISH_TOKEN = 0x055A902303746382FBB7D18f6aE0df56eFDc5213;

    uint256 public index;

    IERC20 public token;
    address[] private tables;
    uint256 public totalLength;
    uint256 public totalAmount;
    uint256 public batchSize;

    IVestingRegistry3 public vestingRegistry;

    constructor(address[] memory _tables, address _token) public {
        tables = _tables;
        token = IERC20(_token);
        vestingRegistry = IVestingRegistry3(VESTING_REGISTRY);
        batchSize = Table(_tables[0]).getSize();

        uint256 numberOfAddresses = 0;
        uint256 totalValue = 0;
        for (uint256 i = 0; i < tables.length; i++) {
            numberOfAddresses += Table(tables[i]).getSize();
            totalValue += Table(tables[i]).totalAmount();
        }

        totalLength = numberOfAddresses;
        totalAmount = totalValue;
    }

    function vest(address _userAddress, uint256 _amount) internal {
        vestingRegistry.createVesting(_userAddress, _amount, 0, 9 * 4 weeks);
        address vesting = vestingRegistry.getVesting(_userAddress);
        require(token.transfer(VESTING_REGISTRY, _amount), "transfer failed");
        vestingRegistry.stakeTokens(vesting, _amount);
    }

    function vestTokens (uint256 _numberOfTransfers) public onlyOwner {
        uint256 i = index;
        uint256 toIndex = _numberOfTransfers + index;
        if (toIndex > totalLength) {
            toIndex = totalLength;
        }

        address[] memory tablesList = tables;

        for (;i < toIndex; i++) {
            uint256 contractIndex = i / batchSize; //totalLength/contractIndex
            uint256 insideIndex = i % batchSize;

            Table table = Table(tablesList[contractIndex]);

            (address recipient, uint256 value, bool isLast) = table.getRecipentInfo(insideIndex);

            vest(recipient, value);
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

    function returnTokens(uint256 amount) public onlyOwner {
        require(token.transfer(MULTISIG, amount), "transfer failed");
    }
}
