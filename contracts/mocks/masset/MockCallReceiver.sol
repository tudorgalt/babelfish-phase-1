pragma solidity ^0.5.17;

import "../../masset/IApproveAndCall.sol";

contract MockCallReceiver is IApproveAndCall {
	function receiveApproval(
		address _sender,
		uint256 _amount,
		address _token,
		bytes calldata _data
	) external {}
}