// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";

/// @dev Packed order parameters passed to createOrder to avoid stack-too-deep.
struct OrderParams {
    bytes32 chargeId;
    address merchant;
    address devWallet;
    uint256 expectedAmount;
    uint16  platformFeeBps;
    uint16  devFeeBps;
    address platformTreasury;
    uint256 deadline;
}

/// @title PaymentRouter
/// @notice Factory and configuration contract that deploys deterministic OrderVault contracts.
contract PaymentRouter is Ownable2Step {
    address public immutable usdcToken;
    address public platformTreasury;
    uint16 public platformFeeBps;
    uint16 public defaultDevFeeBps;

    mapping(bytes32 => address) public vaults;
    mapping(address => bool) public isVault;

    event OrderCreated(
        bytes32 indexed chargeId,
        address indexed vault,
        address indexed merchant,
        uint256 expectedAmount
    );
    event FeesUpdated(uint16 platformFeeBps, uint16 defaultDevFeeBps);
    event TreasuryUpdated(address indexed newTreasury);

    /// @notice Initializes router configuration.
    /// @param usdcToken_ USDC token address.
    /// @param platformTreasury_ Address receiving platform fees.
    /// @param platformFeeBps_ Platform fee in basis points.
    /// @param defaultDevFeeBps_ Default developer fee in basis points.
    constructor(
        address usdcToken_,
        address platformTreasury_,
        uint16 platformFeeBps_,
        uint16 defaultDevFeeBps_
    ) Ownable(msg.sender) {
        require(usdcToken_ != address(0), "Router: zero USDC");
        require(platformTreasury_ != address(0), "Router: zero treasury");
        require(
            uint256(platformFeeBps_) + uint256(defaultDevFeeBps_) <= 10_000,
            "Router: invalid fees"
        );

        usdcToken = usdcToken_;
        platformTreasury = platformTreasury_;
        platformFeeBps = platformFeeBps_;
        defaultDevFeeBps = defaultDevFeeBps_;
    }

    /// @notice Deploys a deterministic OrderVault for a charge.
    /// @param p Order parameters struct (chargeId, merchant, devWallet, expectedAmount,
    ///          platformFeeBps, devFeeBps, platformTreasury, deadline).
    /// @param signature Owner signature over keccak256(abi.encode(p fields..., chainid, this)).
    /// @return vault Deployed vault address.
    function createOrder(
        OrderParams calldata p,
        bytes calldata signature
    ) external returns (address vault) {
        require(block.timestamp <= p.deadline, "Router: signature expired");

        bytes32 digest = MessageHashUtils.toEthSignedMessageHash(
            keccak256(
                abi.encode(
                    p.chargeId,
                    p.merchant,
                    p.devWallet,
                    p.expectedAmount,
                    p.platformFeeBps,
                    p.devFeeBps,
                    p.platformTreasury,
                    p.deadline,
                    block.chainid,
                    address(this)
                )
            )
        );
        address signer = ECDSA.recover(digest, signature);
        require(signer == owner(), "Router: invalid signature");

        require(vaults[p.chargeId] == address(0), "Router: charge exists");
        require(p.merchant != address(0), "Router: zero merchant");
        require(p.expectedAmount != 0, "Router: zero expected");
        require(p.platformTreasury != address(0), "Router: zero treasury");
        require(
            uint256(p.platformFeeBps) + uint256(p.devFeeBps) <= 10_000,
            "Router: fees exceed 100%"
        );

        bytes32 salt = keccak256(abi.encode(p.chargeId));

        vault = address(
            new OrderVault{salt: salt}(
                address(this),
                usdcToken,
                p.chargeId,
                p.merchant,
                p.devWallet,
                p.expectedAmount,
                p.platformFeeBps,
                p.devFeeBps,
                p.platformTreasury
            )
        );

        vaults[p.chargeId] = vault;
        isVault[vault] = true;

        emit OrderCreated(p.chargeId, vault, p.merchant, p.expectedAmount);
    }

    /// @notice Predicts the vault address for a given set of order parameters.
    /// @dev Deterministic: address depends only on `p`, not on mutable router state.
    ///      Pass the same OrderParams struct used in createOrder.
    /// @param p Order parameters struct.
    /// @return predicted Deterministic vault address.
    function computeVaultAddress(
        OrderParams calldata p
    ) external view returns (address predicted) {
        bytes32 salt = keccak256(abi.encode(p.chargeId));

        bytes memory initcode = abi.encodePacked(
            type(OrderVault).creationCode,
            abi.encode(
                address(this),
                usdcToken,
                p.chargeId,
                p.merchant,
                p.devWallet,
                p.expectedAmount,
                p.platformFeeBps,
                p.devFeeBps,
                p.platformTreasury
            )
        );

        bytes32 hash = keccak256(
            abi.encodePacked(bytes1(0xff), address(this), salt, keccak256(initcode))
        );
        predicted = address(uint160(uint256(hash)));
    }

    /// @notice Updates platform and default developer fee basis points for future orders.
    /// @param platformBps New platform fee in basis points.
    /// @param devBps New default developer fee in basis points.
    function setFees(uint16 platformBps, uint16 devBps) external onlyOwner {
        require(uint256(platformBps) + uint256(devBps) <= 10_000, "Router: invalid fees");

        platformFeeBps = platformBps;
        defaultDevFeeBps = devBps;

        emit FeesUpdated(platformBps, devBps);
    }

    /// @notice Updates treasury address for platform fees on future orders.
    /// @param newTreasury New treasury address.
    function setTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "Router: zero treasury");
        platformTreasury = newTreasury;
        emit TreasuryUpdated(newTreasury);
    }

    /// @notice Refunds a vault's current USDC balance if not yet swept.
    /// @dev Callable by platform owner or that vault's merchant.
    /// @param vault_ Vault to refund.
    /// @param recipient Address receiving the refund.
    function refund(address vault_, address recipient) external {
        require(isVault[vault_], "Router: unknown vault");

        if (msg.sender != owner()) {
            require(msg.sender == OrderVault(payable(vault_)).merchant(), "Router: unauthorized");
        }

        OrderVault(payable(vault_)).refund(recipient);
    }

    /// @notice Rejects all native token transfers.
    receive() external payable {
        revert("Router: no ETH");
    }
}

