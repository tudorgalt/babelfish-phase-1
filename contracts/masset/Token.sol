pragma solidity ^0.5.17;

import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/ownership/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "./BaseRelayRecipient.sol";
import "./IApproveAndCall.sol";

/**
 * @title Token
 * @dev Implementation of masset Token.
 * Inherits from ERC20 and ERC20Detailed with implemented
 * mint and burn functions.
 */

contract Token is ERC20, ERC20Detailed, Ownable, BaseRelayRecipient {
    using Address for address;

    struct PaymasterUpdate {
        address newPaymaster;
        uint256 endGracePeriod;
        bool hasToBeExecuted;
    }

    address public paymaster;
    PaymasterUpdate public paymasterUpdate;
    mapping(address => bool) public paymasterRevoked;

    event PaymasterUpdateLaunched(address indexed newBridge, uint256 endGracePeriod);
    event PaymasterUpdateExecuted(address indexed newBridge);
    event PaymasterRevoked(address account, bool revoked);

    /**
     * @notice Constructor called on deployment, initiates the contract.
     * @param _name The name of the token.
     * @param _symbol The symbol of the token.
     * @param _decimals The decimals of the token.
     * */
    constructor(
        string memory _name,
        string memory _symbol,
        uint8 _decimals,
        address _forwarder,
        address _paymaster
    ) public
    ERC20Detailed(_name, _symbol, _decimals) {
        _trustedForwarder = _forwarder;
     	paymaster = _paymaster;
    }

    function launchPaymasterUpdate(address newPaymaster) external onlyOwner {
        require(!paymasterUpdate.hasToBeExecuted, "current update has to be executed");
        require(newPaymaster.isContract(), "address provided is not a contract");

        uint256 endGracePeriod = block.timestamp + 1 weeks;

        paymasterUpdate = PaymasterUpdate(newPaymaster, endGracePeriod, true);

        emit PaymasterUpdateLaunched(newPaymaster, endGracePeriod);
    }

    function executePaymasterUpdate() external onlyOwner {
        require(
            paymasterUpdate.endGracePeriod <= block.timestamp,
            "grace period has not finished"
        );
        require(paymasterUpdate.hasToBeExecuted, ": update already executed");

        paymasterUpdate.hasToBeExecuted = false;
        paymaster = paymasterUpdate.newPaymaster;

        emit PaymasterUpdateExecuted(paymasterUpdate.newPaymaster);
    }

    /**
     * @notice Creates new tokens and sends them to the recipient.
     * @param _account The recipient address to get the minted tokens.
     * @param _amount The amount of tokens to be minted.
     * */
    function mint(address _account, uint256 _amount) public onlyOwner {
        _mint(_account, _amount);
    }

    /**
     * @notice Burns tokens for the given account.
     * @param _account The recipient address to get the minted tokens.
     * @param _amount The amount of tokens to be minted.
     * */
    function burn(address _account, uint256 _amount) public onlyOwner {
        _burn(_account, _amount);
    }

    /**
	 * @notice Approves and then calls the receiving contract.
	 * Useful to encapsulate sending tokens to a contract in one call.
	 * Solidity has no native way to send tokens to contracts.
	 * ERC-20 tokens require approval to be spent by third parties, such as a contract in this case.
	 * @param _spender The contract address to spend the tokens.
	 * @param _amount The amount of tokens to be sent.
	 * @param _data Parameters for the contract call, such as endpoint signature.
	 * */
	function approveAndCall(
		address _spender,
		uint256 _amount,
		bytes memory _data
	) public {
		approve(_spender, _amount);
		IApproveAndCall(_spender).receiveApproval(msg.sender, _amount, address(this), _data);
	}

    function transferFrom(address sender, address recipient, uint256 amount) public returns (bool) {
        if (msg.sender == paymaster && !paymasterRevoked[sender]) {
            _transfer(sender, recipient, amount);
        } else {
            super.transferFrom(sender, recipient, amount);
        }
        return true;
    }

    function revokePaymaster(bool revoke) external {
        paymasterRevoked[_msgSender()] = revoke;
        emit PaymasterRevoked(_msgSender(), revoke);
    }

    function _msgSender() internal view returns (address payable ret) {
        return BaseRelayRecipient._msgSender();
    }
}
