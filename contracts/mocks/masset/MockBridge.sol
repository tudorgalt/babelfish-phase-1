pragma solidity ^0.5.17;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { MassetV4 } from "../../masset/MassetV4.sol";

contract MockBridge {
    function receiveTokensAt(
        address tokenToUse,
        uint256 amount,
        address receiver,
        bytes calldata extraData
    ) external returns(bool) {
        require(IERC20(tokenToUse).transferFrom(msg.sender, address(this), amount), "transfer failed");

        return true;
    }

    // It is used to test the case, when bridge is calling the onTokensMinted method on MassetV4
    function callOnTokensMinted(
        address masset,
        uint256 _orderAmount,
        address _tokenAddress,
        address _userData
    ) external {
        MassetV4(masset).onTokensMinted(_orderAmount, _tokenAddress, abi.encode(_userData));
    }

    // It is used to test the case, when bridge is calling the redeemByBridge method on Masset
    function callRedeemByBridge(
        address masset,
        address _basset,
        uint256 _massetQuantity,
        address _recipient
    ) external returns (uint256 massetRedeemed) {
        return MassetV4(masset).redeemByBridge(_basset, _massetQuantity, _recipient);
    }
}