/// @title OrderVault
/// @notice Per-order deterministic vault that accumulates USDC and sweeps once expected amount is met.
contract OrderVault is ReentrancyGuard {
    using SafeERC20 for IERC20;

    address public immutable router;
    address public immutable usdcToken;
    bytes32 public immutable chargeId;
    address public immutable merchant;
    address public immutable devWallet;
    uint256 public immutable expectedAmount;
    uint16 public immutable platformFeeBps;
    uint16 public immutable devFeeBps;
    address public immutable platformTreasury;

    uint256 public received;
    bool public swept;
    mapping(address => uint256) public pendingClaims;

    event PaymentReceived(
        bytes32 indexed chargeId,
        address indexed payer,
        uint256 totalReceived,
        uint256 platformFee,
        uint256 devFee,
        uint256 merchantAmount
    );
    event PartialPaymentReceived(
        bytes32 indexed chargeId,
        address indexed payer,
        uint256 amountReceived,
        uint256 totalReceived,
        uint256 stillPending
    );
    event PaymentRefunded(bytes32 indexed chargeId, address indexed recipient, uint256 amount);
    event FeesClaimed(address indexed recipient, uint256 amount);
    event LateFundsRecovered(address indexed recipient, uint256 amount);

    /// @notice Initializes immutable order vault parameters.
    constructor(
        address router_,
        address usdcToken_,
        bytes32 chargeId_,
        address merchant_,
        address devWallet_,
        uint256 expectedAmount_,
        uint16 platformFeeBps_,
        uint16 devFeeBps_,
        address platformTreasury_
    ) {
        require(router_ != address(0), "OrderVault: zero router");
        require(usdcToken_ != address(0), "OrderVault: zero USDC");
        require(merchant_ != address(0), "OrderVault: zero merchant");
        require(expectedAmount_ != 0, "OrderVault: zero expected");
        require(platformTreasury_ != address(0), "OrderVault: zero treasury");
        require(
            uint256(platformFeeBps_) + uint256(devFeeBps_) <= 10_000,
            "OrderVault: fees exceed 100%"
        );

        router = router_;
        usdcToken = usdcToken_;
        chargeId = chargeId_;
        merchant = merchant_;
        devWallet = devWallet_;
        expectedAmount = expectedAmount_;
        platformFeeBps = platformFeeBps_;
        devFeeBps = devFeeBps_;
        platformTreasury = platformTreasury_;
    }

    /// @notice Settles direct USDC transfers when payer identity is unknown.
    function settle() external nonReentrant {
        _process(address(0));
    }

    /// @notice Settles USDC transfers while recording a payer address.
    /// @param payer Address attributed as payer in emitted events.
    function receivePayment(address payer) external nonReentrant {
        _process(payer);
    }

    /// @notice Pulls USDC from the caller and accounts for it in one transaction.
    /// @dev Atomic path for in-app wallets: funds arrive AND the matching
    ///      PaymentReceived / PartialPaymentReceived event is emitted in the
    ///      same tx, so reconciliation never depends on a follow-up settle().
    ///      Plain ERC-20 transfers cannot notify this contract (no hook), so
    ///      exchanges and external wallets keep using transfer + settle().
    /// @param amount USDC (6 decimals) to pull from the caller.
    function deposit(uint256 amount) external nonReentrant {
        require(!swept, "OrderVault: already swept");
        require(amount > 0, "OrderVault: zero deposit");

        IERC20 token = IERC20(usdcToken);
        token.safeTransferFrom(msg.sender, address(this), amount);
        _process(msg.sender);
    }

    /// @notice EIP-2612 permit + deposit in a single transaction.
    /// @dev The buyer signs the approval off-chain (free, no gas); this call
    ///      submits the permit together with the pull and the accounting, so
    ///      the whole payment is one wallet confirmation. Any permit failure
    ///      reverts the entire tx — no funds move.
    /// @param amount   USDC (6 decimals) to pull from the caller.
    /// @param deadline Permit deadline (unix seconds).
    /// @param v        Signature v component.
    /// @param r        Signature r component.
    /// @param s        Signature s component.
    function depositWithPermit(
        uint256 amount,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external nonReentrant {
        require(!swept, "OrderVault: already swept");
        require(amount > 0, "OrderVault: zero deposit");

        IERC20Permit(usdcToken).permit(msg.sender, address(this), amount, deadline, v, r, s);

        IERC20 token = IERC20(usdcToken);
        token.safeTransferFrom(msg.sender, address(this), amount);
        _process(msg.sender);
    }

    /// @notice Refunds current vault balance before sweep.
    /// @dev Only callable by router, which performs owner-or-merchant authorization.
    /// @param recipient Address receiving refunded USDC.
    function refund(address recipient) external {
        require(msg.sender == router, "OrderVault: only router");
        require(!swept, "OrderVault: already swept");
        require(recipient != address(0), "OrderVault: zero recipient");

        IERC20 token = IERC20(usdcToken);
        uint256 balance = token.balanceOf(address(this));
        require(balance > 0, "OrderVault: no funds");

        received = 0;
        token.safeTransfer(recipient, balance);

        emit PaymentRefunded(chargeId, recipient, balance);
    }

    /// @notice Claims pending USDC allocated to the caller by a sweep.
    function claimFees() external nonReentrant {
        uint256 amount = pendingClaims[msg.sender];
        require(amount > 0, "OrderVault: nothing to claim");
        pendingClaims[msg.sender] = 0;
        SafeERC20.safeTransfer(IERC20(usdcToken), msg.sender, amount);
        emit FeesClaimed(msg.sender, amount);
    }

    /// @notice Recovers any USDC that arrives at this vault after the initial sweep.
    /// @dev Only callable after swept == true. Sends the full current balance minus
    ///      any unclaimed pendingClaims to the merchant. Anyone may call this.
    function recoverLateFunds() external nonReentrant {
        require(swept, "OrderVault: not yet swept");
        uint256 balance = IERC20(usdcToken).balanceOf(address(this));

        uint256 claimed = pendingClaims[platformTreasury]
            + (devWallet != address(0) ? pendingClaims[devWallet] : 0)
            + pendingClaims[merchant];

        uint256 excess = balance > claimed ? balance - claimed : 0;
        require(excess > 0, "OrderVault: no excess to recover");

        SafeERC20.safeTransfer(IERC20(usdcToken), merchant, excess);
        emit LateFundsRecovered(merchant, excess);
    }

    /// @notice Rejects all native token transfers.
    receive() external payable {
        revert("OrderVault: no ETH");
    }

    function _process(address payer) internal {
        require(!swept, "OrderVault: already swept");

        IERC20 token = IERC20(usdcToken);
        uint256 total = token.balanceOf(address(this));
        require(total > received, "OrderVault: no new funds");

        uint256 amountReceived = total - received;
        received = total;

        if (total >= expectedAmount) {
            _sweep(payer);
            return;
        }

        emit PartialPaymentReceived(chargeId, payer, amountReceived, total, expectedAmount - total);
    }

    function _sweep(address payer) internal {
        IERC20 token = IERC20(usdcToken);
        uint256 total = token.balanceOf(address(this));

        uint256 platformFee = (total * platformFeeBps) / 10_000;
        uint256 devFee = devWallet != address(0) ? (total * devFeeBps) / 10_000 : 0;
        uint256 merchantAmount = total - platformFee - devFee;

        swept = true;

        pendingClaims[platformTreasury] += platformFee;
        if (devWallet != address(0) && devFee > 0) {
            pendingClaims[devWallet] += devFee;
        }
        pendingClaims[merchant] += merchantAmount;

        emit PaymentReceived(chargeId, payer, total, platformFee, devFee, merchantAmount);
    }
}
