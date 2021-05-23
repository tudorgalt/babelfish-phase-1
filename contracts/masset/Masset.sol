pragma solidity 0.5.16;
pragma experimental ABIEncoderV2;

import { BasketManager } from "./BasketManager.sol";
import { SafeMath } from "../openzeppelin/contracts/math/SafeMath.sol";
import { IERC20 } from "../openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IERC777Recipient } from "../openzeppelin/contracts/token/ERC777/IERC777Recipient.sol";
import { IERC1820Registry } from "../openzeppelin/contracts/introspection/IERC1820Registry.sol";
import { IBridge } from "./IBridge.sol";
import { InitializableOwnable } from "../helpers/InitializableOwnable.sol";
import "./Token.sol";

contract Masset is IERC777Recipient, InitializableOwnable {

    using SafeMath for uint256;

    // Events

    event Minted(
        address indexed minter,
        address indexed recipient,
        uint256 massetQuantity,
        address bAsset,
        uint256 bassetQuantity);

    event Redeemed(
        address indexed redeemer,
        address indexed recipient,
        uint256 massetQuantity,
        address bAsset,
        uint256 bassetQuantity);

    event onTokensReceivedCalled(
        address operator,
        address from,
        address to,
        uint amount,
        bytes userData,
        bytes operatorData
    );

    event onTokensMintedCalled(
        address indexed sender,
        uint256 orderAmount,
        address tokenAddress,
        bytes userData
    );

    // Filler for backward compatibility
    address bogus1; // for backward compatibility
    address bogus2; // for backward compatibility
    address bogus3; // for backward compatibility
    address bogus4; // for backward compatibility

    // non-reentrancy
    bool private entryFlag;
    modifier nonReentrant() {
        require(!entryFlag);
        entryFlag = true;
        _;
        entryFlag = false;
    }

    // state
    BasketManager private basketManager;
    Token private token;
    IBridge private bridge;

    bool migrationCompletedV1;

    // internal

    function registerAsERC777Recipient() internal {
        IERC1820Registry ERC1820 = IERC1820Registry(0x1820a4B7618BdE71Dce8cdc73aAB6C95905faD24);
        ERC1820.setInterfaceImplementer(address(this), keccak256("ERC777TokensRecipient"), address(this));
    }

    // public

    function initialize(
        address _basketManagerAddress,
        address _tokenAddress,
        address _bridgeAddress,
        bool _registerAsERC777RecipientFlag) public {

        require(address(basketManager) == address(0) && address(token) == address(0), "already initialized");

        InitializableOwnable.initialize();

        basketManager = BasketManager(_basketManagerAddress);
        token = Token(_tokenAddress);
        bridge = IBridge(_bridgeAddress);
        if(_registerAsERC777RecipientFlag) {
            registerAsERC777Recipient();
        }
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

        require(basketManager.isValidBasset(_basset), "invalid basset");
        require(basketManager.checkBasketBalanceForDeposit(_basset, _bassetQuantity));

        uint256 massetQuantity = basketManager.convertBassetToMasset(_basset, _bassetQuantity);

        IERC20(_basset).transferFrom(msg.sender, address(this), _bassetQuantity);

        token.mint(_recipient, massetQuantity);
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
    ) external nonReentrant returns (uint256 massetRedeemed) {
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
    ) external nonReentrant returns (uint256 massetRedeemed) {
        return _redeemTo(_bAsset, _massetQuantity, _recipient);
    }

    /***************************************
              REDEMPTION (INTERNAL)
    ****************************************/

    function _redeemTo(
        address _basset,
        uint256 _massetQuantity,
        address _recipient
    ) internal returns (uint256 massetRedeemed) {
        require(_recipient != address(0), "must be a valid recipient");
        require(_massetQuantity > 0, "masset quantity must be greater than 0");
        require(basketManager.isValidBasset(_basset), "invalid basset");

        uint256 bassetQuantity = basketManager.convertMassetToBasset(_basset, _massetQuantity);

        require(basketManager.checkBasketBalanceForWithdrawal(_basset, bassetQuantity));

        IERC20(_basset).transfer(_recipient, bassetQuantity);

        token.burn(_recipient, _massetQuantity);
        emit Redeemed(msg.sender, _recipient, _massetQuantity, _basset, bassetQuantity);

        return _massetQuantity;
    }

    // For the BRIDGE

    function redeemToBridge(
        address _basset,
        uint256 _massetQuantity,
        address _recipient,
        address _bridgeAddress // for backward compatibility
    ) external nonReentrant returns (uint256 massetRedeemed) {
        require(_bridgeAddress == address(bridge), "invalid bridge");
        return _redeemToBridge(_basset, _massetQuantity, _recipient);
    }

    function redeemToBridge(
        address _basset,
        uint256 _massetQuantity,
        address _recipient
    ) external nonReentrant returns (uint256 massetRedeemed) {
        return _redeemToBridge(_basset, _massetQuantity, _recipient);
    }

    function _redeemToBridge(
        address _basset,
        uint256 _massetQuantity,
        address _recipient
    ) internal returns (uint256 massetRedeemed) {
        require(_recipient != address(0), "must be a valid recipient");
        require(_massetQuantity > 0, "masset quantity must be greater than 0");
        require(basketManager.isValidBasset(_basset), "invalid basset");

        uint256 bassetQuantity = basketManager.convertMassetToBasset(_basset, _massetQuantity);
        require(basketManager.checkBasketBalanceForWithdrawal(_basset, bassetQuantity), "basket out of balance");

        IERC20(_basset).approve(address(bridge), bassetQuantity);
        require(
            bridge.receiveTokensAt(_basset, bassetQuantity, _recipient, bytes("")),
            "call to bridge failed");

        token.burn(_recipient, _massetQuantity);
        emit Redeemed(msg.sender, _recipient, _massetQuantity, _basset, bassetQuantity);

        return _massetQuantity;
    }

    function _decodeAddress(bytes memory data) private pure returns (address) {
        address addr = abi.decode(data, (address));
        require(addr != address(0), "Converter: Error decoding extraData");
        return addr;
    }

    function _encodeAddress(address _address) private pure returns (bytes memory) {
        require(_address != address(0), "Converter: Error encoding extraData");
        return abi.encode(_address);
    }

    function tokensReceived(
        address _operator,
        address _from,
        address _to,
        uint _amount,
        bytes calldata _userData,
        bytes calldata _operatorData
    ) external {
        emit onTokensReceivedCalled(
            _operator,
            _from,
            _to,
            _amount,
            _userData,
            _operatorData
        );

        // This is probably not needed, because the bridge calls onTokensMinted
        /*
        require(_amount > 0, "amount must be > 0");

        address recipient =  _decodeAddress(_userData);
        address basset = msg.sender;
        require(BasketManager(basketManager).isValidBasset(basset), "invalid basset");
        require(BasketManager(basketManager).checkBasketBalanceForDeposit(basset, _amount), "basket out of balance");

        uint256 massetQuantity = BasketManager(basketManager).convertBassetToMasset(basset, _amount);
        _mint(recipient, massetQuantity);
        emit Minted(_from, recipient, massetQuantity, basset, _amount, symbol());
        */
    }

    function onTokensMinted(
        uint256 _orderAmount,
        address _tokenAddress,
        bytes calldata _userData
    ) external nonReentrant {
        emit onTokensMintedCalled(msg.sender, _orderAmount, _tokenAddress, _userData);

        require(_orderAmount > 0, "amount must be > 0");
        require(msg.sender == address(bridge), "only bridge may call");

        address recipient =  _decodeAddress(_userData);
        address basset = _tokenAddress;

        require(basketManager.isValidBasset(basset), "invalid basset");
        require(basketManager.checkBasketBalanceForDeposit(basset, _orderAmount), "basket out of balance");

        uint256 massetQuantity = basketManager.convertBassetToMasset(basset, _orderAmount);
        token.mint(recipient, massetQuantity);
        emit Minted(msg.sender, recipient, massetQuantity, basset, _orderAmount);
    }

    // Getters

    function getToken() external view returns (address) {
        return address(token);
    }

    function geBasketManager() external view returns (address) {
        return address(basketManager);
    }

    function geBridge() external view returns (address) {
        return address(bridge);
    }

    // Admin functions

    function setBasketManager(address _basketManagerAddress) public onlyOwner {
        require(_basketManagerAddress != address(0), "address invalid");
        require(_basketManagerAddress != address(basketManager), "same address");

        basketManager = BasketManager(_basketManagerAddress);
    }

    function setToken(address _tokenAddress) public onlyOwner {
        require(_tokenAddress != address(0), "address invalid");
        require(_tokenAddress != address(token), "same address");

        token = Token(_tokenAddress);
    }

    function setBridge(address _bridgeAddress) public onlyOwner {
        require(_bridgeAddress != address(0), "address invalid");
        require(_bridgeAddress != address(bridge), "same address");

        bridge = IBridge(_bridgeAddress);
    }

    function setTokenOwner(address _newOwner) public onlyOwner {
        require(_newOwner != address(0), "address invalid");
        require(_newOwner != token.owner(), "same address");

        token.transferOwnership(_newOwner);
    }

    // Migrations
    function migrationV1(
        address _basketManagerAddress,
        address _tokenAddress,
        address _bridgeAddress) public {
        //require(!migrationCompletedV1, "already executed");

        //InitializableOwnable.initialize();

        basketManager = BasketManager(_basketManagerAddress);
        token = Token(_tokenAddress);
        bridge = IBridge(_bridgeAddress);
        registerAsERC777Recipient();

        //migrationCompletedV1 = true;
    }
}
