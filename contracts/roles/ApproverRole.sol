pragma solidity 0.5.16;

import { Roles } from "@openzeppelin/contracts/access/Roles.sol";

contract ApproverRole {
    using Roles for Roles.Role;

    Roles.Role private _approvers;

    function _initialize () internal {
        _addApprover(msg.sender);
    }

    modifier onlyApprover() {
        require(isApprover(msg.sender), "ApproverRole: caller does not have the Approver role");
        _;
    }

    function isApprover(address account) public view returns (bool) {
        return _approvers.has(account);
    }

    function addApprover(address account) public onlyApprover {
        _addApprover(account);
    }

    function renounceApprover() public {
        _removeApprover(msg.sender);
    }

    function _addApprover(address account) internal {
        _approvers.add(account);
    }

    function _removeApprover(address account) internal {
        _approvers.remove(account);
    }
}
