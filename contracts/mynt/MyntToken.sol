pragma solidity 0.5.16;

import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/ownership/Ownable.sol";

/**
 * @title Token
 * @dev Implementation of masset Token.
 * Inherits from ERC20 and ERC20Detailed with implemented 
 * mint and burn functions.
 */

contract MyntToken is ERC20, ERC20Detailed, Ownable {

    event MarketMakerChanged(address indexed _address);
    event PresaleChanged(address indexed _address);

    address public marketMaker = address(0);
    address public presale = address(0);

    /**
     * @notice Constructor called on deployment, initiates the contract.
     * */
    constructor() public ERC20Detailed("Sovryn Mynt", "MYNT", 18) {}

    /**
     * @notice setConttroller sets the token's conttroller
     * @param _address The address of the controller contract
     * */
    function setMarketMaker(address _address) public onlyOwner {
        require(_address != address(0), "invalid address");
        marketMaker = _address;
        emit MarketMakerChanged(_address);
    }

    /**
     * @notice setConttroller sets the token's conttroller
     * @param _address The address of the controller contract
     * */
    function setPresale(address _address) public onlyOwner {
        require(_address != address(0), "invalid address");
        presale = _address;
        emit PresaleChanged(_address);
    }

    /**
     * @notice Creates new tokens and sends them to the recipient.
     * @param _account The recipient address to get the minted tokens.
     * @param _amount The amount of tokens to be minted.
     * */
    function mint(address _account, uint256 _amount) public {
        // only the presale and the marketmaker are allowed to mint
        require(msg.sender == presale || msg.sender == marketMaker, "not allowed");
        _mint(_account, _amount);
    }

    /**
     * @notice Burns tokens for the given account.
     * @param _account The recipient address to get the minted tokens.
     * @param _amount The amount of tokens to be minted.
     * */
    function burn(address _account, uint256 _amount) public {
        // only the marketmake is alloed to burn tokens,
        // ...and the user is allowed to burn his own tokens
        require(msg.sender == marketMaker || msg.sender == _account, "not allowed");
        _burn(_account, _amount);
    }
}
