pragma solidity 0.5.16;
pragma experimental ABIEncoderV2;

import { Initializable } from "@openzeppelin/upgrades/contracts/Initializable.sol";
import { InitializableToken } from "../helpers/InitializableToken.sol";
import { BasketManager } from "./BasketManager.sol";
import { InitializableReentrancyGuard } from "../helpers/InitializableReentrancyGuard.sol";
import { ERC20Detailed } from "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";
import { SafeMath } from "@openzeppelin/contracts/math/SafeMath.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IERC777Recipient } from "@openzeppelin/contracts/token/ERC777/IERC777Recipient.sol";
import { IERC1820Registry } from "@openzeppelin/contracts/introspection/IERC1820Registry.sol";

contract Masset is
    Initializable,
    InitializableToken,
    InitializableReentrancyGuard,
    IERC777Recipient {

    using SafeMath for uint256;

    // Forging Events
    event Minted(address indexed minter, address recipient, uint256 massetQuantity, address bAsset, uint256 bassetQuantity);
    event Redeemed(address indexed redeemer, address recipient, uint256 massetQuantity, address bAsset, uint256 bassetQuantity);
    event onTokenReceivedCall(
        address operator,
        address from,
        address to,
        uint amount,
        bytes userData,
        bytes operatorData
    );

    // state
    IERC1820Registry constant private _erc1820 = IERC1820Registry(0x1820a4B7618BdE71Dce8cdc73aAB6C95905faD24);
    address private basketManager;

    // public

    function initialize(string calldata _name, string calldata _symbol, address _basketManager) external initializer {
        require(_basketManager != address(0), "invalid basket manager address");

        InitializableToken._initialize(_name, _symbol);
        InitializableReentrancyGuard._initialize();
        _erc1820.setInterfaceImplementer(address(this), keccak256("ERC777TokensRecipient"), address(this));

        basketManager = _basketManager;
    }

    /***************************************
                MINTING (PUBLIC)
    ****************************************/

    /**
     * @dev Mint a single bAsset, at a 1:1 ratio with the bAsset. This contract
     *      must have approval to spend the senders bAsset
     * @param _bAsset         Address of the bAsset to mint
     * @param _bAssetQuantity Quantity in bAsset units
     * @return massetMinted   Number of newly minted mAssets
     */
    function mint(
        address _bAsset,
        uint256 _bAssetQuantity
    )
        external
        nonReentrant
        returns (uint256 massetMinted)
    {
        return _mintTo(_bAsset, _bAssetQuantity, msg.sender);
    }

    /**
     * @dev Mint a single bAsset, at a 1:1 ratio with the bAsset. This contract
     *      must have approval to spend the senders bAsset
     * @param _bAsset         Address of the bAsset to mint
     * @param _bAssetQuantity Quantity in bAsset units
     * @param _recipient receipient of the newly minted mAsset tokens
     * @return massetMinted   Number of newly minted mAssets
     */
    function mintTo(
        address _bAsset,
        uint256 _bAssetQuantity,
        address _recipient
    )
        external
        nonReentrant
        returns (uint256 massetMinted)
    {
        return _mintTo(_bAsset, _bAssetQuantity, _recipient);
    }

    /***************************************
              MINTING (INTERNAL)
    ****************************************/

    function _mintTo(
        address _basset,
        uint256 _bassetQuantity,
        address _recipient
    )
        internal
        returns (uint256 massetMinted)
    {
        require(_recipient != address(0), "must be a valid recipient");
        require(_bassetQuantity > 0, "quantity must not be 0");

        require(BasketManager(basketManager).isValidBasset(_basset), "invalid basset");
        require(BasketManager(basketManager).checkBasketBalanceForDeposit(_basset, _bassetQuantity));

        uint256 massetQuantity = BasketManager(basketManager).convertBassetToMasset(_basset, _bassetQuantity);

        IERC20(_basset).transferFrom(_recipient, address(this), _bassetQuantity);

        _mint(_recipient, massetQuantity);
        emit Minted(msg.sender, _recipient, massetQuantity, _basset, _bassetQuantity);

        return massetQuantity;
    }

    /***************************************
              REDEMPTION (PUBLIC)
    ****************************************/

    /**
     * @dev Credits the sender with a certain quantity of selected bAsset, in exchange for burning the
     *      relative mAsset quantity from the sender. Sender also incurs a small mAsset fee, if any.
     * @param _bAsset           Address of the bAsset to redeem
     * @param _massetQuantity   Units of the masset to redeem
     * @return massetMinted     Relative number of mAsset units burned to pay for the bAssets
     */
    function redeem(
        address _bAsset,
        uint256 _massetQuantity
    )
        external
        nonReentrant
        returns (uint256 massetRedeemed)
    {
        return _redeemTo(_bAsset, _massetQuantity, msg.sender);
    }

    /**
     * @dev Credits a recipient with a certain quantity of selected bAsset, in exchange for burning the
     *      relative Masset quantity from the sender. Sender also incurs a small fee, if any.
     * @param _bAsset           Address of the bAsset to redeem
     * @param _massetQuantity   Units of the masset to redeem
     * @param _recipient        Address to credit with withdrawn bAssets
     * @return massetMinted     Relative number of mAsset units burned to pay for the bAssets
     */
    function redeemTo(
        address _bAsset,
        uint256 _massetQuantity,
        address _recipient
    )
        external
        nonReentrant
        returns (uint256 massetRedeemed)
    {
        return _redeemTo(_bAsset, _massetQuantity, _recipient);
    }

    /***************************************
              REDEMPTION (INTERNAL)
    ****************************************/

    function _redeemTo(
        address _basset,
        uint256 _massetQuantity,
        address _recipient
    )
        internal
        returns (uint256 massetRedeemed)
    {
        require(_recipient != address(0), "must be a valid recipient");
        require(_massetQuantity > 0, "masset quantity must be greater than 0");
        require(BasketManager(basketManager).isValidBasset(_basset), "invalid basset");

        uint256 bassetQuantity = BasketManager(basketManager).convertMassetToBasset(_basset, _massetQuantity);

        require(BasketManager(basketManager).checkBasketBalanceForWithdrawal(_basset, bassetQuantity));

        IERC20(_basset).transfer(_recipient, bassetQuantity);

        _burn(_recipient, _massetQuantity);
        emit Redeemed(msg.sender, _recipient, _massetQuantity, _basset, bassetQuantity);

        return _massetQuantity;
    }

    // ERC777 Recipient
    function tokensReceived(
        address operator,
        address from,
        address to,
        uint amount,
        bytes calldata userData,
        bytes calldata operatorData
    ) external {
        emit onTokenReceivedCall(
            operator,
            from,
            to,
            amount,
            userData,
            operatorData
        );
    }
}
