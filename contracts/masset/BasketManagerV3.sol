pragma solidity 0.5.16;

import { SafeMath } from "../openzeppelin/contracts/math/SafeMath.sol";
import { InitializableOwnable } from "../helpers/InitializableOwnable.sol";
import "../openzeppelin/contracts/token/ERC20/IERC20.sol";

contract BasketManagerV3 is InitializableOwnable {

    using SafeMath for uint256;

    uint256 constant MAX_VALUE = 1000;

    // state
    address masset;
    address[] private bassetsArray;
    mapping(address => bool) private bassetsMap;
    mapping(address => int256) private factorMap;
    mapping(address => address) private bridgeMap;
    mapping(address => uint256) private minMap;
    mapping(address => uint256) private maxMap;

    function initialize(address _masset) external {
        require(masset == address(0), "already initialized");
        masset = _masset;
    }

    function getVersion() external pure returns(string memory) {
        return "3.0";
    }

    function isValidBasset(address _basset) public view returns(bool) {
        return _basset != address(0) && bassetsMap[_basset];
    }

    function getTotalMassetBalance() public view returns (uint256 total) {
        for(uint i=0; i<bassetsArray.length; i++) {
            address basset = bassetsArray[i];
            uint256 balance = IERC20(basset).balanceOf(masset);
            total += convertBassetToMassetQuantity(basset, balance);
        }
    }

    function getBassetBalance(address _basset) public returns (uint256) {
        return IERC20(_basset).balanceOf(masset);
    }

    function checkBasketBalanceForDeposit(address _basset, uint256 _bassetQuantity) public view returns(bool) {
        require(isValidBasset(_basset), "invalid basset");
        uint256 massetQuantity = convertBassetToMassetQuantity(_basset, _bassetQuantity);
        uint256 balance = IERC20(_basset).balanceOf(masset).add(massetQuantity);
        uint256 total = getTotalMassetBalance().add(massetQuantity);
        uint256 ratio = balance.mul(MAX_VALUE).div(total);
        uint256 max = maxMap[_basset];
        return ratio <= max;
    }

    function checkBasketBalanceForWithdrawal(address _basset, uint256 _bassetQuantity) public view returns(bool) {
        require(isValidBasset(_basset), "invalid basset");
        uint256 massetQuantity = convertBassetToMassetQuantity(_basset, _bassetQuantity);
        uint256 balance = IERC20(_basset).balanceOf(masset).sub(massetQuantity);
        uint256 total = getTotalMassetBalance().sub(massetQuantity);
        uint256 ratio = balance.mul(MAX_VALUE).div(total);
        uint256 min = minMap[_basset];
        return ratio >= min;
    }

    function convertBassetToMassetQuantity(address _basset, uint256 _bassetQuantity) public view returns(uint256) {
        require(isValidBasset(_basset), "invalid basset");
        int256 factor = factorMap[_basset];
        if(factor > 0) {
            return _bassetQuantity.div(uint256(factor));
        }
        return _bassetQuantity.mul(uint256(-factor));
    }

    function convertMassetToBassetQuantity(address _basset, uint256 _massetQuantity) public view returns(uint256) {
        require(isValidBasset(_basset), "invalid basset");
        int256 factor = factorMap[_basset];
        if(factor > 0) {
            return _massetQuantity.mul(uint256(factor));
        }
        return _massetQuantity.div(uint256(-factor));
    }

    // Getters

    function getBassets() public view returns(address[] memory) {
        return bassetsArray;
    }

    function getFactor(address _basset) public view returns(int256) {
        require(isValidBasset(_basset), "invalid basset");
        return factorMap[_basset];
    }

    function getBridge(address _basset) public view returns(address) {
        require(isValidBasset(_basset), "invalid basset");
        return bridgeMap[_basset];
    }

    function getRange(address _basset) public view returns(uint256 min, uint256 max) {
        require(isValidBasset(_basset), "invalid basset");
        min = minMap[_basset];
        max = maxMap[_basset];
    }

    // Admin methods

    function addBasset(address _basset, int256 _factor, address _bridge, uint256 _min, uint256 _max) external onlyOwner {
        require(_basset != address(0), "invalid basset address");
        require(!isValidBasset(_basset), "basset already exists");
        require(_factor != 0, "invalid factor");
        bassetsMap[_basset] = true;
        factorMap[_basset] = _factor;
        bridgeMap[_basset] = _bridge;
        minMap[_basset] = _min;
        maxMap[_basset] = _max;
        bassetsArray.push(_basset);
    }

    function setRange(address _basset, uint256 _min, uint256 _max) external onlyOwner {
        require(isValidBasset(_basset), "invalid basset");
        require(_min <= MAX_VALUE, "invalid minimum");
        require(_max <= MAX_VALUE, "invalid maximum");
        require(_max >= _min, "invalid range");
        minMap[_basset] = _min;
        maxMap[_basset] = _max;
    }

    function setFactor(address _basset, int256 _factor) external onlyOwner {
        require(isValidBasset(_basset), "invalid basset");
        require(_factor != 0, "invalid factor");
        factorMap[_basset] = _factor;
    }

    function setBridge(address _basset, address _bridge) external onlyOwner {
        require(isValidBasset(_basset), "invalid basset");
        bridgeMap[_basset] = _bridge;
    }

    function removeBasset(address _basset) external onlyOwner {
        require(isValidBasset(_basset), "invalid basset");
        require(getBassetBalance(_basset) == 0, "balance exists");
        bassetsMap[_basset] = false;
        bool flag;
        for(uint i = 0; i < bassetsArray.length - 1; i++) {
            if (!flag && bassetsArray[i] == _basset) {
                flag = true;
            }
            if (flag) {
                bassetsArray[i] = bassetsArray[i + 1];
            }
        }
        bassetsArray.length--;
    }
}
