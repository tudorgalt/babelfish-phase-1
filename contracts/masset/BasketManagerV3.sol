pragma solidity 0.5.16;

import { SafeMath } from "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { InitializableOwnable } from "../helpers/InitializableOwnable.sol";
import { Constants } from "../Constants.sol";

contract BasketManagerV3 is InitializableOwnable {

    using SafeMath for uint256;

    // state
    string version;
    address masset;
    address[] private bassetsArray;
    mapping(address => bool) private bassetsMap;
    mapping(address => int256) private factorMap;
    mapping(address => address) private bridgeMap;
    mapping(address => uint256) private minMap;
    mapping(address => uint256) private maxMap;
    mapping(address => uint256) private targetRatioMap;
    mapping(address => bool) private pausedMap;

    // Modifiers

    modifier notPaused(address _basset) {
        require(!pausedMap[_basset], "basset is paused");
        _;
    }

    modifier validBasset(address _basset) {
        require(bassetsMap[_basset], "invalid basset");
        _;
    }

    // Initializer

    function initialize(address _masset) external {
        require(masset == address(0), "already initialized");
        _initialize();
        masset = _masset;
        version = "3.0";
    }

    // Methods for Masset logic

    function isValidBasset(address _basset) public view returns(bool) {
        return bassetsMap[_basset];
    }

    function checkBasketBalanceForDeposit(
        address _basset,
        uint256 _bassetQuantity) public view validBasset(_basset) notPaused(_basset) returns(bool) {

        uint256 massetQuantity = convertBassetToMassetQuantity(_basset, _bassetQuantity);
        uint256 bassetBalance = IERC20(_basset).balanceOf(masset);

        uint256 totalBassetBalanceInMasset = convertBassetToMassetQuantity(_basset, bassetBalance);

        uint256 balance = totalBassetBalanceInMasset.add(massetQuantity);
        uint256 total = getTotalMassetBalance().add(massetQuantity);
        uint256 ratio = balance.mul(Constants.getMaxBasketValue()).div(total);
        uint256 max = maxMap[_basset];
        return ratio <= max;
    }

    function checkBasketBalanceForWithdrawal(
        address _basset,
        uint256 _bassetQuantity) public view validBasset(_basset) notPaused(_basset) returns(bool) {

        uint256 massetQuantity = convertBassetToMassetQuantity(_basset, _bassetQuantity);
        uint256 bassetBalance = IERC20(_basset).balanceOf(masset);
        uint256 totalBassetBalanceInMasset = convertBassetToMassetQuantity(_basset, bassetBalance);

        require(totalBassetBalanceInMasset >= massetQuantity, "basset balance is not sufficient");

        uint256 balance = totalBassetBalanceInMasset.sub(massetQuantity);
        uint256 total = getTotalMassetBalance().sub(massetQuantity);

        uint256 min = minMap[_basset];
        if (total == 0) return min == 0;

        uint256 ratio = balance.mul(Constants.getMaxBasketValue()).div(total);
        return ratio >= min;
    }

    function convertBassetToMassetQuantity(
        address _basset,
        uint256 _bassetQuantity) public view validBasset(_basset) returns(uint256) {

        int256 factor = factorMap[_basset];
        if(factor > 0) {
            return _bassetQuantity.div(uint256(factor));
        }
        return _bassetQuantity.mul(uint256(-factor));
    }

    function convertMassetToBassetQuantity(
        address _basset,
        uint256 _massetQuantity) public view validBasset(_basset) returns(uint256) {

        int256 factor = factorMap[_basset];
        if(factor > 0) {
            return _massetQuantity.mul(uint256(factor));
        }
        return _massetQuantity.div(uint256(-factor));
    }

    /**
     * @dev Calculate ratio of specyfic basset in basket
     * @param  _basset      Address of basset to check ratio for
     * @param  offset       Amount of tokens to deposit/redeem in massets. Set to zero to check current ratio.
     * @param  isDeposit    Flag to determine offset direction(deposit/redeem).
     * @return ratio        Ratio of basset to total of basset in REWARDS_PRECISION
     */
    function getBassetRatio(
        address _basset,
        uint256 offset,
        bool isDeposit
    ) public view validBasset(_basset) returns (uint256 ratio) {
        uint256 total = getTotalMassetBalance();
        uint256 bassetBalance = IERC20(_basset).balanceOf(masset);

        if (isDeposit) {
            total = total.add(offset);
            bassetBalance = bassetBalance.add(offset);
        } else {
            require(offset <= total, "offset is greater than total");
            require(offset <= bassetBalance, "offset is greater than bassetBalance");

            total = total.sub(offset);
            bassetBalance = bassetBalance.sub(offset);
        }

        uint256 bassetBalanceInMasset = convertBassetToMassetQuantity(_basset, bassetBalance);

        return bassetBalanceInMasset.mul(Constants.getRewardsPrecision()).div(total);
    }

    /**
     * @dev Calculate deviation from target ratio
     * @param  _basset      Address of basset to check ratio for
     * @param  offset       Amount of tokens to deposit/redeem in massets. Set to zero to check current ratio.
     * @param  isDeposit    Flag to determine offset direction(deposit/redeem).
     * @return deviation    Number between -REWARDS_PRECISION and REWARDS_PRECISION. Represents deviation from target ratio.
     */
    function getBassetRatioDeviation(
        address _basset,
        uint256 offset,
        bool isDeposit
    ) public view validBasset(_basset) returns (int256 deviation) {
        int256 currentRatio = int256(getBassetRatio(_basset, offset, isDeposit));
        int256 targetRatio = int256(getBassetTargetRatio(_basset));

        return currentRatio - targetRatio;
    }

    // Getters

    function getBassetTargetRatio(address _basset) public view validBasset(_basset) returns(uint256 ratio) {
        return targetRatioMap[_basset];
    }

    function getTotalMassetBalance() public view returns (uint256 total) {
        for(uint i=0; i<bassetsArray.length; i++) {
            address basset = bassetsArray[i];
            uint256 balance = IERC20(basset).balanceOf(masset);
            total += convertBassetToMassetQuantity(basset, balance);
        }
    }

    function getBassetBalance(address _basset) public view returns (uint256) {
        return IERC20(_basset).balanceOf(masset);
    }

    function getVersion() external view returns(string memory) {
        return version;
    }

    function getBassets() public view returns(address[] memory) {
        return bassetsArray;
    }

    function getFactor(address _basset) public view validBasset(_basset) returns(int256) {
        return factorMap[_basset];
    }

    function getBridge(address _basset) public view validBasset(_basset) returns(address) {
        return bridgeMap[_basset];
    }

    function getRange(address _basset) public view validBasset(_basset) returns(uint256 min, uint256 max) {
        min = minMap[_basset];
        max = maxMap[_basset];
    }

    function getPaused(address _basset) public view validBasset(_basset) returns(bool) {
        return pausedMap[_basset];
    }

    // Admin methods

    function addBasset(
        address _basset,
        int256 _factor,
        address _bridge,
        uint256 _min,
        uint256 _max,
        uint256 _ratio,
        bool _paused
    ) public onlyOwner {
        require(_basset != address(0), "invalid basset address");
        require(!bassetsMap[_basset], "basset already exists");

        bassetsArray.push(_basset);
        bassetsMap[_basset] = true;

        setTargetRatio(_basset, _ratio);
        setFactor(_basset, _factor);
        setRange(_basset, _min, _max);
        setBridge(_basset, _bridge);
        setPaused(_basset, _paused);
    }

    function addBassets(
        address[] memory _bassets, int256[] memory _factors, address[] memory _bridges,
        uint256[] memory _mins, uint256[] memory _maxs, uint256[] memory _ratios, bool[] memory _pausedFlags) public onlyOwner {

        uint length = _bassets.length;
        require(
            _factors.length == length &&
            _bridges.length == length &&
            _mins.length == length &&
            _maxs.length == length &&
            _pausedFlags.length == length, "invalid lengths");

        for(uint i=0; i<length; i++) {
            addBasset(_bassets[i], _factors[i], _bridges[i], _mins[i], _maxs[i], _ratios[i], _pausedFlags[i]);
        }
    }

    function setRange(address _basset, uint256 _min, uint256 _max) public validBasset(_basset) onlyOwner {
        require(_min <= Constants.getMaxBasketValue(), "invalid minimum");
        require(_max <= Constants.getMaxBasketValue(), "invalid maximum");
        require(_max >= _min, "invalid range");
        minMap[_basset] = _min;
        maxMap[_basset] = _max;
    }

    function setTargetRatio(address _basset, uint256 _ratio) public validBasset(_basset) onlyOwner {
        require(_ratio < Constants.getRewardsPrecision(), "ratio should be less than 1");
        targetRatioMap[_basset] = _ratio;
    }

    function isPowerOfTen(int256 x) public pure returns (bool result) {
        uint256 number;

        if (x < 0) number = uint256(-x);
        else number = uint256(x);

        while (number >= 10 && number % 10 == 0) {
            number /= 10;
        }

        result = number == 1;
    }

    function setFactor(address _basset, int256 _factor) public validBasset(_basset) onlyOwner {
        require(_factor != 0, "invalid factor");
        require(_factor == 1 || isPowerOfTen(_factor), "factor must be power of 10");
        factorMap[_basset] = _factor;
    }

    function setBridge(address _basset, address _bridge) public validBasset(_basset) onlyOwner {
        bridgeMap[_basset] = _bridge;
    }

    function setPaused(address _basset, bool _flag) public validBasset(_basset) onlyOwner {
        pausedMap[_basset] = _flag;
    }

    function removeBasset(address _basset) public validBasset(_basset) onlyOwner {
        require(getBassetBalance(_basset) == 0, "balance not zero");
        bassetsMap[_basset] = false;
        bool flag;
        for(uint i = 0; i < bassetsArray.length - 1; i++) {
            flag = flag || bassetsArray[i] == _basset;
            if (flag) {
                bassetsArray[i] = bassetsArray[i + 1];
            }
        }
        bassetsArray.length--;
    }
}
