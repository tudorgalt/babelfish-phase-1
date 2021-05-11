pragma solidity 0.5.16;

import { Initializable } from "@openzeppelin/upgrades/contracts/Initializable.sol";
import { InitializableReentrancyGuard } from "../helpers/InitializableReentrancyGuard.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { ERC20Detailed } from "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";

contract BasketManager is Initializable, InitializableReentrancyGuard {

    // state
    address private masset;
    address[] private bassetsArray;
    mapping(address => bool) private bassetsMap;

    // internal
    modifier massetOnly() {
        require(msg.sender == masset, "masset only");
        _;
    }

    function _isValidBasset(address _basset) internal view returns(bool) {
        return _basset != address(0) && bassetsMap[_basset];
    }

    // external
    function initialize(address _masset, address[] calldata _bassets) external initializer {
        require(_masset != address(0), "invalid masset address");
        require(_bassets.length > 0, "some basset required");

        InitializableReentrancyGuard._initialize();

        masset = _masset;
        bassetsArray = _bassets;
        for(uint i=0; i<bassetsArray.length; i++) {
            address basset = bassetsArray[i];
            require(basset != address(0), "invalid basset address");
            require(IERC20(basset).totalSupply() > 0, "invalid basset (1)");
            require(ERC20Detailed(basset).decimals() > 0, "invalid basset (2)");
            require(!bassetsMap[basset], "basset not unique");
            bassetsMap[basset] = true;
        }
    }

    function isValidBasset(address _basset) external view returns(bool) {
        return _isValidBasset(_basset);
    }

    function checkBasketBalanceForDeposit(address _basset, uint256 _bassetQuantity) external view returns(bool) {
        return _isValidBasset(_basset);
    }

    function checkBasketBalanceForWithdrawal(address _basset, uint256 _bassetQuantity) external view returns(bool) {
        return _isValidBasset(_basset);
    }
}
