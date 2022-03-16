pragma solidity ^0.5.17;

import { SafeMath } from "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { InitializableOwnable } from "../helpers/InitializableOwnable.sol";


/**
 * @title BasketManagerV3
 * @dev Contract is responsible for mAsset and bAsset exchange process and
 * managing basket with bAsset tokens.
 * Allows to add and/or remove bAsset, calculate balances, converts tokens quantity
 * to adjust precisions or set/get parameters: bridge, factor, range and paused.
 */

contract BasketManagerV3 is InitializableOwnable {

    using SafeMath for uint256;

    // Events

    /**
     * @dev Event emitted when basset is added.
     * @param basset Address of the bAsset contract.
     */
    event BassetAdded (address basset);

    /**
     * @dev Event emitted when basset is removed.
     * @param basset Address of the bAsset contract.
     */
    event BassetRemoved (address basset);

    /**
     * @dev Event emitted when factor is changed.
     * @param basset Address of the bAsset contract.
     * @param factor Factor of fees.
     */
    event FactorChanged (address basset, int256 factor);

    /**
     * @dev Event emitted when bridge is changed.
     * @param basset Address of the bAsset contract.
     * @param bridge Address of bridge.
     */
    event BridgeChanged (address basset, address bridge);

    /**
     * @dev Event emitted when range is changed.
     * @param basset    Address of the bAsset contract.
     * @param newRatio  Ratio value.
     */
    event RatioChanged (address basset, uint256 newRatio);

    /**
     * @dev Event emitted when paused is changed.
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
    mapping(address => uint256) private ratioMap;
    mapping(address => bool) private pausedMap;

    uint256 constant public PRECISION = 1e18;

    // Modifiers

    /**
    * @dev Prevents a contract from making actions on paused bAssets.
    */
    modifier notPaused(address _basset) {
        _notPaused(_basset);
        _;
    }

    /**
    * @dev Prevents a contract from making actions on invalid bAssets.
    */
    modifier validBasset(address _basset) {
        _validBasset(_basset);
        _;
    }

    /**
    * @dev Prevents a contract from making actions on paused bAssets.
    * This method is called and separated from modifier to optimize bytecode and save gas.
    */
    function _notPaused(address _basset) internal view {
        require(!pausedMap[_basset], "basset is paused");
    }


    /**
    * @dev Prevents a contract from making actions on invalid bAssets.
    * This method is called and separated from modifier to optimize bytecode and save gas.
    */
    function _validBasset(address _basset) internal view {
        require(factorMap[_basset] != 0, "invalid basset");
    }

    // Initializer

    /**
   * @dev Contract initializer.
   * @param _masset     Address of the mAsset contract.
   */
    function initialize(address _masset) external {
        require(masset == address(0), "already initialized");
        _initialize();
        masset = _masset;
        version = "3.0";
    }

    // Methods for Masset logic

    /**
     * @dev Checks if bAasset is valid by checking its presence in the bAssets factors list.
     */
    function isValidBasset(address _basset) public view returns(bool) {
        return (factorMap[_basset] != 0);
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

    // Getters

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

    function getBassetRatio(address _basset, uint256 withdrawOffset) public view returns (uint256) {
        uint256 total = getTotalMassetBalance();

        (uint256 bassetBalanceInMasset, ) = convertBassetToMassetQuantity(_basset, getBassetBalance(_basset));

        if(total <= withdrawOffset || bassetBalanceInMasset < withdrawOffset) {
            return 0;
        }

        uint256 ratio = (bassetBalanceInMasset - withdrawOffset) * PRECISION / (total - withdrawOffset);
        return ratio;
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

    function getRatio(address _basset) public view validBasset(_basset) returns(uint256) {
        return ratioMap[_basset];
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
     * @param _ratio        Ratio in basket.
     * @param _paused       Flag to determine if basset should be paused.
     */
    function addBasset(address _basset, int256 _factor, address _bridge, uint256 _ratio, bool _paused) public onlyOwner {
        require(_basset != address(0), "invalid basset address");
        require(factorMap[_basset] == 0, "basset already exists");
        require(_factor != 0, "invalid factor");

        bassetsArray.push(_basset);

        setFactor(_basset, _factor);
        setRatio(_basset, _ratio);
        setBridge(_basset, _bridge);
        setPaused(_basset, _paused);

        emit BassetAdded(_basset);
    }

    /**
     * @dev Adds multiple bAssets.
     * @notice All parameters must be arrays with proper order and equal length.
     */
    function addBassets(
        address[] memory _bassets, int256[] memory _factors, address[] memory _bridges,
        uint256[] memory _mins, uint256[] memory _ratios, bool[] memory _pausedFlags) public onlyOwner {

        uint length = _bassets.length;
        require(
            _factors.length == length &&
            _bridges.length == length &&
            _ratios.length == length &&
            _pausedFlags.length == length, "invalid lengths");

        for(uint i=0; i<length; i++) {
            addBasset(_bassets[i], _factors[i], _bridges[i], _ratios[i], _pausedFlags[i]);
        }
    }

    function setRatio(address _basset, uint256 _ratio) public validBasset(_basset) onlyOwner {
        ratioMap[_basset] = _ratio;
        emit RatioChanged(_basset, _ratio);
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

        uint256 index;
        for(uint i = 0; i < bassetsArray.length - 1; i++) {
            if (bassetsArray[i] == _basset) {
                index = i;
                break;
            }
        }

        bassetsArray[index] = bassetsArray[bassetsArray.length - 1];
        bassetsArray.pop();

        emit BassetRemoved(_basset);
    }
}
