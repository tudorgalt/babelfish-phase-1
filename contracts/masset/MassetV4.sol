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
import { BasketManagerV4 } from "./BasketManagerV4.sol";
import { RewardsManager } from "./RewardsManager.sol";
import { FeesManager } from "./FeesManager.sol";
import { FeesVault } from "../vault/FeesVault.sol";
import { RewardsVault } from "../vault/RewardsVault.sol";
import "./Token.sol";

/**
 * @title MassetV4
 * @dev Contract is responsible for managing mAsset and bAsset.
 * Used for minting and burning tokens, calculating fees and calling the bridge 
 * if transaction based on token from another blockchain.
 */
contract MassetV4 is IERC777Recipient, InitializableOwnable, InitializableReentrancyGuard {

    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    using SafeERC20 for Token;

    // Events

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

    BasketManagerV4 private basketManager;
    Token private token;

    FeesVault private feesVault;
    FeesManager private feesManager;
    RewardsVault private rewardsVault;
    RewardsManager private rewardsManager;

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
     * @param _rewardsManagerAddress  Address of the rewards manager.
     * @param _rewardsVaultAddress    Address of the rewards vault.
    */
    function initialize(
        address _rewardsManagerAddress,
        address _rewardsVaultAddress
    ) public {
        require(keccak256(bytes(version)) == keccak256(bytes("3.0")), "wrong version");
        require(_rewardsManagerAddress != address(0), "invalid rewards manager address");
        require(_rewardsVaultAddress != address(0), "invalid rewards vault address");

        rewardsVault = RewardsVault(_rewardsVaultAddress);
        rewardsManager = RewardsManager(_rewardsManagerAddress);

        version = "4.0";
    }

    /**
     * @dev Calculate and return reward amount.
     * @param _basset           Address of basset to deposit/withdraw.
     * @param _massetQuantity   Amount of masset to deposit / withdraw.
     * @param _isDeposit        Type of action deposit / withdraw. It's used to determine offset direction.
     * @return rewardAmount     Calculated reward amount.
     *         Positive value means that user will be rewarded, negative that this amount will be taken.
     */
    function calculateReward (
        address _basset,
        uint256 _massetQuantity,
        bool _isDeposit
    ) internal view returns(int256 rewardAmount) {
        (int256 deviationBefore, int256 deviationAfter) = basketManager.getBassetRatioDeviation(_basset, _massetQuantity, _isDeposit);

        rewardAmount = rewardsManager.calculateReward(deviationBefore, deviationAfter, _isDeposit);

        if(rewardAmount < 0) {
            require(uint256(-rewardAmount) < _massetQuantity, "Insuficient balance to cover rewards.");
        }else if(rewardAmount > 0) {
            uint256 rewardsVaultBalance = token.balanceOf(address(rewardsVault));

            if (rewardsVaultBalance < uint256(rewardAmount)) {
                rewardAmount = int256(rewardsVaultBalance);
            }
        }

        return rewardAmount;
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

    /**
     * @dev Calculates how many mAssets will be given to user for deposit.
     * @notice includes fees and rewards
     * @param _bAsset          Address of the bAsset.
     * @param _bAssetQuantity  Quantity in bAsset units.
     * @return  massetsMinted: total amount of mAssets that will be given for user
     *          bassetsTaken:  total amount of bAssets that will be taken from user
     */
    function calculateMintRatio (
        address _bAsset,
        uint256 _bAssetQuantity
    ) public view returns(uint256 massetsMinted, uint256 bassetsTaken) {
        (, int256 reward, uint256 massetsToMint, uint256 bassetsToTake) = calculateMint(_bAsset, _bAssetQuantity, false);

        uint256 transferedReward = 0;
        if (reward > 0) {
            transferedReward = uint256(reward);
        }

        return (massetsToMint.add(transferedReward), bassetsToTake);
    }

    /**
     * @dev Calculates all needed data to perform deposit for certain bAsset.
     * @param _bAsset         Address of the bAsset.
     * @param _bAssetQuantity Quantity in bAsset units.
     * @param _bridgeFlag     Flag that indicates if the mint proces is used with conjunction with bridge.
     * @return  fee: amount of fee that will be taken
     *          reward: amount to reward/punish user for performing action in specific pool balance.
     *          massetsToMint: amount of mAsset that will be minted for user. IT DOES NOT INCLUDE FEES AND REWARDS!
     *          bassetsToTake: amount of bAssets that will be taken from user.
     */
    function calculateMint (
        address _bAsset,
        uint256 _bAssetQuantity,
        bool _bridgeFlag
    ) public view returns (uint256 fee, int256 reward, uint256 massetsToMint, uint256 bassetsToTake) {
        require(basketManager.isValidBasset(_bAsset), "invalid basset");
        require(_bAssetQuantity > 0, "quantity must not be 0");

        (uint256 massetQuantity, uint256 bassetQuantity) = basketManager.convertBassetToMassetQuantity(_bAsset, _bAssetQuantity);
        require(basketManager.checkBasketBalanceForDeposit(_bAsset, bassetQuantity), "basket out of balance");

        if (_bridgeFlag) {
            fee = feesManager.calculateDepositBridgeFee(massetQuantity);
        } else {
            fee = feesManager.calculateDepositFee(massetQuantity);
            reward = calculateReward(_bAsset, massetQuantity, true);
        }

        uint256 massetsAfterReward = reward > 0
            ? massetQuantity
            : massetQuantity.sub(uint256(-reward));
        
        require(massetsAfterReward > 0, "mint amount after reward must be > 0");

        massetsToMint = massetsAfterReward.sub(fee);
        require(massetsToMint > 0, "mint amount after reward and fee must be > 0");

        return (fee, reward, massetsToMint, bassetQuantity);
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
    returns (uint256 massetMinted) {
        require(basketManager.isValidBasset(_basset), "invalid basset");
        require(_recipient != address(0), "must be a valid recipient");
        require(IERC20(_basset).balanceOf(msg.sender) >= _bassetQuantity, "insufficient balance");

        (uint256 fee, int256 reward, uint256 massetsToMint, uint256 bassetsToTake) = calculateMint(_basset, _bassetQuantity, false);

        token.mint(address(feesVault), fee);

        uint256 transferedReward = 0;

        if (reward > 0) {
            transferedReward = uint256(reward);

            rewardsVault.getApproval(transferedReward, address(token));
            require(token.transferFrom(address(rewardsVault), _recipient, transferedReward), "add reward transfer failed");
        } else {
            token.mint(address(rewardsVault), uint256(-reward));
        }

        IERC20(_basset).safeTransferFrom(msg.sender, address(this), bassetsToTake);
        token.mint(_recipient, massetsToMint);

        emit Minted(msg.sender, _recipient, massetsToMint.add(transferedReward), _basset, bassetsToTake);

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

    /**
     * @dev Calculates how many bAssets will be given to user for redeem.
     * @notice Includes fees and rewards
     * @param _bAsset          Address of the bAsset.
     * @param _massetQuantity  Quantity in mAsset units.
     * @return  bassetsTransfered: total amount of bAssets that will be given for user
     *          massetsTaken:  total amount of mAssets that will be taken from user
     */
    function calculateRedeemRatio (
        address _bAsset,
        uint256 _massetQuantity
    ) public view returns(uint256 bassetsTransfered, uint256 massetsTaken) {
        (uint256 fee, int256 reward, uint256 bassetsToTransfer, uint256 massetsToTake) = calculateRedeem(_bAsset, _massetQuantity, false);

        uint256 finalMassetsTaken = reward > 0 ? massetsToTake : massetsToTake.add(uint256(-reward));

        return (bassetsToTransfer, finalMassetsTaken.add(fee));
    }

    /**
     * @dev Calculates all needed data to perform redeem for certain bAsset.
     * @param _basset         Address of the bAsset.
     * @param _massetQuantity Quantity in mAsset units.
     * @param _bridgeFlag     Flag that indicates if the mint proces is used with conjunction with bridge.
     * @return  fee: amount of fee that will be taken
     *          reward: amount to reward/punish user for performing action in specific pool balance.
     *          bassetsToTransfer: amount of bAsset that will be given for user.
     *          massetsToTake: amount of mAssets that will be taken from user. IT DOES NOT INCLUDE FEE AND REWARDS.
     */
    function calculateRedeem (
        address _basset,
        uint256 _massetQuantity,
        bool _bridgeFlag
    ) public view returns (uint256 fee, int256 reward, uint256 bassetsToTransfer, uint256 massetsToTake) {
        require(_massetQuantity > 0, "quantity must not be 0");
        require(basketManager.isValidBasset(_basset), "invalid basset");

        if (_bridgeFlag) {
            fee = feesManager.calculateRedeemBridgeFee(_massetQuantity);
        } else {
            fee = feesManager.calculateRedeemFee(_massetQuantity);
            reward = calculateReward(_basset, _massetQuantity, false);

            if (reward > 0) {
                uint256 balance = token.balanceOf(address(rewardsVault));
                reward = uint256(reward) > balance ? int256(balance) : reward;
            }    
        }

        uint256 massetsToTake = _massetQuantity.sub(fee);
        massetsToTake = reward > 0 ? massetsToTake : massetsToTake.sub(uint256(-reward));

        uint256 massetsToConvert = reward > 0 ? massetsToTake.add(uint256(reward)) : massetsToTake;
        
        (uint256 convertedBassetsToTransfer, uint256 massetsAfterConvert) = basketManager.convertMassetToBassetQuantity(_basset, massetsToConvert); // co jesli tutaj zostanie jakis reminder?
        uint256 reminder = massetsToConvert.sub(massetsAfterConvert);

        require(convertedBassetsToTransfer > 0, "amount after reward and fee must be > 0");
        require(basketManager.checkBasketBalanceForWithdrawal(_basset, convertedBassetsToTransfer), "basket out of balance");

        return (fee, reward, convertedBassetsToTransfer, massetsToTake.sub(reminder));
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
     * @param _bridgeFlag       Flag that indicates if the reedem proces is used with conjunction with bridge.
     * @return massetMinted     Relative number of mAsset units burned to pay for the bAssets.
     */
    function _redeemTo(
        address _basset,
        uint256 _massetQuantity,
        address _recipient,
        bool _bridgeFlag
    ) internal returns (uint256 massetRedeemed) {
        require(basketManager.isValidBasset(_basset), "invalid basset");
        require(_recipient != address(0), "must be a valid recipient");
        require(token.balanceOf(msg.sender) >= _massetQuantity, "insufficient balance");

        (uint256 fee, int256 reward, uint256 bassetsToTransfer, uint256 massetsToTake) = calculateRedeem(_basset, _massetQuantity, _bridgeFlag);

        token.safeTransferFrom(msg.sender, address(feesVault), fee);

        // In case of withdrawal to bridge the receiveTokensAt is called instead of transfer.
        if(_bridgeFlag) {
            _transferToBridge(_basset, _recipient, bassetsToTransfer);
    
            token.burn(msg.sender, massetsToTake);
            emit Redeemed(msg.sender, _recipient, massetsToTake, _basset, bassetsToTransfer);

            return massetsToTake;
        }

        uint256 transferedReward = 0;
        if (reward > 0) {
            transferedReward = uint256(reward);

            rewardsVault.getApproval(transferedReward, address(token));
            token.burn(address(rewardsVault), transferedReward);
        } else {
            token.safeTransferFrom(msg.sender, address(rewardsVault), uint256(-reward));
        }

        token.burn(msg.sender, massetsToTake);
        IERC20(_basset).safeTransfer(_recipient, bassetsToTransfer);

        uint256 finalMassetsTaken = massetsToTake.add(fee);

        emit Redeemed(msg.sender, _recipient, finalMassetsTaken, _basset, bassetsToTransfer);

        return finalMassetsTaken;
    }

    function _transferToBridge (address _basset, address _recipient, uint256 _amount) internal {
        address bridgeAddress = basketManager.getBridge(_basset);
        require(bridgeAddress != address(0), "invalid bridge");

        IERC20(_basset).approve(bridgeAddress, _amount);

        require(
            IBridge(bridgeAddress).receiveTokensAt(_basset, _amount, _recipient, bytes("")),
            "call to bridge failed"
        );
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
        require(_orderAmount > 0, "amount must be > 0");

        address recipient =  _decodeAddress(_userData);
        require(recipient != address(0), "must be a valid recipient");

        address basset = _tokenAddress;

        address bridgeAddress = basketManager.getBridge(basset);
        require(msg.sender == bridgeAddress, "only bridge may call");

        require(basketManager.isValidBasset(basset), "invalid basset");

        (uint256 fee,, uint256 massetsToMint, uint256 bassetsAmount) = calculateMint(basset, _orderAmount, true);

        token.mint(address(feesVault), fee);

        token.mint(recipient, massetsToMint);

        emit onTokensMintedCalled(msg.sender, _orderAmount, _tokenAddress, _userData);
        emit Minted(msg.sender, recipient, massetsToMint, basset, bassetsAmount);
    }

    // Getters

    function getFeesVault() external view returns (address) {
        return address(feesVault);
    }

    function getRewardsVault() external view returns (address) {
        return address(rewardsVault);
    }

    function getFeesManager() external view returns (address) {
        return address(feesManager);
    }

    function getRewardsManager() external view returns (address) {
        return address(rewardsManager);
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
}
