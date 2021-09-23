pragma solidity ^0.5.17;

import { SafeMath } from "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { InitializableOwnable } from "../helpers/InitializableOwnable.sol";

/**
 * @title BasketManagerV4
 * @dev Contract is responsible for mAsset and bAsset exchange process and 
 * managing basket with bAsset tokens. 
 * Allows to add and/or remove bAsset, calculate balances, converts tokens quantity
 * to adjust precisions or set/get parameters: bridge, factor, range and paused.
 */

contract BasketManagerV4 is InitializableOwnable {

    using SafeMath for uint256;

    // Events

    /**
     * @dev Event emitted when basset added.
     * @param basset Address of the bAsset contract.
     */
    event BassetAdded (address basset);

    /**
     * @dev Event emitted when basset removed.
     * @param basset Address of the bAsset contract.
     */
    event BassetRemoved (address basset);

    /**
     * @dev Event emitted when factor changes.
     * @param basset Address of the bAsset contract.
     * @param factor Factor of fees.
     */
    event FactorChanged (address basset, int256 factor);

    /**
     * @dev Event emitted when bridge changes.
     * @param basset Address of the bAsset contract.
     * @param bridge Address of bridge.
     */
    event BridgeChanged (address basset, address bridge);

    /**
     * @dev Event emitted when range changes.
     * @param basset    Address of the bAsset contract.
     * @param min       Minimal value of range.
     * @param max       Maximal value of range.
     */
    event RangeChanged (address basset, uint256 min, uint256 max);

    /**
     * @dev Event emitted when paused changes.
     * @param basset    Address of the bAsset contract.
     * @param paused    Determine if paused or not.
     */
    event PausedChanged (address basset, bool paused);

    uint256 constant MAX_VALUE = 1000;

    // state
    string version;
    address masset;
    address[] private bassetsArray;
    mapping(address => int256) private factorMap;
    mapping(address => address) private bridgeMap;
    mapping(address => uint256) private minMap;
    mapping(address => uint256) private maxMap;
    mapping(address => uint256) private targetRatioMap;
    mapping(address => bool) private pausedMap;

    // Modifiers

    /**
    * @dev Prevents a contract from making actions on paused bassets.
    */
    modifier notPaused(address _basset) {
        _notPaused(_basset);
        _;
    }

    /**
    * @dev Prevents a contract from making actions on invalid bassets.
    */
    modifier validBasset(address _basset) {
        _validBasset(_basset);
        _;
    }

    /**
    * @dev Prevents a contract from making actions on paused bassets.
    * This method is called and separated from modifier to optimize bytecode and save gas.
    */
    function _notPaused(address _basset) internal view {
        require(!pausedMap[_basset], "basset is paused");
    }


    /**
    * @dev Prevents a contract from making actions on invalid bassets.
    * This method is called and separated from modifier to optimize bytecode and save gas.
    */
    function _validBasset(address _basset) internal view {
        require(factorMap[_basset] != 0, "invalid basset");
    }

    // Initializer

    /**
   * @dev Contract initializer.
   * @param _targetRatios   array of targetRatios for existing bassets
   */
    function initialize(uint256[] calldata _targetRatios) external {
        require(keccak256(bytes(version)) == keccak256(bytes("3.0")), "wrong version");
        require(_targetRatios.length == bassetsArray.length, "targetRatios array length does not match number of existing bassets");

        for (uint256 i; i < _targetRatios.length; i++) {
            setTargetRatio(bassetsArray[i], _targetRatios[i]);
        }

        version = "4.0";
    }

    // Methods for Masset logic

    /**
     * @dev Checks if bAasset is valid by checking its presence in the bassets list.
     */
    function isValidBasset(address _basset) public view returns(bool) {
        return (factorMap[_basset] != 0);
    }

    /**
     * @dev Checks if ratio of bAssets in basket is within limits to make a deposit of specific asset.
     * @param _basset           Address of bAsset to deposit.
     * @param _bassetQuantity   Amount of bAssets to deposit.
     * @return Flag indicating whether a deposit can be made.
     */
    function checkBasketBalanceForDeposit(
        address _basset,
        uint256 _bassetQuantity) public view validBasset(_basset) notPaused(_basset) returns(bool) {

        (uint256 massetQuantity, ) = convertBassetToMassetQuantity(_basset, _bassetQuantity);
        uint256 bassetBalance = IERC20(_basset).balanceOf(masset);

        (uint256 totalBassetBalanceInMasset, ) = convertBassetToMassetQuantity(_basset, bassetBalance);

        uint256 balance = totalBassetBalanceInMasset.add(massetQuantity);
        uint256 total = getTotalMassetBalance().add(massetQuantity);
        uint256 ratio = balance.mul(MAX_VALUE).div(total);
        uint256 max = maxMap[_basset];
        return ratio <= max;
    }

    /**
     * @dev Checks if ratio of bAssets in basket is within limits to make a withdrawal of specific asset.
     * @param _basset           Address of bAsset to redeem.
     * @param _bassetQuantity   Amount of bAssets to redeem.
     * @return Flag indicating whether a withdrawal can be made.
     */
    function checkBasketBalanceForWithdrawal(
        address _basset,
        uint256 _bassetQuantity) public view validBasset(_basset) notPaused(_basset) returns(bool) {

        (uint256 massetQuantity, ) = convertBassetToMassetQuantity(_basset, _bassetQuantity);
        uint256 bassetBalance = IERC20(_basset).balanceOf(masset);
        (uint256 totalBassetBalanceInMasset, ) = convertBassetToMassetQuantity(_basset, bassetBalance);

        require(totalBassetBalanceInMasset >= massetQuantity, "basset balance is not sufficient");

        uint256 balance = totalBassetBalanceInMasset.sub(massetQuantity);
        uint256 total = getTotalMassetBalance().sub(massetQuantity);

        uint256 min = minMap[_basset];
        if (total == 0) return min == 0;

        uint256 ratio = balance.mul(MAX_VALUE).div(total);
        return ratio >= min;
    }

    /**
     * @dev Converts bAsset to mAsset quantity. This is used to adjust precision.
     *      Despite bAssets and mAssets having 1:1 ratio, they may have diffrent decimal factors.
     *      Since the ratio may cause fractions, the bAsset is adjusted to match nearest non fraction amount and returned.
     * @param _basset           Address of bAsset.
     * @param _bassetQuantity   Amount of bAssets to check.
     * @return Calculated amount of mAssets and Adjusted amount of bAssets.
     */
    function convertBassetToMassetQuantity(
        address _basset,
        uint256 _bassetQuantity) public view validBasset(_basset) returns(uint256 massetQuantity, uint256 bassetQuantity) {

        int256 factor = factorMap[_basset];
        if(factor > 0) {
            massetQuantity = _bassetQuantity.div(uint256(factor));
            bassetQuantity = massetQuantity.mul(uint256(factor));
            return (massetQuantity, bassetQuantity);
        }
        massetQuantity = _bassetQuantity.mul(uint256(-factor));
        return (massetQuantity, _bassetQuantity);
    }

    /**
     * @dev Converts mAsset to bAsset quantity. This is used to adjust precisions.
     *      Despite bAssets and mAssets having 1:1 ratio, they may have diffrent decimal factors.
     *      Since the ratio may cause fractions, the mAsset is adjusted to match nearest non fraction amount and returned.
     * @param _basset           Address of bAsset.
     * @param _massetQuantity   Amount of mAssets to check.
     * @return Calculated amount of bAssets and Adjusted amount of mAssets.
     */
    function convertMassetToBassetQuantity(
        address _basset,
        uint256 _massetQuantity) public view validBasset(_basset) returns(uint256 bassetQuantity, uint256 massetQuantity) {

        int256 factor = factorMap[_basset];
        if(factor > 0) {
            bassetQuantity = _massetQuantity.mul(uint256(factor));
            return (bassetQuantity, _massetQuantity);
        }
        bassetQuantity = _massetQuantity.div(uint256(-factor));
        massetQuantity = bassetQuantity.mul(uint256(-factor));
        return (bassetQuantity, massetQuantity);
    }

    /**
     * @dev Calculate ratio of specyfic basset in basket
     * @param  _basset      Address of basset to check ratio for
     * @param  _offsetInMasset      Amount of tokens to deposit/redeem in massets. Set to zero to check current ratio.
     * @param  _isDeposit   Flag to determine offset direction(deposit/redeem).
     * @return ratio        Ratio of basset to total of basset in promils
     */
    function getBassetRatio(
        address _basset,
        uint256 _offsetInMasset,
        bool _isDeposit
    ) public view validBasset(_basset) returns (uint256 ratio) {
        uint256 total = getTotalMassetBalance();

        uint256 bassetBalance = IERC20(_basset).balanceOf(masset); // convert
        (uint256 bassetBalanceInMasset, ) = convertBassetToMassetQuantity(_basset, bassetBalance);


        if (_isDeposit) {
            total = total.add(_offsetInMasset);
            bassetBalanceInMasset = bassetBalanceInMasset.add(_offsetInMasset);
        } else {
            require(_offsetInMasset <= bassetBalanceInMasset, "offset is greater than bassetBalance");

            total = total.sub(_offsetInMasset);
            bassetBalanceInMasset = bassetBalanceInMasset.sub(_offsetInMasset);
        }

        if(total == 0) {
            return 0;
        }

        return bassetBalanceInMasset.mul(1000).div(total);
    }

    /**
     * @dev Calculate deviation from target ratio
     * @param  _basset      Address of basset to check ratio for
     * @param  _offsetInMasset       Amount of tokens to deposit/redeem in massets. Set to zero to check current ratio.
     * @param  _isDeposit    Flag to determine offset direction(deposit/redeem).
     * @return deviation    Number between -1000 and 1000. Represents deviation from target ratio.
     */
    function getBassetRatioDeviation(
        address _basset,
        uint256 _offsetInMasset,
        bool _isDeposit
    ) public view returns(int256 deviationBefore, int256 deviationAfter) {
        int256 targetRatio = int256(getBassetTargetRatio(_basset));

        int256 currentRatio = int256(getBassetRatio(_basset, 0, _isDeposit));

        deviationBefore = currentRatio - targetRatio;

        int256 ratioAfterModification = int256(getBassetRatio(_basset, _offsetInMasset, _isDeposit));
        deviationAfter = ratioAfterModification - targetRatio;
    }

    // Getters

    function getBassetTargetRatio(address _basset) public view validBasset(_basset) returns(uint256 ratio) {
        return targetRatioMap[_basset];
    }

    /**
     * @dev Calculates total mAsset balance.
     * @return Calculated total balance.
     */
    function getTotalMassetBalance() public view returns (uint256 total) {
        for(uint i=0; i<bassetsArray.length; i++) {
            address basset = bassetsArray[i];
            uint256 balance = IERC20(basset).balanceOf(masset);
            (uint256 massetQuantity, ) = convertBassetToMassetQuantity(basset, balance);
            total += massetQuantity;
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

    /**
     * @dev Adds a new bAsset.
     * @param _basset       Address of bAsset.
     * @param _factor       Factor amount.
     * @param _bridge       Address of bridge.
     * @param _min          Minimum ratio in basket.
     * @param _max          Maximum ratio in basket.
     * @param _ratio        Ratio of basset to total of basset in promils
     * @param _paused       Flag to determine if basset should be paused.
     */
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
        require(factorMap[_basset] == 0, "basset already exists");
        require(_factor != 0, "invalid factor");

        bassetsArray.push(_basset);

        setFactor(_basset, _factor);
        setTargetRatio(_basset, _ratio);
        setRange(_basset, _min, _max);
        setBridge(_basset, _bridge);
        setPaused(_basset, _paused);

        emit BassetAdded(_basset);
    }

    /**
     * @dev Adds multiple bAssets.
     * @notice All parameters must be arrays with proper order.
     */
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
        require(_min <= MAX_VALUE, "invalid minimum");
        require(_max <= MAX_VALUE, "invalid maximum");
        require(_max >= _min, "invalid range");
        minMap[_basset] = _min;
        maxMap[_basset] = _max;

        emit RangeChanged(_basset, _min, _max);
    }

    function setTargetRatio(address _basset, uint256 _ratio) public validBasset(_basset) onlyOwner {
        require(_ratio < 1000, "ratio should be less than 1000%%");
        targetRatioMap[_basset] = _ratio;
    }

    /**
     * @dev Returns true if the number is power of ten.
     * @param x     Number to be checked.
     * @return      Is the number power of ten.
     */
    function isPowerOfTen(int256 x) public pure returns (bool result) {
        uint256 number;

        if (x < 0) number = uint256(-x);
        else number = uint256(x);

        while (number >= 10 && number % 10 == 0) {
            number /= 10;
        }

        result = number == 1;
    }

    function setFactor(address _basset, int256 _factor) public onlyOwner {
        require(_factor != 0, "invalid factor");
        require(_factor == 1 || isPowerOfTen(_factor), "factor must be power of 10");
        factorMap[_basset] = _factor;

        emit FactorChanged(_basset, _factor);
    }

    function setBridge(address _basset, address _bridge) public validBasset(_basset) onlyOwner {
        bridgeMap[_basset] = _bridge;

        emit BridgeChanged(_basset, _bridge);
    }

    function setPaused(address _basset, bool _flag) public validBasset(_basset) onlyOwner {
        pausedMap[_basset] = _flag;

        emit PausedChanged(_basset, _flag);
    }

    /**
     * @dev Removes bAsset
     * @param _basset       Address of bAsset to remove.
     */
    function removeBasset(address _basset) public validBasset(_basset) onlyOwner {
        require(getBassetBalance(_basset) == 0, "balance not zero");
        factorMap[_basset] = 0;
        bool flag;
        for(uint i = 0; i < bassetsArray.length - 1; i++) {
            flag = flag || bassetsArray[i] == _basset;
            if (flag) {
                bassetsArray[i] = bassetsArray[i + 1];
            }
        }
        bassetsArray.length--;

        emit BassetRemoved(_basset);
    }
}
