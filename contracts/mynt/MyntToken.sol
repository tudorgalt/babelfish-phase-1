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

    address public controller = address(0);

    /**
      * @dev Throws if called by any account other than the controller.
      */
    modifier onlyController() {
        require(isController(), "caller is not the controller");
        _;
    }

    /**
     * @dev Returns true if the caller is the current controller.
     */
    function isController() public view returns (bool) {
        return _msgSender() == controller;
    }

    /**
     * @notice Constructor called on deployment, initiates the contract.
     * */
    constructor() public ERC20Detailed("Sovryn Mynt", "MYNT", 18) {}

    /**
     * @notice setConttroller sets the token's conttroller
     * @param _controller The address of the controller contract
     * */
    function setController(address  _controller) public onlyOwner {
        controller = _controller;
    }

    /**
     * @notice Creates new tokens and sends them to the recipient.
     * @param _account The recipient address to get the minted tokens.
     * @param _amount The amount of tokens to be minted.
     * */
    function mint(address _account, uint256 _amount) public onlyController {
        _mint(_account, _amount);
    }

    /**
     * @notice Burns tokens for the given account.
     * @param _account The recipient address to get the minted tokens.
     * @param _amount The amount of tokens to be minted.
     * */
    function burn(address _account, uint256 _amount) public onlyController {
        _burn(_account, _amount);
    }
}
