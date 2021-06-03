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
import { InitializableReentrancyGuard } from "../helpers/InitializableReentrancyGuard.sol";

contract Masset is IERC777Recipient, InitializableOwnable, InitializableReentrancyGuard {

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

    event onSetBasketManager(address indexed sender, address indexed oldBasketManager, address indexed newBaskManager);
    event onSetToken(address indexed sender, address indexed oldToken, address indexed newToken);
    event onSetTokenOwner(address indexed sender, address indexed oldTokenOwner, address indexed newTokenOwner);

    address bogus1; // for backward compatibility
    address bogus2; // for backward compatibility
    address bogus3; // for backward compatibility
    address bogus4; // for backward compatibility

    // state
    BasketManager private basketManager;
    Token private token;

    // Deprecated, must be address(0)
    IBridge private bridge;

    // internal

    function registerAsERC777Recipient() internal {
        IERC1820Registry ERC1820 = IERC1820Registry(0x1820a4B7618BdE71Dce8cdc73aAB6C95905faD24);
        ERC1820.setInterfaceImplementer(address(this), keccak256("ERC777TokensRecipient"), address(this));
    }

    // public

    function initialize(
        address _basketManagerAddress,
        address _tokenAddress,
        bool _registerAsERC777RecipientFlag) public {

        require(address(basketManager) == address(0) && address(token) == address(0), "already initialized");
        require(_basketManagerAddress != address(0), "invalid basket manager");
        require(_tokenAddress != address(0), "invalid token");

        InitializableOwnable._initialize();
        InitializableReentrancyGuard._initialize();

        basketManager = BasketManager(_basketManagerAddress);
        token = Token(_tokenAddress);
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

        uint256 massetQuantity = basketManager.convertBassetToMassetQuantity(_basset, _bassetQuantity);

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
        return _redeemTo(_bAsset, _massetQuantity, msg.sender, false);
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
        return _redeemTo(_bAsset, _massetQuantity, _recipient, false);
    }

    /***************************************
              REDEMPTION (INTERNAL)
    ****************************************/

    function _redeemTo(
        address _basset,
        uint256 _massetQuantity,
        address _recipient,
        bool bridgeFlag
    ) internal returns (uint256 massetRedeemed) {
        require(_recipient != address(0), "must be a valid recipient");
        require(_massetQuantity > 0, "masset quantity must be greater than 0");
        require(basketManager.isValidBasset(_basset), "invalid basset");

        uint256 bassetQuantity = basketManager.convertMassetToBassetQuantity(_basset, _massetQuantity);

        require(basketManager.checkBasketBalanceForWithdrawal(_basset, bassetQuantity));

        if(bridgeFlag) {
            address bridgeAddress = basketManager.getBridge(_basset);
            require(bridgeAddress != address(0), "invalid bridge");
            IERC20(_basset).approve(bridgeAddress, bassetQuantity);
            require(
                IBridge(bridgeAddress).receiveTokensAt(_basset, bassetQuantity, _recipient, bytes("")),
                "call to bridge failed");
        } else {
            IERC20(_basset).transfer(_recipient, bassetQuantity);
        }

        token.burn(msg.sender, _massetQuantity);
        emit Redeemed(msg.sender, _recipient, _massetQuantity, _basset, bassetQuantity);

        return _massetQuantity;
    }

    // For the BRIDGE

    /**
     * @dev Credits a recipient with a certain quantity of selected bAsset, in exchange for burning the
     *      relative Masset quantity from the sender. Sender also incurs a small fee, if any.
     *      This function is designed to also call the bridge in order to have the basset tokens sent to
     *      another blockchain.
     * @param _basset           Address of the bAsset to redeem
     * @param _massetQuantity   Units of the masset to redeem
     * @param _recipient        Address to credit with withdrawn bAssets
     * @param _bridgeAddress    This is ignored and is left here for backward compatibility with the FE
     * @return massetMinted     Relative number of mAsset units burned to pay for the bAssets
     */
    function redeemToBridge(
        address _basset,
        uint256 _massetQuantity,
        address _recipient,
        address _bridgeAddress // IGNORED! for backward compatibility
    ) external nonReentrant returns (uint256 massetRedeemed) {
        return _redeemTo(_basset, _massetQuantity, _recipient, true);
    }

    /**
     * @dev Credits a recipient with a certain quantity of selected bAsset, in exchange for burning the
     *      relative Masset quantity from the sender. Sender also incurs a small fee, if any.
     *      This function is designed to also call the bridge in order to have the basset tokens sent to
     *      another blockchain.
     * @param _basset           Address of the bAsset to redeem
     * @param _massetQuantity   Units of the masset to redeem
     * @param _recipient        Address to credit with withdrawn bAssets
     * @return massetMinted     Relative number of mAsset units burned to pay for the bAssets
     */
    function redeemToBridge(
        address _basset,
        uint256 _massetQuantity,
        address _recipient
    ) external nonReentrant returns (uint256 massetRedeemed) {
        return _redeemTo(_basset, _massetQuantity, _recipient, true);
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
    }

    /**
     * @dev This is called by the bridge to let us know the user has sent tokens through it and
     *      into the masset.
     * @param _orderAmount      Units of the masset to redeem
     * @param _tokenAddress     Address of the bAsset to redeem
     * @param _userData         Address of the final recipient as ABI encoded bytes
     */
    function onTokensMinted(
        uint256 _orderAmount,
        address _tokenAddress,
        bytes calldata _userData
    ) external nonReentrant {
        emit onTokensMintedCalled(msg.sender, _orderAmount, _tokenAddress, _userData);

        require(_orderAmount > 0, "amount must be > 0");

        address recipient =  _decodeAddress(_userData);
        address basset = _tokenAddress;

        address bridgeAddress = basketManager.getBridge(basset);
        require(msg.sender == bridgeAddress, "only bridge may call");

        require(basketManager.isValidBasset(basset), "invalid basset");
        require(basketManager.checkBasketBalanceForDeposit(basset, _orderAmount), "basket out of balance");

        uint256 massetQuantity = basketManager.convertBassetToMassetQuantity(basset, _orderAmount);
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

    // Admin functions

    function setBasketManager(address _basketManagerAddress) public onlyOwner {
        require(_basketManagerAddress != address(0), "address invalid");
        require(_basketManagerAddress != address(basketManager), "same address");

        emit onSetBasketManager(msg.sender, address(basketManager), _basketManagerAddress);
        basketManager = BasketManager(_basketManagerAddress);
    }

    function setToken(address _tokenAddress) public onlyOwner {
        require(_tokenAddress != address(0), "address invalid");
        require(_tokenAddress != address(token), "same address");

        emit onSetToken(msg.sender, address(token), _tokenAddress);
        token = Token(_tokenAddress);
    }

    function setTokenOwner(address _newOwner) public onlyOwner {
        require(_newOwner != address(0), "address invalid");
        require(_newOwner != token.owner(), "same address");

        emit onSetTokenOwner(msg.sender, token.owner(), _newOwner);
        token.transferOwnership(_newOwner);
    }

    // MIGRATIONS

    function getVersion() external returns (string memory) {
        return "2.0";
    }

    function migrateFromV1ToV2() external {
        require(address(bridge) != address(0), "invalid state 1");
        bridge = IBridge(address(0));

        require(address(basketManager) == address(0xaC148e5D164Ce1164e14913b329feA8e4dA0b699) /* TESTNET */ ||
        address(basketManager) == address(0xb97cEC56b4A33a3bE341277dfDf5a0af57a425d1) /* MAINNET */, "invalid state 2");

        if(address(basketManager) == 0xaC148e5D164Ce1164e14913b329feA8e4dA0b699 /* TESTNET */ ) {
            address[] memory bassets = new address[](2);
            bassets[0] = 0x4F2fc8D55C1888A5ACa2503E2f3E5D74EEF37C33;
            bassets[1] = 0x793cE6F95912d5b43532C2116e1B68993D902272;
            int256[] memory factors = new int256[](2);
            factors[0] = 1;
            factors[1] = 1;
            address[] memory bridges = new address[](2);
            bridges[0] = 0xC0E7A7FfF4aBa5e7286D5d67dD016B719DCc9156;
            bridges[1] = 0x2b2BCAD081fA773DC655361d1Bb30577Caa556F8;
            basketManager = new BasketManager(bassets, factors, bridges);
        } else if(address(basketManager) == 0xb97cEC56b4A33a3bE341277dfDf5a0af57a425d1 /* MAINNET */) {
            address[] memory bassets = new address[](2);
            bassets[0] = 0xfE878227c8F334038dAB20a99FC3B373FfE0a755;
            bassets[1] = 0x30D1b36924C2c0Cd1C03eC257D7fff31Bd8C3007;
            int256[] memory factors = new int256[](2);
            factors[0] = 1;
            factors[1] = 1;
            address[] memory bridges = new address[](2);
            bridges[0] = 0x1CcAd820B6d031B41C54f1F3dA11c0d48b399581;
            bridges[1] = 0x971B97C8cc82E7D27Bc467C2DC3F219c6eE2e350;
            basketManager = new BasketManager(bassets, factors, bridges);
        }
    }
}
