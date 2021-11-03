pragma solidity ^0.5.17;
pragma experimental ABIEncoderV2;

import { SafeMath } from "@openzeppelin/contracts/math/SafeMath.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import { IERC777Recipient } from "@openzeppelin/contracts/token/ERC777/IERC777Recipient.sol";
import { IERC1820Registry } from "@openzeppelin/contracts/introspection/IERC1820Registry.sol";
import { InitializableOwnable } from "../helpers/InitializableOwnable.sol";
import { InitializableReentrancyGuard } from "../helpers/InitializableReentrancyGuard.sol";
import { IBridge } from "./IBridge.sol";
import { BasketManagerV3 } from "./BasketManagerV3.sol";
import { FeesVault } from "../vault/FeesVault.sol";
import { FeesManager } from "./FeesManager.sol";
import "./Token.sol";

/**
 * @title MassetV3
 * @dev Contract is responsible for managing mAsset and bAsset.
 * Used for minting and burning tokens, calculating fees and calling the bridge
 * if transaction based on token from another blockchain.
 */

contract MassetV3 is IERC777Recipient, InitializableOwnable, InitializableReentrancyGuard {

    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    using SafeERC20 for Token;

    // events

    /**
     * @dev Emitted when deposit is completed.
     * @param minter            Address of the minter.
     * @param recipient         Address of the recipient.
     * @param massetQuantity    Masset quantity.
     * @param bAsset            Address of the bAsset.
     * @param bassetQuantity    Basset quantity.
     */
    event Minted(
        address indexed minter,
        address indexed recipient,
        uint256 massetQuantity,
        address bAsset,
        uint256 bassetQuantity
    );

    /**
     * @dev Emitted when withdrawal is completed.
     * @param redeemer          Address of the redeemer.
     * @param recipient         Address of the recipient.
     * @param massetQuantity    Masset quantity.
     * @param bAsset            Address of the bAsset.
     * @param bassetQuantity    Basset quantity.
     */
    event Redeemed(
        address indexed redeemer,
        address indexed recipient,
        uint256 massetQuantity,
        address bAsset,
        uint256 bassetQuantity
    );

    /**
     * @dev Emitted when tokensReceived method is called by the bridge.
     * @param operator         Address operator requesting the transfer.
     * @param from             Address token holder address.
     * @param to               Address recipient address.
     * @param amount           uint256 amount of tokens to transfer.
     * @param userData         Bytes extra information provided by the token holder (if any).
     * @param operatorData     Bytes extra information provided by the operator (if any).
     */
    event onTokensReceivedCalled(
        address operator,
        address from,
        address to,
        uint amount,
        bytes userData,
        bytes operatorData
    );

    /**
     * @dev Emitted when onTokensMinted method is called by the bridge.
     * @param sender           Address of the sender.
     * @param orderAmount      Units of the masset to redeem.
     * @param tokenAddress     Address of the bAsset to redeem.
     * @param userData         Address of the final recipient as ABI encoded bytes.
     */
    event onTokensMintedCalled(
        address indexed sender,
        uint256 orderAmount,
        address tokenAddress,
        bytes userData
    );

    // state

    bytes32 constant ERC777_RECIPIENT_INTERFACE_HASH = keccak256("ERC777TokensRecipient");

    string private version;

    BasketManagerV3 private basketManager;
    Token private token;

    FeesVault private feesVault;
    FeesManager private feesManager;

    // internal

    /**
     * @dev Register this contracts as implementer of the "ERC777 Tokens Recipient" interface in the ERC1820 registry.
     */
    function registerAsERC777Recipient() internal {
        IERC1820Registry ERC1820 = IERC1820Registry(0x1820a4B7618BdE71Dce8cdc73aAB6C95905faD24);
        ERC1820.setInterfaceImplementer(address(this), ERC777_RECIPIENT_INTERFACE_HASH, address(this));
    }

    // public

    /**
   * @dev Contract initializer.
   * @param _basketManagerAddress           Address of the basket manager.
   * @param _tokenAddress                   Address of the mAsset token.
   * @param _registerAsERC777RecipientFlag  Bool determine if contract should be register as ERC777 recipient.
   */
    function initialize(
        address _basketManagerAddress,
        address _tokenAddress,
        bool _registerAsERC777RecipientFlag) public {

        require(address(basketManager) == address(0) && address(token) == address(0), "already initialized");
        require(_basketManagerAddress != address(0), "invalid basket manager");
        require(_tokenAddress != address(0), "invalid token");

        InitializableOwnable._initialize();
        InitializableReentrancyGuard._initialize();

        basketManager = BasketManagerV3(_basketManagerAddress);
        token = Token(_tokenAddress);
        if(_registerAsERC777RecipientFlag) {
            registerAsERC777Recipient();
        }

        version = "2.3";
    }

    /***************************************
                MINTING (PUBLIC)
    ****************************************/

    /**
     * @dev Mint a single mAsset, at a 1:1 ratio with the bAsset. This contract
     *      must have approval to spend the senders bAsset.
     * @param _bAsset         Address of the bAsset.
     * @param _bAssetQuantity Quantity in bAsset units.
     * @return massetMinted   Number of newly minted mAssets.
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
     * @dev Mint a single mAsset to recipient address, at a 1:1 ratio with the bAsset.
     *      This contract must have approval to spend the senders bAsset.
     * @param _bAsset         Address of the bAsset.
     * @param _bAssetQuantity Quantity in bAsset units.
     * @param _recipient      Receipient of the newly minted mAsset tokens.
     * @return massetMinted   Number of newly minted mAssets.
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

    /**
     * @dev Mint a single mAsset to recipient address, at a 1:1 ratio with the bAsset.
     *      This contract must have approval to spend the senders bAsset.
     * @param _basset         Address of the bAsset.
     * @param _bassetQuantity Quantity in bAsset units.
     * @param _recipient      Receipient of the newly minted mAsset tokens.
     * @return massetMinted   Number of newly minted mAssets.
     */
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
        require(basketManager.checkBasketBalanceForDeposit(_basset, _bassetQuantity), "invalid basket");

        (uint256 massetQuantity, uint256 bassetQuantity) = basketManager.convertBassetToMassetQuantity(_basset, _bassetQuantity);

        IERC20(_basset).safeTransferFrom(msg.sender, address(this), bassetQuantity);

        uint256 massetsToMint = _mintAndCalulateFee(massetQuantity, false);
        token.mint(_recipient, massetsToMint);

        emit Minted(msg.sender, _recipient, massetsToMint, _basset, bassetQuantity);

        return massetsToMint;
    }

    /**
     * @dev Mints fee to vault contract and return the amount of massets that goes to the user.
     * @param massetQuantity    Amount of massets.
     * @param _bridgeFlag       Flag that indicates if the proces is used with conjunction with bridge.
     * @return massetsToMint    Amount of massets that is left to mint for user.
     */
    function _mintAndCalulateFee(uint256 massetQuantity, bool _bridgeFlag) internal returns (uint256 massetsToMint) {
        uint256 fee;
        if (_bridgeFlag) {
            fee = feesManager.calculateDepositBridgeFee(massetQuantity);
        } else {
            fee = feesManager.calculateDepositFee(massetQuantity);
        }

        massetsToMint = massetQuantity.sub(fee);

        token.mint(address(feesVault), fee);

        return massetsToMint;
    }

    /***************************************
              REDEMPTION (PUBLIC)
    ****************************************/

    /**
     * @dev Credits the sender with a certain quantity of selected bAsset, in exchange for burning the
     *      relative mAsset quantity from the sender. Sender also incurs a small mAsset fee, if any.
     * @param _bAsset           Address of the bAsset to redeem.
     * @param _massetQuantity   Units of the masset to redeem.
     * @return massetMinted     Relative number of mAsset units burned to pay for the bAssets.
     */
    function redeem(
        address _bAsset,
        uint256 _massetQuantity
    ) external nonReentrant returns (uint256 massetRedeemed) {
        return _redeemTo(_bAsset, _massetQuantity, msg.sender, false);
    }

    /**
     * @dev Credits a recipient with a certain quantity of selected bAsset, in exchange for burning the
     *      relative mAsset quantity from the sender. Sender also incurs a small fee, if any.
     * @param _bAsset           Address of the bAsset to redeem.
     * @param _massetQuantity   Units of the masset to redeem.
     * @param _recipient        Address to credit with withdrawn bAssets.
     * @return massetMinted     Relative number of mAsset units burned to pay for the bAssets.
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

    /**
     * @dev Credits a recipient with a certain quantity of selected bAsset, in exchange for burning the
     *      relative mAsset quantity from the sender. Sender also incurs a small fee, if any.
     * @param _basset           Address of the bAsset to redeem.
     * @param _massetQuantity   Units of the masset to redeem.
     * @param _recipient        Address to credit with withdrawn bAssets.
     * @param bridgeFlag        Flag that indicates if the reedem proces is used with conjunction with bridge.
     * @return massetMinted     Relative number of mAsset units burned to pay for the bAssets.
     */
    function _redeemTo(
        address _basset,
        uint256 _massetQuantity,
        address _recipient,
        bool bridgeFlag
    ) internal returns (uint256 massetRedeemed) {
        require(_recipient != address(0), "must be a valid recipient");
        require(_massetQuantity > 0, "masset quantity must be greater than 0");
        require(basketManager.isValidBasset(_basset), "invalid basset");

        // massetsToBurn is the amount of massets that is left to burn after the fee was taken.
        // It is used to calculate amount of bassets that are transfered to user.
        uint256 massetsAfterFee = _transferAndCalulateFee(_massetQuantity, msg.sender, bridgeFlag);
        (uint256 bassetQuantity, uint256 massetsToBurn) = basketManager.convertMassetToBassetQuantity(_basset, massetsAfterFee);

        require(basketManager.checkBasketBalanceForWithdrawal(_basset, bassetQuantity), "invalid basket");

        token.burn(msg.sender, massetsToBurn);
        // In case of withdrawal to bridge the receiveTokensAt is called instead of transfer.
        if(bridgeFlag) {
            address bridgeAddress = basketManager.getBridge(_basset);
            require(bridgeAddress != address(0), "invalid bridge");
            IERC20(_basset).approve(bridgeAddress, bassetQuantity);
            require(
                IBridge(bridgeAddress).receiveTokensAt(_basset, bassetQuantity, _recipient, bytes("")),
                "call to bridge failed");
        } else {
            IERC20(_basset).safeTransfer(_recipient, bassetQuantity);
        }

        emit Redeemed(msg.sender, _recipient, _massetQuantity, _basset, bassetQuantity);

        return massetsToBurn;
    }

    /**
     * @dev Transfers fee to vault contract and return the amount of massets that will be burned
     *      must have approval to spend the senders Masset.
     * @param massetQuantity        Amount of massets to withdraw.
     * @param sender                Owner of massets.
     * @param _bridgeFlag           Flag that indicates if the proces is used with conjunction with bridge.
     * @return massetsToBurn        Amount of massets that is left to burn.
     */
    function _transferAndCalulateFee(uint256 massetQuantity, address sender, bool _bridgeFlag) internal returns (uint256 massetsToBurn) {
        uint256 fee;
        if (_bridgeFlag) {
            fee = feesManager.calculateRedeemBridgeFee(massetQuantity);
        } else {
            fee = feesManager.calculateRedeemFee(massetQuantity);
        }

        massetsToBurn = massetQuantity.sub(fee);

        token.safeTransferFrom(sender, address(feesVault), fee);

        return massetsToBurn;
    }

    // For the BRIDGE

    /**
     * @dev Credits a recipient with a certain quantity of selected bAsset, in exchange for burning the
     *      relative Masset quantity from the sender. Sender also incurs a small fee, if any.
     *      This function is designed to also call the bridge in order to have the basset tokens sent to
     *      another blockchain.
     * @param _basset           Address of the bAsset to redeem.
     * @param _massetQuantity   Units of the masset to redeem.
     * @param _recipient        Address to credit with withdrawn bAssets.
     * @param _bridgeAddress    This is ignored and is left here for backward compatibility with the FE.
     * @return massetMinted     Relative number of mAsset units burned to pay for the bAssets.
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
     * @param _basset           Address of the bAsset to redeem.
     * @param _massetQuantity   Units of the masset to redeem.
     * @param _recipient        Address to credit with withdrawn bAssets.
     * @return massetMinted     Relative number of mAsset units burned to pay for the bAssets.
     */
    function redeemToBridge(
        address _basset,
        uint256 _massetQuantity,
        address _recipient
    ) external nonReentrant returns (uint256 massetRedeemed) {
        return _redeemTo(_basset, _massetQuantity, _recipient, true);
    }

    /**
     * @dev Decode bytes data to address.
     * @param data              Data to decode.
     * @return address          Decoded address.
     */
    function _decodeAddress(bytes memory data) private pure returns (address) {
        address addr = abi.decode(data, (address));
        require(addr != address(0), "Converter: Error decoding extraData");
        return addr;
    }

    /**
     * @dev Encode address to bytes data.
     * @param _address          Address to encode.
     * @return address          Decoded address.
     */
    function _encodeAddress(address _address) private pure returns (bytes memory) {
        require(_address != address(0), "Converter: Error encoding extraData");
        return abi.encode(_address);
    }

    /**
     * @dev This is called by the bridge to let us know tokens have been received.
     * @param _operator         Address operator requesting the transfer.
     * @param _from             Address token holder address.
     * @param _to               Address recipient address.
     * @param _amount           uint256 amount of tokens to transfer.
     * @param _userData         Bytes extra information provided by the token holder (if any).
     * @param _operatorData     Bytes extra information provided by the operator (if any).
     */
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
     * @param _orderAmount      Units of the masset to redeem.
     * @param _tokenAddress     Address of the bAsset to redeem.
     * @param _userData         Address of the final recipient as ABI encoded bytes.
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

        (uint256 massetQuantity, uint256 bassetQuantity) = basketManager.convertBassetToMassetQuantity(basset, _orderAmount);
        uint256 massetsToMint = _mintAndCalulateFee(massetQuantity, true);
        token.mint(recipient, massetsToMint);

        emit Minted(msg.sender, recipient, massetsToMint, basset, bassetQuantity);
    }

    // Getters

    function getFeesVault() external view returns (address) {
        return address(feesVault);
    }

    function getFeesManager() external view returns (address) {
        return address(feesManager);
    }

    function getVersion() external view returns (string memory) {
        return version;
    }

    function getToken() external view returns (address) {
        return address(token);
    }

    function getBasketManager() external view returns (address) {
        return address(basketManager);
    }

    address[] private bassets;
    int256[] private factors;
    address[] private bridges;
    uint256[] private mins;
    uint256[] private maxs;
    bool[] private pausedFlags;

    // Temporary migration
    /**
     * @dev Temporary migration to V3 version.
     * @notice this contract should be an owner of basket manager
     */
    function upgradeToV3(
        address _basketManagerAddress,
        address _feesVaultAddress,
        address _feesManagerAddress
    ) external {
        require(keccak256(bytes(version)) == keccak256(bytes("2.3")), "wrong version (1)");
        require(keccak256(bytes(BasketManagerV3(_basketManagerAddress).getVersion())) == keccak256(bytes("3.0")), "wrong version (2)");

        feesManager = FeesManager(_feesManagerAddress);
        feesVault = FeesVault(_feesVaultAddress);
        basketManager = BasketManagerV3(_basketManagerAddress);

        // add bassets from old basket manager

        uint256 chainId;
        assembly {
            chainId := chainid()
        }

        // testnet
        if (chainId == 31) {
            // ----- ETH->RSK -----
            bassets.push(0xcB92c8d49Ec01b92f2a766C7c3C9C501C45271e0); // DAIes
            bridges.push(0xC0E7A7FfF4aBa5e7286D5d67dD016B719DCc9156);
            factors.push(1);
            mins.push(0);
            maxs.push(1000);
            pausedFlags.push(false);

            bassets.push(0xCc8EEc21aE75f1A2DE4aC7b32a7de888A45cF859); // USDCes
            bridges.push(0xC0E7A7FfF4aBa5e7286D5d67dD016B719DCc9156);
            factors.push(1);
            mins.push(0);
            maxs.push(1000);
            pausedFlags.push(false);

            bassets.push(0x10C5A7930fc417E728574e334b1488b7895C4b81); // USDTes
            bridges.push(0xC0E7A7FfF4aBa5e7286D5d67dD016B719DCc9156);
            factors.push(1);
            mins.push(0);
            maxs.push(1000);
            pausedFlags.push(false);

            // ----- BSC->RSK -----
            bassets.push(0x407Ff7D4760d3a81b4740D268eb04490C7dFE7f2); // bsDAI
            bridges.push(0x2b2BCAD081fA773DC655361d1Bb30577Caa556F8);
            factors.push(1);
            mins.push(0);
            maxs.push(1000);
            pausedFlags.push(false);

            bassets.push(0x3e2cf87e7fF4048A57F9Cdde9368C9f4bfb43aDf); // bsUSDC
            bridges.push(0x2b2BCAD081fA773DC655361d1Bb30577Caa556F8);
            factors.push(1);
            mins.push(0);
            maxs.push(1000);
            pausedFlags.push(false);

            bassets.push(0x43bC3f0FfFf6c9BBf3C2EAfe464C314d43f561De); // bsUSDT
            bridges.push(0x2b2BCAD081fA773DC655361d1Bb30577Caa556F8);
            factors.push(1);
            mins.push(0);
            maxs.push(1000);
            pausedFlags.push(false);

            bassets.push(0x8c9abb6c9D8D15ddB7ada2e50086e1050aB32688); // bsBUSD
            bridges.push(0x2b2BCAD081fA773DC655361d1Bb30577Caa556F8);
            factors.push(1);
            mins.push(0);
            maxs.push(1000);
            pausedFlags.push(false);

            // ----- non bridge -----
            bassets.push(0xC3De9F38581f83e281f260d0DdbaAc0e102ff9F8); // rDOC
            bridges.push(0x0000000000000000000000000000000000000000);
            factors.push(1);
            mins.push(0);
            maxs.push(1000);
            pausedFlags.push(false);

            bassets.push(0xCB46c0ddc60D18eFEB0E586C17Af6ea36452Dae0);// DOC
            bridges.push(0x0000000000000000000000000000000000000000);
            factors.push(1);
            mins.push(0);
            maxs.push(1000);
            pausedFlags.push(false);
        }

        // mainnet
        if (chainId == 30) {
            // ----- ETH->RSK -----
            bassets.push(0x1a37c482465e78E6dabE1eC77b9A24d4236D2A11); // DAIes
            factors.push(int256(1));
            bridges.push(0x1CcAd820B6d031B41C54f1F3dA11c0d48b399581);
            mins.push(0);
            maxs.push(1000);
            pausedFlags.push(false);

            bassets.push(0x8D1F7cBC6391d95E2774380E80a666fEBf655d6B); // USDCes
            factors.push(int256(1));
            bridges.push(0x1CcAd820B6d031B41C54f1F3dA11c0d48b399581);
            mins.push(0);
            maxs.push(1000);
            pausedFlags.push(false);

            bassets.push(0xD9665Ea8F5Ff70CF97e1b1CD1B4Cd0317B0976e8); // USDTes
            factors.push(int256(1));
            bridges.push(0x1CcAd820B6d031B41C54f1F3dA11c0d48b399581);
            mins.push(0);
            maxs.push(1000);
            pausedFlags.push(false);

            // ----- BSC->RSK -----
            bassets.push(0x6A42FF12215a90F50866a5CE43a9c9c870116E76); // DAIbs
            factors.push(int256(1));
            bridges.push(0x971B97C8cc82E7D27Bc467C2DC3F219c6eE2e350);
            mins.push(0);
            maxs.push(1000);
            pausedFlags.push(false);

            bassets.push(0x91eDceE9567cD5612C9DeDeAAe24D5e574820Af1); // USDCbs
            factors.push(int256(1));
            bridges.push(0x971B97C8cc82E7D27Bc467C2DC3F219c6eE2e350);
            mins.push(0);
            maxs.push(1000);
            pausedFlags.push(false);

            bassets.push(0xFf4299bcA0313c20A61dC5Ed597739743bEf3f6D); // USDTbs
            factors.push(int256(1));
            bridges.push(0x971B97C8cc82E7D27Bc467C2DC3F219c6eE2e350);
            mins.push(0);
            maxs.push(1000);
            pausedFlags.push(false);

            bassets.push(0x61e9604E31a736129D7f5c58964C75935b2D80d6); // BUSDbs
            factors.push(int256(1));
            bridges.push(0x971B97C8cc82E7D27Bc467C2DC3F219c6eE2e350);
            mins.push(0);
            maxs.push(1000);
            pausedFlags.push(false);

            // ----- non bridge -----
            bassets.push(0xef213441A85dF4d7ACbDaE0Cf78004e1E486bB96); // RUSDT
            factors.push(int256(1));
            bridges.push(0x0000000000000000000000000000000000000000);
            mins.push(0);
            maxs.push(1000);
            pausedFlags.push(false);

            bassets.push(0x2d919F19D4892381D58edeBeca66D5642Cef1a1f); // rDOC
            factors.push(int256(1));
            bridges.push(0x0000000000000000000000000000000000000000);
            mins.push(0);
            maxs.push(1000);
            pausedFlags.push(false);

            bassets.push(0xe700691dA7b9851F2F35f8b8182c69c53CcaD9Db); // DOC
            factors.push(int256(1));
            bridges.push(0x0000000000000000000000000000000000000000);
            mins.push(0);
            maxs.push(1000);
            pausedFlags.push(false);
        }

        basketManager.addBassets(bassets, factors, bridges, mins, maxs, pausedFlags);
        basketManager.transferOwnership(msg.sender);
        version = "3.0";
        InitializableReentrancyGuard._initialize();
    }
}
