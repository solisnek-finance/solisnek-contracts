// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "./interfaces/IWETH.sol";

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/interfaces/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

contract TokenLGE is Initializable, PausableUpgradeable, OwnableUpgradeable, ReentrancyGuardUpgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;
    using AddressUpgradeable for address;

    struct UserInfo {
        uint256 allocation; // amount taken into account to obtain LGE token (amount spent + discount)
        uint256 contribution; // amount spent to buy LGE token
        uint256 discount; // discount % for this user
        uint256 discountEligibleAmount; // max contribution amount eligible for a discount
        bool hasClaimed; // user has already claimed allocation
        uint256 cap; // user cap. values more than 0 will override CAP_PER_WALLET other wise will use CAP_PER_WALLET
    }

    IERC20Upgradeable public LGE_TOKEN; // project token contract
    IERC20Upgradeable public COLLATERAL_TOKEN; // token used to participate

    uint256 public START_TIME; // auction start time
    uint256 public END_TIME; // auction end time

    mapping(address => UserInfo) public userInfo; // buyer's info
    uint256 public totalRaised; // raised amount
    uint256 public totalAllocation; // takes into account discounts

    uint256 public MAX_LGE_TOKENS_TO_DISTRIBUTE; // max LGE amount to distribute during the auction
    uint256 public MIN_TOTAL_RAISED_FOR_MAX_LGE_TOKEN; // amount to reach to distribute max LGE token amount [should be uncapped, always distribute max at the end]

    uint256 public MAX_RAISE_AMOUNT; // usually set to 0, since there is no max raise
    uint256 public CAP_PER_WALLET; // cap of purchasing per user wallet

    address public treasury; // treasury multisig, will receive raised amount

    IWETH public weth;

    function initialize(
        IERC20Upgradeable collateralToken,
        uint256 startTime,
        uint256 endTime,
        address treasury_,
        uint256 maxToDistribute,
        uint256 minToRaise,
        uint256 maxToRaise,
        uint256 capPerWallet,
        address owner,
        address weth_
    ) external initializer {
        require(startTime < endTime, "Start time cannot be later than the end time");
        require(treasury_ != address(0), "treasury cannot be the zero address");

        COLLATERAL_TOKEN = collateralToken;
        START_TIME = startTime;
        END_TIME = endTime;
        treasury = treasury_;
        MAX_LGE_TOKENS_TO_DISTRIBUTE = maxToDistribute;
        MIN_TOTAL_RAISED_FOR_MAX_LGE_TOKEN = minToRaise;
        if (maxToRaise == 0) {
            maxToRaise = type(uint256).max;
        }
        MAX_RAISE_AMOUNT = maxToRaise;
        if (capPerWallet == 0) {
            capPerWallet = type(uint256).max;
        }
        CAP_PER_WALLET = capPerWallet;

        weth = IWETH(weth_);

        _transferOwnership(owner);
    }

    /********************************************/
    /****************** EVENTS ******************/
    /********************************************/

    event Buy(address indexed user, uint256 amount, uint256 totalRaised);
    event Claim(address indexed user, uint256 amount);
    event DiscountUpdated();
    event EmergencyWithdraw(address token, uint256 amount);

    /***********************************************/
    /****************** MODIFIERS ******************/
    /***********************************************/

    //  receive() external payable() {
    //    require(address(auctionToken) == weth, "non ETH auction");
    //  }

    /**
     * @dev Check whether the auction is currently active
     *
     * Will be marked as inactive if LGE_TOKEN has not been deposited into the contract
     */
    modifier isAuctionActive() {
        require(hasStarted() && !hasEnded(), "The auction is not active");
        _;
    }

    /**
     * @dev Check whether users can claim their purchased LGE_TOKEN
     *
     * auction must have ended
     */
    modifier isClaimable() {
        require(hasEnded(), "The auction has not ended yet");
        _;
    }

    /**************************************************/
    /****************** PUBLIC VIEWS ******************/
    /**************************************************/

    /**
     * @dev Get remaining duration before the end of the auction
     */
    function getRemainingTime() external view returns (uint256) {
        if (hasEnded()) return 0;
        return END_TIME - _currentBlockTimestamp();
    }

    /**
     * @dev Returns whether the auction has already started
     */
    function hasStarted() public view returns (bool) {
        return _currentBlockTimestamp() >= START_TIME;
    }

    /**
     * @dev Returns whether the auction has already ended
     */
    function hasEnded() public view returns (bool) {
        return END_TIME <= _currentBlockTimestamp();
    }

    /**
     * @dev Returns the amount of LGE_TOKEN to be distributed based on the current total raised
     */
    function tokensToDistribute() public view returns (uint256) {
        if (MIN_TOTAL_RAISED_FOR_MAX_LGE_TOKEN > totalRaised) {
            return (MAX_LGE_TOKENS_TO_DISTRIBUTE * totalRaised) / MIN_TOTAL_RAISED_FOR_MAX_LGE_TOKEN;
        }
        return MAX_LGE_TOKENS_TO_DISTRIBUTE;
    }

    /**
     * @dev Get user share times 1e5
     */
    function getExpectedClaimAmount(address account) public view returns (uint256) {
        if (totalAllocation == 0) return 0;

        UserInfo memory user = userInfo[account];
        return (user.allocation * tokensToDistribute()) / totalAllocation;
    }

    /****************************************************************/
    /****************** EXTERNAL PUBLIC FUNCTIONS  ******************/
    /****************************************************************/

    function buyETH() external payable isAuctionActive nonReentrant {
        require(address(COLLATERAL_TOKEN) == address(weth), "error: collateral must be ETH");
        uint256 amount = msg.value;
        weth.deposit{value: amount}();
        _buy(amount);
    }

    /**
     * @dev Purchase an allocation for the auction for a value of "amount" LGE_TOKEN
     */
    function buy(uint256 amount) external isAuctionActive nonReentrant {
        COLLATERAL_TOKEN.safeTransferFrom(msg.sender, address(this), amount);
        _buy(amount);
    }

    function _buy(uint256 amount) internal {
        require(amount > 0, "buy: zero amount");
        require(totalRaised + amount <= MAX_RAISE_AMOUNT, "buy: hardcap reached");
        require(!address(msg.sender).isContract() && !address(tx.origin).isContract(), "FORBIDDEN");

        uint256 participationAmount = amount;
        UserInfo storage user = userInfo[msg.sender];
        if (user.cap == 0) {
            require(user.contribution + amount <= CAP_PER_WALLET, "buy: wallet cap reached");
        } else {
            require(user.contribution + amount <= user.cap, "buy: wallet cap reached");
        }

        uint256 allocation = amount;
        if (user.discount > 0 && user.contribution < user.discountEligibleAmount) {
            // Get eligible amount for the active user's discount
            uint256 discountEligibleAmount = user.discountEligibleAmount - user.contribution;
            if (discountEligibleAmount > amount) {
                discountEligibleAmount = amount;
            }
            // Readjust user new allocation
            allocation = allocation + ((discountEligibleAmount * user.discount) / 100);
        }

        // update raised amounts
        user.contribution += amount;
        totalRaised += amount;

        // update allocations
        user.allocation += allocation;
        totalAllocation += allocation;

        emit Buy(msg.sender, amount, totalRaised);
        // transfer contribution to treasury
        COLLATERAL_TOKEN.safeTransfer(treasury, participationAmount);
    }

    /**
     * @dev Claim purchased LGE_TOKEN during the auction
     */
    function claim() external isClaimable {
        UserInfo storage user = userInfo[msg.sender];

        require(totalAllocation > 0 && user.allocation > 0, "claim: zero allocation");
        require(!user.hasClaimed, "claim: already claimed");
        user.hasClaimed = true;

        uint256 amount = getExpectedClaimAmount(msg.sender);

        emit Claim(msg.sender, amount);

        // send LGE token allocation
        _safeClaimTransfer(msg.sender, amount);
    }

    /****************************************************************************/
    /********************** OWNABLE & MIGRATION FUNCTIONS  **********************/
    /****************************************************************************/

    struct DiscountSettings {
        address account;
        uint256 discount;
        uint256 eligibleAmount;
    }

    /**
     * @dev Assign custom discounts
     *
     * Based on marketing events
     * Suggested to give 5% discount, with a cap of 10,000 tokens
     */
    function setUsersDiscount(DiscountSettings[] calldata users) public onlyOwner {
        for (uint256 i = 0; i < users.length; ++i) {
            DiscountSettings memory userDiscount = users[i];
            UserInfo storage user = userInfo[userDiscount.account];
            require(userDiscount.discount <= 25, "discount too high");
            user.discount = userDiscount.discount;
            user.discountEligibleAmount = userDiscount.eligibleAmount;
        }

        emit DiscountUpdated();
    }

    function setLGEToken(address lgeToken) external onlyOwner {
        LGE_TOKEN = IERC20Upgradeable(lgeToken);
    }

    function setUsersCap(address[] memory users, uint256 cap) external onlyOwner {
        for (uint256 i; i < users.length; i++) {
            userInfo[users[i]].cap = cap;
        }
    }

    function setCapPerWallet(uint256 capPerWallet) external onlyOwner {
        CAP_PER_WALLET = capPerWallet;
    }

    function extendTo(uint256 endTime) external onlyOwner {
        require(endTime > END_TIME, "!endTime");
        END_TIME = endTime;
    }

    /********************************************************/
    /****************** /!\ EMERGENCY ONLY ******************/
    /********************************************************/

    /**
     * @dev Failsafe
     */
    function emergencyWithdrawFunds(address token, uint256 amount) external onlyOwner {
        IERC20Upgradeable(token).safeTransfer(msg.sender, amount);

        emit EmergencyWithdraw(token, amount);
    }

    /********************************************************/
    /****************** INTERNAL FUNCTIONS ******************/
    /********************************************************/

    /**
     * @dev Safe token transfer function, in case rounding error causes contract to not have enough tokens
     */
    function _safeClaimTransfer(address to, uint256 amount) internal {
        uint256 balance = LGE_TOKEN.balanceOf(address(this));
        require(balance > amount, "Error: not enough balance");
        bool transferSuccess = LGE_TOKEN.transfer(to, amount);
        require(transferSuccess, "Error: Transfer failed");
    }

    /**
     * @dev Utility function to get the current block timestamp
     */
    function _currentBlockTimestamp() internal view virtual returns (uint256) {
        return block.timestamp;
    }
}
