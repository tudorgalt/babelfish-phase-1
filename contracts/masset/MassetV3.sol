pragma solidity 0.5.16;
pragma experimental ABIEncoderV2;

import { SafeMath } from "@openzeppelin/contracts/math/SafeMath.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IERC777Recipient } from "@openzeppelin/contracts/token/ERC777/IERC777Recipient.sol";
import { IERC1820Registry } from "@openzeppelin/contracts/introspection/IERC1820Registry.sol";
import { InitializableOwnable } from "../helpers/InitializableOwnable.sol";
import { InitializableReentrancyGuard } from "../helpers/InitializableReentrancyGuard.sol";
import { IBridge } from "./IBridge.sol";
import { BasketManagerV3 } from "./BasketManagerV3.sol";
import { RewardsManager } from "./RewardsManager.sol";
import { FeesManager } from "./FeesManager.sol";
import { FeesVault } from "../vault/FeesVault.sol";
import { RewardsVault } from "../vault/RewardsVault.sol";
import "./Token.sol";

contract MassetV3 is IERC777Recipient, InitializableOwnable, InitializableReentrancyGuard {

    using SafeMath for uint256;

    // Events

    /**
     * @dev Event emitted when deposit is completed
     */
    event Minted(
        address indexed minter,
        address indexed recipient,
        uint256 massetQuantity,
        address bAsset,
        uint256 bassetQuantity
    );

    /**
     * @dev Event emitted when withdrawal is completed
     */
    event Redeemed(
        address indexed redeemer,
        address indexed recipient,
        uint256 massetQuantity,
        address bAsset,
        uint256 bassetQuantity
    );

    event onTokensReceivedCalled(
        address operator,
        address from,
        address to,
        uint amount,
        bytes userData,
        bytes operatorData
    );

    /**
     * @dev Event emitted when onTokensMinted method is called by the bridge
     */
    event onTokensMintedCalled(
        address indexed sender,
        uint256 orderAmount,
        address tokenAddress,
        bytes userData
    );

    // state

    /**
     * @dev factor of fees
     * @notice 1000 means that fees are in promils
     */
    uint256 constant private FEE_PRECISION = 1000;

    string private version;

    uint256 private depositFee;
    uint256 private depositBridgeFee;
    uint256 private withdrawalFee;
    uint256 private withdrawalBridgeFee;

    FeesVault private feesVault;
    RewardsVault private rewardsVault;
    RewardsManager private rewardsManager;
    FeesManager private feesManager;
    BasketManagerV3 private basketManager;
    Token private token;

    // internal

    function registerAsERC777Recipient() internal {
        IERC1820Registry ERC1820 = IERC1820Registry(0x1820a4B7618BdE71Dce8cdc73aAB6C95905faD24);
        ERC1820.setInterfaceImplementer(address(this), keccak256("ERC777TokensRecipient"), address(this));
    }

    function _getRewardsApproval(uint256 _amount) internal {
        rewardsVault.getApproval(_amount, address(token));
    }

    function _mintToken(uint256 _amount, address _target) internal {
        token.mint(_target, _amount);
    }

    function _burnToken(uint256 _amount, address _target) internal {
        token.burn(_target, _amount);
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

        basketManager = BasketManagerV3(_basketManagerAddress);
        token = Token(_tokenAddress);
        if(_registerAsERC777RecipientFlag) {
            registerAsERC777Recipient();
        }

        version = "1.0";
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

    /**
     * @dev this method transfers fee to vault contract and return the amount of massets that will be burned
     *      must have approval to spend the senders Masset
     * @param _massetQuantity        amount of massets to withdraw
     * @param _isDeposit             owner of massets
     * @param _isBridge              owner of massets
     * @return massetsToBurn        amount of massets that is left to burn
     */
    function calculateFee(
        uint256 _massetQuantity,
        bool _isDeposit,
        bool _isBridge
    ) public view returns (uint256 massetsToBurn) {
        uint256 fee = 0;
        if(_isBridge) {
            fee = _isDeposit ? depositBridgeFee : withdrawalBridgeFee;
        }else {
            fee = _isDeposit ? depositFee : withdrawalFee;
        }

        return feesManager.calculateFee(_massetQuantity, fee);
    }

    /**
     * @dev this method calculate rewards amount
     * @param _basset  basset address
     * @param _bassetAmount  amount of basset
     * @param _isDeposit  is a deposit flag
     * @return amount of massets addded or substracted from the transaction
     */
    function calculateReward(
        address _basset,
        uint256 _bassetAmount,
        bool _isDeposit
    ) public view returns (int256 reward) {
        int256 deviationBefore = basketManager.getBassetRatioDeviation(_basset, 0, _isDeposit);
        int256 deviationAfter = basketManager.getBassetRatioDeviation(_basset, _bassetAmount, _isDeposit);

        return rewardsManager.calculateReward(deviationBefore, deviationAfter, _isDeposit);
    }

    function calculateMint(
        address _basset,
        uint256 _bassetQuantity,
        bool _isBridge
    ) public view returns (uint256 massetQuantity) {
        require(_bassetQuantity > 0, "quantity must not be 0");

        require(basketManager.isValidBasset(_basset), "invalid basset");
        require(basketManager.checkBasketBalanceForDeposit(_basset, _bassetQuantity), "invalid basket");

        uint256 totalAmount = basketManager.convertBassetToMassetQuantity(_basset, _bassetQuantity);

        uint256 mintAmount = totalAmount;

        uint256 feeAmount = calculateFee(mintAmount, true, _isBridge);
        require(feeAmount < mintAmount, "mint amount must be higher than fees.");
        mintAmount = mintAmount.sub(feeAmount);

        uint256 bassetMintAmount = basketManager.convertMassetToBassetQuantity(_basset, mintAmount);
        int256 rewardAmount = calculateReward(_basset, bassetMintAmount, true);
        if(rewardAmount < 0) {
            uint256 takeRewardAmount = uint256(-rewardAmount);
            require(takeRewardAmount < mintAmount, "mint amount must be higher than rewards.");
            mintAmount = mintAmount.sub(takeRewardAmount);
        }else if(rewardAmount > 0) {
            uint256 addRewardAmount = uint256(rewardAmount);
            mintAmount = mintAmount.add(addRewardAmount);
        }
        return mintAmount;
    }

    function calculateRedeem(
        address _basset,
        uint256 _massetQuantity,
        bool _isBridge
    ) public view returns (uint256 bassetQuantity) {
        require(_massetQuantity > 0, "masset quantity must be greater than 0");
        require(basketManager.isValidBasset(_basset), "invalid basset");

        uint256 redeemAmount = _massetQuantity;

        uint256 feeAmount = calculateFee(redeemAmount, false, _isBridge);
        require(feeAmount < redeemAmount, "mint amount must be higher than fees.");
        redeemAmount = redeemAmount.sub(feeAmount);

        uint256 bassetRedeemAmount = basketManager.convertMassetToBassetQuantity(_basset, redeemAmount);
        int256 rewardAmount = calculateReward(_basset, bassetRedeemAmount, false);
        if(rewardAmount < 0) {
            uint256 takeRewardAmount = uint256(-rewardAmount);
            require(takeRewardAmount < redeemAmount, "mint amount must be higher than rewards.");
            redeemAmount = redeemAmount.sub(takeRewardAmount);
        }else {
            uint256 addRewardAmount = uint256(rewardAmount);
            redeemAmount = redeemAmount.add(addRewardAmount);
        }

        uint256 bassetsAmount = basketManager.convertMassetToBassetQuantity(_basset, redeemAmount);
        return bassetsAmount;
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
        require(basketManager.checkBasketBalanceForDeposit(_basset, _bassetQuantity), "invalid basket");

        uint256 totalAmount = basketManager.convertBassetToMassetQuantity(_basset, _bassetQuantity);
        uint256 mintAmount = totalAmount;

        uint256 feeAmount = calculateFee(mintAmount, true, false);
        require(feeAmount < mintAmount, "mint amount must be higher than fees.");

        mintAmount = mintAmount.sub(feeAmount);
        _mintToken(feeAmount, address(feesVault));

        uint256 bassetMintAmount = basketManager.convertMassetToBassetQuantity(_basset, mintAmount);
        int256 rewardAmount = calculateReward(_basset, bassetMintAmount, true);
        uint256 addedRewardAmount = 0;
        if(rewardAmount < 0) {
            uint256 takeRewardAmount = uint256(-rewardAmount);
            require(takeRewardAmount < mintAmount, "Insuficient balance to cover rewards.");

            mintAmount = mintAmount.sub(takeRewardAmount);
            token.mint(address(rewardsVault), takeRewardAmount);
        }else if(rewardAmount > 0) {
            uint256 addRewardAmount = uint256(rewardAmount);
            addedRewardAmount = addRewardAmount;

            _getRewardsApproval(addRewardAmount);
            require(token.transferFrom(address(rewardsVault), _recipient, addRewardAmount), "add reward transfer failed");
        }

        IERC20(_basset).transferFrom(msg.sender, address(this), _bassetQuantity);
        _mintToken(mintAmount, _recipient);

        emit Minted(msg.sender, _recipient, mintAmount.add(addedRewardAmount), _basset, _bassetQuantity);

        return totalAmount;
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
        bool _bridgeFlag
    ) internal returns (uint256 massetRedeemed) {
        require(_recipient != address(0), "must be a valid recipient");
        require(_massetQuantity > 0, "masset quantity must be greater than 0");
        require(basketManager.isValidBasset(_basset), "invalid basset");

        uint256 redeemAmount = _massetQuantity;

        uint256 bassetAmount = basketManager.convertMassetToBassetQuantity(_basset, _massetQuantity);
        require(basketManager.checkBasketBalanceForWithdrawal(_basset, bassetAmount), "Not enough basset in basket");

        uint256 feeAmount = calculateFee(_massetQuantity, false, _bridgeFlag);
        require(feeAmount < redeemAmount, "amount must be higher than fees");

        redeemAmount = redeemAmount.sub(feeAmount);
        require(token.transferFrom(msg.sender, address(feesVault), feeAmount), "fee transfer failed");

        int256 rewardAmount = calculateReward(_basset, redeemAmount, false);
        if(rewardAmount < 0) {
            uint256 takeRewardAmount = uint256(-rewardAmount);
            require(takeRewardAmount < redeemAmount, "amount must be higher than negative reward");
            
            redeemAmount = redeemAmount.sub(takeRewardAmount);
            require(token.transferFrom(msg.sender, address(rewardsVault), takeRewardAmount), "sub reward transfer failed");
        }else if(rewardAmount > 0) {
            uint256 addRewardAmount = uint256(rewardAmount);

            redeemAmount = redeemAmount.add(addRewardAmount);
            _burnToken(addRewardAmount, address(rewardsVault));
        }

        _burnToken(redeemAmount, msg.sender);

        uint256 bassetsToTransfer = basketManager.convertMassetToBassetQuantity(_basset, redeemAmount);
        if(!_bridgeFlag) {
            IERC20(_basset).transfer(_recipient, bassetsToTransfer); 
        } else {
            address bridgeAddress = basketManager.getBridge(_basset);
            require(bridgeAddress != address(0), "invalid bridge");
            IERC20(_basset).approve(bridgeAddress, bassetsToTransfer);
            require(
                IBridge(bridgeAddress).receiveTokensAt(_basset, bassetsToTransfer, _recipient, bytes("")),
                "call to bridge failed");
        }


        emit Redeemed(msg.sender, _recipient, _massetQuantity, _basset, redeemAmount);
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

        uint256 massetAmount = basketManager.convertBassetToMassetQuantity(basset, _orderAmount);

        uint256 feeAmount = calculateFee(massetAmount, true, true);
        require(feeAmount < massetAmount, " mint amount must be higher than fees.");

        massetAmount = massetAmount.sub(feeAmount);
        token.mint(address(feesVault), feeAmount);        

        token.mint(recipient, massetAmount);

        emit Minted(msg.sender, recipient, massetAmount, basset, _orderAmount);
    }

    // Getters

    function getVersion() external view returns (string memory) {
        return version;
    }

    function getToken() external view returns (address) {
        return address(token);
    }

    function getBasketManager() external view returns (address) {
        return address(basketManager);
    }

    function getDepositFee () external view returns(uint256) {
        return depositFee;
    }

    function getDepositBridgeFee () external view returns(uint256) {
        return depositBridgeFee;
    }

    function getWithdrawalFee () external view returns(uint256) {
        return withdrawalFee;
    }

    function getWithdrawalBridgeFee () external view returns(uint256) {
        return withdrawalBridgeFee;
    }

    // Governance methods

    function setDepositFee (uint256 amount) public onlyOwner {
        require(amount >= 0, "fee amount should be greater or equal zero");
        depositFee = amount;
    }

    function setDepositBridgeFee (uint256 amount) public onlyOwner {
        require(amount >= 0, "fee amount should be greater or equal zero");
        depositBridgeFee = amount;
    }

    function setWithdrawalFee (uint256 amount) public onlyOwner {
        require(amount >= 0, "fee amount should be greater or equal zero");
        withdrawalFee = amount;
    }

    function setWithdrawalBridgeFee (uint256 amount) public onlyOwner {
        require(amount >= 0, "fee amount should be greater or equal zero");
        withdrawalBridgeFee = amount;
    }

    // Temporary migration
    function upgradeToV3(
        address _basketManagerAddress,
        address _tokenAddress,
        address _feesVaultAddress,
        uint256 _depositFee,
        uint256 _depositBridgeFee,
        uint256 _withdrawalFee,
        uint256 _withdrawalBridgeFee,
        address _rewardsManagerAddress,
        address _rewardsVaultAddress,
        address _feeManagerAddress
    ) external {
        require(
            keccak256(bytes(version)) == keccak256(bytes("1.0")) ||
            keccak256(bytes(version)) == keccak256(bytes("2.0")), "wrong version (1)");
        require(keccak256(bytes(BasketManagerV3(_basketManagerAddress).getVersion())) == keccak256(bytes("3.0")), "wrong version (2)");
        require(_feesVaultAddress != address(0), "invalid fees vault address");
        require(_rewardsManagerAddress != address(0), "invalid rewards manager address");
        require(_rewardsVaultAddress != address(0), "invalid rewards vault address");

        setDepositFee(_depositFee);
        setDepositBridgeFee(_depositBridgeFee);
        setWithdrawalFee(_withdrawalFee);
        setWithdrawalBridgeFee(_withdrawalBridgeFee);

        rewardsVault = RewardsVault(_rewardsVaultAddress);
        feesVault = FeesVault(_feesVaultAddress);
        rewardsManager = RewardsManager(_rewardsManagerAddress);
        feesManager = FeesManager(_feeManagerAddress);
        basketManager = BasketManagerV3(_basketManagerAddress);
        token = Token(_tokenAddress);
        version = "3.0";
        InitializableReentrancyGuard._initialize();
    }
}
