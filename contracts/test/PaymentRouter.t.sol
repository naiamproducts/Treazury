// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test, console2} from "forge-std/Test.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {PaymentRouter, OrderVault, OrderParams} from "../PaymentRouter.sol";
import {MockERC20} from "../test-helpers/MockERC20.sol";

// ─────────────────────────────────────────────────────────────────────────────
//  Shared fixture
// ─────────────────────────────────────────────────────────────────────────────
contract PaymentRouterTestBase is Test {
    // ── Addresses ────────────────────────────────────────────────────────────
    uint256 internal ownerPk;
    address internal owner;

    address internal platformTreasury = makeAddr("platformTreasury");
    address internal merchant         = makeAddr("merchant");
    address internal devWallet        = makeAddr("devWallet");
    address internal payer            = makeAddr("payer");
    address internal stranger         = makeAddr("stranger");

    // ── Tokens / contracts ───────────────────────────────────────────────────
    MockERC20      internal usdc;
    PaymentRouter  internal router;

    // ── Constants ────────────────────────────────────────────────────────────
    uint16  internal constant PLATFORM_FEE_BPS = 200;  // 2 %
    uint16  internal constant DEV_FEE_BPS      = 100;  // 1 %
    uint256 internal constant EXPECTED_AMOUNT  = 1_000e6; // 1 000 USDC (6 dp)

    bytes32 internal constant CHARGE_ID = keccak256("charge-001");

    // ─────────────────────────────────────────────────────────────────────────
    function setUp() public virtual {
        // Derive a deterministic owner key + address.
        (owner, ownerPk) = makeAddrAndKey("owner");

        // Deploy mock USDC.
        usdc = new MockERC20("Mock USDC", "mUSDC", 6);

        // Deploy router as owner (Ownable uses msg.sender).
        vm.prank(owner);
        router = new PaymentRouter(
            address(usdc),
            platformTreasury,
            PLATFORM_FEE_BPS,
            DEV_FEE_BPS
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Helpers
    // ─────────────────────────────────────────────────────────────────────────

    /// @dev Build a default valid OrderParams struct.
    function _defaultParams() internal view returns (OrderParams memory p) {
        p = OrderParams({
            chargeId:        CHARGE_ID,
            merchant:        merchant,
            devWallet:       devWallet,
            expectedAmount:  EXPECTED_AMOUNT,
            platformFeeBps:  PLATFORM_FEE_BPS,
            devFeeBps:       DEV_FEE_BPS,
            platformTreasury: platformTreasury,
            deadline:        block.timestamp + 1 hours
        });
    }

    /// @dev Sign an OrderParams struct with the given private key and return the sig.
    function _sign(OrderParams memory p, uint256 pk) internal view returns (bytes memory sig) {
        bytes32 inner = keccak256(
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
                address(router)
            )
        );
        bytes32 digest = MessageHashUtils.toEthSignedMessageHash(inner);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(pk, digest);
        sig = abi.encodePacked(r, s, v);
    }

    /// @dev Deploy a vault via createOrder with default params, return vault address.
    function _createDefaultOrder() internal returns (address vault) {
        OrderParams memory p = _defaultParams();
        bytes memory sig = _sign(p, ownerPk);
        vault = router.createOrder(p, sig);
    }

    /// @dev Transfer USDC to vault and then call settle().
    function _payVault(address vault, uint256 amount) internal {
        usdc.mint(payer, amount);
        vm.prank(payer);
        usdc.transfer(vault, amount);
        OrderVault(payable(vault)).settle();
    }
}

// ─────────────────────────────────────────────────────────────────────────────
//  1. createOrder — happy path
// ─────────────────────────────────────────────────────────────────────────────
contract CreateOrderTest is PaymentRouterTestBase {

    function test_CreateOrder_DeploysVault() public {
        address vault = _createDefaultOrder();

        // vault address recorded in router
        assertEq(router.vaults(CHARGE_ID), vault);
        assertTrue(router.isVault(vault));

        // vault immutables match params
        OrderVault v = OrderVault(payable(vault));
        assertEq(v.merchant(),       merchant);
        assertEq(v.devWallet(),      devWallet);
        assertEq(v.expectedAmount(), EXPECTED_AMOUNT);
        assertEq(v.platformFeeBps(), PLATFORM_FEE_BPS);
        assertEq(v.devFeeBps(),      DEV_FEE_BPS);
        assertEq(v.platformTreasury(), platformTreasury);
        assertEq(address(v.usdcToken()), address(usdc));
    }

    function test_CreateOrder_EmitsOrderCreated() public {
        OrderParams memory p = _defaultParams();
        bytes memory sig = _sign(p, ownerPk);

        // Compute predicted address before deployment.
        address predicted = router.computeVaultAddress(p);

        vm.expectEmit(true, true, true, true, address(router));
        emit PaymentRouter.OrderCreated(CHARGE_ID, predicted, merchant, EXPECTED_AMOUNT);
        router.createOrder(p, sig);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
//  2. Happy-path full payment  → sweep → pendingClaims → claimFees
// ─────────────────────────────────────────────────────────────────────────────
contract FullPaymentTest is PaymentRouterTestBase {

    function test_FullPayment_SweepsAndCreditsPendingClaims() public {
        address vault = _createDefaultOrder();
        _payVault(vault, EXPECTED_AMOUNT);

        OrderVault v = OrderVault(payable(vault));
        assertTrue(v.swept());
        assertEq(v.received(), EXPECTED_AMOUNT);

        uint256 expectedPlatformFee = (EXPECTED_AMOUNT * PLATFORM_FEE_BPS) / 10_000;
        uint256 expectedDevFee      = (EXPECTED_AMOUNT * DEV_FEE_BPS)      / 10_000;
        uint256 expectedMerchant    = EXPECTED_AMOUNT - expectedPlatformFee - expectedDevFee;

        assertEq(v.pendingClaims(platformTreasury), expectedPlatformFee);
        assertEq(v.pendingClaims(devWallet),         expectedDevFee);
        assertEq(v.pendingClaims(merchant),           expectedMerchant);
    }

    function test_FullPayment_EmitsPaymentReceived() public {
        address vault = _createDefaultOrder();

        uint256 platformFee  = (EXPECTED_AMOUNT * PLATFORM_FEE_BPS) / 10_000;
        uint256 devFee       = (EXPECTED_AMOUNT * DEV_FEE_BPS)      / 10_000;
        uint256 merchantAmt  = EXPECTED_AMOUNT - platformFee - devFee;

        usdc.mint(payer, EXPECTED_AMOUNT);
        vm.prank(payer);
        usdc.transfer(vault, EXPECTED_AMOUNT);

        vm.expectEmit(true, true, false, true, vault);
        emit OrderVault.PaymentReceived(CHARGE_ID, address(0), EXPECTED_AMOUNT, platformFee, devFee, merchantAmt);
        OrderVault(payable(vault)).settle();
    }

    function test_ClaimFees_DistributesCorrectly() public {
        address vault = _createDefaultOrder();
        _payVault(vault, EXPECTED_AMOUNT);

        OrderVault v = OrderVault(payable(vault));

        uint256 platformFee  = (EXPECTED_AMOUNT * PLATFORM_FEE_BPS) / 10_000;
        uint256 devFee       = (EXPECTED_AMOUNT * DEV_FEE_BPS)      / 10_000;
        uint256 merchantAmt  = EXPECTED_AMOUNT - platformFee - devFee;

        // platform treasury claims
        vm.prank(platformTreasury);
        v.claimFees();
        assertEq(usdc.balanceOf(platformTreasury), platformFee);
        assertEq(v.pendingClaims(platformTreasury), 0);

        // dev wallet claims
        vm.prank(devWallet);
        v.claimFees();
        assertEq(usdc.balanceOf(devWallet), devFee);
        assertEq(v.pendingClaims(devWallet), 0);

        // merchant claims
        vm.prank(merchant);
        v.claimFees();
        assertEq(usdc.balanceOf(merchant), merchantAmt);
        assertEq(v.pendingClaims(merchant), 0);

        // vault is empty
        assertEq(usdc.balanceOf(vault), 0);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
//  3. Partial payment
// ─────────────────────────────────────────────────────────────────────────────
contract PartialPaymentTest is PaymentRouterTestBase {

    function test_PartialPayment_NoSweepOnFirstTransfer() public {
        address vault = _createDefaultOrder();
        uint256 half = EXPECTED_AMOUNT / 2;

        usdc.mint(payer, half);
        vm.prank(payer);
        usdc.transfer(vault, half);
        OrderVault(payable(vault)).settle();

        OrderVault v = OrderVault(payable(vault));
        assertFalse(v.swept());
        assertEq(v.received(), half);
    }

    function test_PartialPayment_EmitsPartialPaymentReceived() public {
        address vault = _createDefaultOrder();
        uint256 half = EXPECTED_AMOUNT / 2;

        usdc.mint(payer, half);
        vm.prank(payer);
        usdc.transfer(vault, half);

        vm.expectEmit(true, true, false, true, vault);
        emit OrderVault.PartialPaymentReceived(CHARGE_ID, address(0), half, half, EXPECTED_AMOUNT - half);
        OrderVault(payable(vault)).settle();
    }

    function test_PartialPayment_SweepsOnSecondTransfer() public {
        address vault = _createDefaultOrder();
        uint256 half = EXPECTED_AMOUNT / 2;

        // First partial
        usdc.mint(payer, half);
        vm.prank(payer);
        usdc.transfer(vault, half);
        OrderVault(payable(vault)).settle();

        // Second partial — completes payment
        usdc.mint(payer, half);
        vm.prank(payer);
        usdc.transfer(vault, half);
        OrderVault(payable(vault)).settle();

        OrderVault v = OrderVault(payable(vault));
        assertTrue(v.swept());
        assertEq(v.received(), EXPECTED_AMOUNT);

        uint256 platformFee = (EXPECTED_AMOUNT * PLATFORM_FEE_BPS) / 10_000;
        uint256 devFee      = (EXPECTED_AMOUNT * DEV_FEE_BPS)      / 10_000;
        uint256 merchantAmt = EXPECTED_AMOUNT - platformFee - devFee;

        assertEq(v.pendingClaims(platformTreasury), platformFee);
        assertEq(v.pendingClaims(devWallet),         devFee);
        assertEq(v.pendingClaims(merchant),           merchantAmt);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
//  4. Overpayment
// ─────────────────────────────────────────────────────────────────────────────
contract OverpaymentTest is PaymentRouterTestBase {

    function test_Overpayment_MerchantReceivesFullBalance() public {
        address vault = _createDefaultOrder();
        uint256 overpaid = EXPECTED_AMOUNT + 500e6; // 500 USDC extra

        _payVault(vault, overpaid);

        OrderVault v = OrderVault(payable(vault));
        assertTrue(v.swept());

        uint256 platformFee = (overpaid * PLATFORM_FEE_BPS) / 10_000;
        uint256 devFee      = (overpaid * DEV_FEE_BPS)      / 10_000;
        uint256 merchantAmt = overpaid - platformFee - devFee;

        // Merchant gets the full amount minus fees (no cap at expectedAmount)
        assertEq(v.pendingClaims(merchant), merchantAmt);
        assertEq(v.pendingClaims(platformTreasury), platformFee);
        assertEq(v.pendingClaims(devWallet), devFee);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
//  5-8. createOrder revert guards
// ─────────────────────────────────────────────────────────────────────────────
contract CreateOrderRevertsTest is PaymentRouterTestBase {

    function test_Revert_DuplicateChargeId() public {
        // First call succeeds.
        _createDefaultOrder();

        // Second call with same chargeId must revert.
        OrderParams memory p = _defaultParams();
        bytes memory sig = _sign(p, ownerPk);
        vm.expectRevert(bytes("Router: charge exists"));
        router.createOrder(p, sig);
    }

    function test_Revert_ZeroMerchant() public {
        OrderParams memory p = _defaultParams();
        p.merchant = address(0);
        bytes memory sig = _sign(p, ownerPk);
        vm.expectRevert(bytes("Router: zero merchant"));
        router.createOrder(p, sig);
    }

    function test_Revert_ZeroExpectedAmount() public {
        OrderParams memory p = _defaultParams();
        p.expectedAmount = 0;
        bytes memory sig = _sign(p, ownerPk);
        vm.expectRevert(bytes("Router: zero expected"));
        router.createOrder(p, sig);
    }

    function test_Revert_ZeroPlatformTreasury() public {
        OrderParams memory p = _defaultParams();
        p.platformTreasury = address(0);
        bytes memory sig = _sign(p, ownerPk);
        vm.expectRevert(bytes("Router: zero treasury"));
        router.createOrder(p, sig);
    }

    function test_Revert_FeesExceed10000Bps() public {
        OrderParams memory p = _defaultParams();
        p.platformFeeBps = 9_000;
        p.devFeeBps      = 2_000; // 11 000 > 10 000
        bytes memory sig = _sign(p, ownerPk);
        vm.expectRevert(bytes("Router: fees exceed 100%"));
        router.createOrder(p, sig);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
//  9-10. Signature validation
// ─────────────────────────────────────────────────────────────────────────────
contract SignatureTest is PaymentRouterTestBase {

    function test_Revert_ExpiredSignature() public {
        OrderParams memory p = _defaultParams();
        p.deadline = block.timestamp - 1; // already in the past
        bytes memory sig = _sign(p, ownerPk);
        vm.expectRevert(bytes("Router: signature expired"));
        router.createOrder(p, sig);
    }

    function test_Revert_InvalidSigner() public {
        (, uint256 wrongPk) = makeAddrAndKey("wrongSigner");

        OrderParams memory p = _defaultParams();
        bytes memory sig = _sign(p, wrongPk); // signed with wrong key
        vm.expectRevert(bytes("Router: invalid signature"));
        router.createOrder(p, sig);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
//  11-14. Refund
// ─────────────────────────────────────────────────────────────────────────────
contract RefundTest is PaymentRouterTestBase {

    function test_Refund_OwnerCanRefundUnsweptVault() public {
        address vault = _createDefaultOrder();
        uint256 halfAmt = EXPECTED_AMOUNT / 2;

        usdc.mint(payer, halfAmt);
        vm.prank(payer);
        usdc.transfer(vault, halfAmt);
        OrderVault(payable(vault)).settle(); // half → not swept

        address recipient = makeAddr("recipient");
        vm.prank(owner);
        router.refund(vault, recipient);

        // received resets to 0
        assertEq(OrderVault(payable(vault)).received(), 0);
        // recipient got the USDC
        assertEq(usdc.balanceOf(recipient), halfAmt);
    }

    function test_Refund_MerchantCanRefundOwnVault() public {
        address vault = _createDefaultOrder();
        uint256 quarterAmt = EXPECTED_AMOUNT / 4;

        usdc.mint(payer, quarterAmt);
        vm.prank(payer);
        usdc.transfer(vault, quarterAmt);
        OrderVault(payable(vault)).settle();

        vm.prank(merchant);
        router.refund(vault, merchant);

        assertEq(usdc.balanceOf(merchant), quarterAmt);
        assertEq(OrderVault(payable(vault)).received(), 0);
    }

    function test_Revert_Refund_UnauthorizedAddress() public {
        address vault = _createDefaultOrder();

        usdc.mint(payer, EXPECTED_AMOUNT / 2);
        vm.prank(payer);
        usdc.transfer(vault, EXPECTED_AMOUNT / 2);
        OrderVault(payable(vault)).settle();

        vm.prank(stranger);
        vm.expectRevert(bytes("Router: unauthorized"));
        router.refund(vault, stranger);
    }

    function test_Revert_Refund_AlreadySwept() public {
        address vault = _createDefaultOrder();
        _payVault(vault, EXPECTED_AMOUNT); // full sweep

        vm.prank(owner);
        vm.expectRevert(bytes("OrderVault: already swept"));
        router.refund(vault, owner);
    }

    function test_Refund_EmitsPaymentRefunded() public {
        address vault = _createDefaultOrder();
        uint256 thirdAmt = EXPECTED_AMOUNT / 3;

        usdc.mint(payer, thirdAmt);
        vm.prank(payer);
        usdc.transfer(vault, thirdAmt);
        OrderVault(payable(vault)).settle();

        address recipient = makeAddr("refundRecipient");
        vm.expectEmit(true, true, false, true, vault);
        emit OrderVault.PaymentRefunded(CHARGE_ID, recipient, thirdAmt);
        vm.prank(owner);
        router.refund(vault, recipient);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
//  15-16. recoverLateFunds
// ─────────────────────────────────────────────────────────────────────────────
contract RecoverLateFundsTest is PaymentRouterTestBase {

    function test_RecoverLateFunds_AfterSweep() public {
        address vault = _createDefaultOrder();
        _payVault(vault, EXPECTED_AMOUNT); // sweep

        // Someone sends USDC to the vault AFTER sweep (e.g. mistaken transfer).
        uint256 lateAmount = 200e6;
        usdc.mint(stranger, lateAmount);
        vm.prank(stranger);
        usdc.transfer(vault, lateAmount);

        // Before claiming, vault has late funds + unclaimed pending.
        uint256 merchantBalBefore = usdc.balanceOf(merchant);

        vm.expectEmit(true, false, false, true, vault);
        emit OrderVault.LateFundsRecovered(merchant, lateAmount);
        OrderVault(payable(vault)).recoverLateFunds();

        // Merchant received the excess.
        assertEq(usdc.balanceOf(merchant), merchantBalBefore + lateAmount);
    }

    function test_Revert_RecoverLateFunds_BeforeSweep() public {
        address vault = _createDefaultOrder();
        // Vault not yet swept.
        vm.expectRevert(bytes("OrderVault: not yet swept"));
        OrderVault(payable(vault)).recoverLateFunds();
    }

    function test_Revert_RecoverLateFunds_NoExcess() public {
        address vault = _createDefaultOrder();
        _payVault(vault, EXPECTED_AMOUNT); // sweep — no extra funds at all

        vm.expectRevert(bytes("OrderVault: no excess to recover"));
        OrderVault(payable(vault)).recoverLateFunds();
    }
}

// ─────────────────────────────────────────────────────────────────────────────
//  17. claimFees reverts when nothing to claim
// ─────────────────────────────────────────────────────────────────────────────
contract ClaimFeesRevertsTest is PaymentRouterTestBase {

    function test_Revert_ClaimFees_NothingToClaim() public {
        address vault = _createDefaultOrder();
        _payVault(vault, EXPECTED_AMOUNT);

        // stranger has no pending claims
        vm.prank(stranger);
        vm.expectRevert(bytes("OrderVault: nothing to claim"));
        OrderVault(payable(vault)).claimFees();
    }

    function test_Revert_ClaimFees_DoubleClaimReverts() public {
        address vault = _createDefaultOrder();
        _payVault(vault, EXPECTED_AMOUNT);

        // Claim once successfully.
        vm.prank(merchant);
        OrderVault(payable(vault)).claimFees();

        // Second claim must revert.
        vm.prank(merchant);
        vm.expectRevert(bytes("OrderVault: nothing to claim"));
        OrderVault(payable(vault)).claimFees();
    }
}

// ─────────────────────────────────────────────────────────────────────────────
//  18. computeVaultAddress
// ─────────────────────────────────────────────────────────────────────────────
contract ComputeVaultAddressTest is PaymentRouterTestBase {

    function test_ComputeVaultAddress_MatchesDeployedVault() public {
        OrderParams memory p = _defaultParams();
        bytes memory sig = _sign(p, ownerPk);

        address predicted = router.computeVaultAddress(p);
        address deployed  = router.createOrder(p, sig);

        assertEq(predicted, deployed);
    }

    function test_ComputeVaultAddress_DifferentChargeIdDifferentAddress() public {
        OrderParams memory p1 = _defaultParams();
        OrderParams memory p2 = _defaultParams();
        p2.chargeId = keccak256("charge-002");

        address addr1 = router.computeVaultAddress(p1);
        address addr2 = router.computeVaultAddress(p2);

        assertTrue(addr1 != addr2);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
//  19. Fee math fuzz
// ─────────────────────────────────────────────────────────────────────────────
contract FeeMathFuzzTest is PaymentRouterTestBase {

    /// @dev Fuzz: any valid fee bps pair → fee sum == totalReceived, no rounding leak.
    function testFuzz_FeeMath_DistributionSumsToTotal(
        uint16 platformBps,
        uint16 devBps,
        uint256 paymentAmount
    ) public {
        // Constrain fees to valid range.
        platformBps  = uint16(bound(uint256(platformBps), 0, 10_000));
        devBps       = uint16(bound(uint256(devBps),      0, 10_000 - uint256(platformBps)));
        paymentAmount = bound(paymentAmount, 1, 1_000_000e6);

        // Build and deploy order with fuzzed fees.
        OrderParams memory p = OrderParams({
            chargeId:         keccak256(abi.encode(platformBps, devBps, paymentAmount)),
            merchant:         merchant,
            devWallet:        devWallet,
            expectedAmount:   paymentAmount,
            platformFeeBps:   platformBps,
            devFeeBps:        devBps,
            platformTreasury: platformTreasury,
            deadline:         block.timestamp + 1 hours
        });
        bytes memory sig = _sign(p, ownerPk);
        address vault = router.createOrder(p, sig);

        // Pay full amount.
        usdc.mint(payer, paymentAmount);
        vm.prank(payer);
        usdc.transfer(vault, paymentAmount);
        OrderVault(payable(vault)).settle();

        OrderVault v = OrderVault(payable(vault));
        assertTrue(v.swept());

        uint256 pFee    = v.pendingClaims(platformTreasury);
        uint256 dFee    = v.pendingClaims(devWallet);
        uint256 mAmt    = v.pendingClaims(merchant);

        // PROPERTY: all allocations must sum to the total received.
        assertEq(pFee + dFee + mAmt, paymentAmount);

        // PROPERTY: no allocation is negative (uint256 guarantees this, but
        //           verify merchant share is sane — can't exceed total).
        assertLe(mAmt, paymentAmount);
        assertLe(pFee, paymentAmount);
        assertLe(dFee, paymentAmount);
    }

    /// @dev Fuzz: platformFeeBps + devFeeBps > 10_000 always reverts.
    function testFuzz_CreateOrder_InvalidFeesAlwaysReverts(
        uint16 platformBps,
        uint16 devBps
    ) public {
        vm.assume(uint256(platformBps) + uint256(devBps) > 10_000);

        OrderParams memory p = _defaultParams();
        p.platformFeeBps = platformBps;
        p.devFeeBps      = devBps;
        bytes memory sig = _sign(p, ownerPk);

        vm.expectRevert(bytes("Router: fees exceed 100%"));
        router.createOrder(p, sig);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
//  20. setFees / setTreasury (router config)
// ─────────────────────────────────────────────────────────────────────────────
contract RouterConfigTest is PaymentRouterTestBase {

    function test_SetFees_UpdatesConfig() public {
        vm.prank(owner);
        router.setFees(300, 150);
        assertEq(router.platformFeeBps(),   300);
        assertEq(router.defaultDevFeeBps(), 150);
    }

    function test_SetFees_EmitsFeesUpdated() public {
        vm.prank(owner);
        vm.expectEmit(false, false, false, true, address(router));
        emit PaymentRouter.FeesUpdated(300, 150);
        router.setFees(300, 150);
    }

    function test_Revert_SetFees_InvalidBps() public {
        vm.prank(owner);
        vm.expectRevert(bytes("Router: invalid fees"));
        router.setFees(6_000, 5_000); // 11 000 > 10 000
    }

    function test_Revert_SetFees_NonOwner() public {
        vm.prank(stranger);
        vm.expectRevert();
        router.setFees(100, 100);
    }

    function test_SetTreasury_UpdatesConfig() public {
        address newTreasury = makeAddr("newTreasury");
        vm.prank(owner);
        router.setTreasury(newTreasury);
        assertEq(router.platformTreasury(), newTreasury);
    }

    function test_SetTreasury_EmitsTreasuryUpdated() public {
        address newTreasury = makeAddr("newTreasury");
        vm.prank(owner);
        vm.expectEmit(true, false, false, false, address(router));
        emit PaymentRouter.TreasuryUpdated(newTreasury);
        router.setTreasury(newTreasury);
    }

    function test_Revert_SetTreasury_ZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(bytes("Router: zero treasury"));
        router.setTreasury(address(0));
    }

    function test_Revert_SetTreasury_NonOwner() public {
        vm.prank(stranger);
        vm.expectRevert();
        router.setTreasury(makeAddr("x"));
    }
}

// ─────────────────────────────────────────────────────────────────────────────
//  21. Deployment / initialization of PaymentRouter
// ─────────────────────────────────────────────────────────────────────────────
contract RouterDeployTest is PaymentRouterTestBase {

    function test_Deploy_StoredCorrectly() public view {
        assertEq(address(router.usdcToken()),      address(usdc));
        assertEq(router.platformTreasury(),         platformTreasury);
        assertEq(router.platformFeeBps(),            PLATFORM_FEE_BPS);
        assertEq(router.defaultDevFeeBps(),          DEV_FEE_BPS);
        assertEq(router.owner(),                     owner);
    }

    function test_Revert_Deploy_ZeroUSDC() public {
        vm.prank(owner);
        vm.expectRevert(bytes("Router: zero USDC"));
        new PaymentRouter(address(0), platformTreasury, 100, 50);
    }

    function test_Revert_Deploy_ZeroTreasury() public {
        vm.prank(owner);
        vm.expectRevert(bytes("Router: zero treasury"));
        new PaymentRouter(address(usdc), address(0), 100, 50);
    }

    function test_Revert_Deploy_InvalidFees() public {
        vm.prank(owner);
        vm.expectRevert(bytes("Router: invalid fees"));
        new PaymentRouter(address(usdc), platformTreasury, 6_000, 5_000);
    }

    function test_Revert_Router_NoETH() public {
        vm.deal(stranger, 1 ether);
        vm.prank(stranger);
        vm.expectRevert(bytes("Router: no ETH"));
        (bool ok,) = address(router).call{value: 1 ether}("");
        // expectRevert captures the revert; ok is only needed to silence warning.
        (ok); // suppress unused variable warning
    }
}

// ─────────────────────────────────────────────────────────────────────────────
//  22. OrderVault — settle() when no new funds (edge case)
// ─────────────────────────────────────────────────────────────────────────────
contract VaultEdgeCasesTest is PaymentRouterTestBase {

    function test_Revert_Settle_NoNewFunds() public {
        address vault = _createDefaultOrder();
        // No funds sent — settle should revert.
        vm.expectRevert(bytes("OrderVault: no new funds"));
        OrderVault(payable(vault)).settle();
    }

    function test_Revert_Settle_AfterSweep() public {
        address vault = _createDefaultOrder();
        _payVault(vault, EXPECTED_AMOUNT);

        // Any further transfer + settle after sweep reverts.
        usdc.mint(payer, 1e6);
        vm.prank(payer);
        usdc.transfer(vault, 1e6);

        vm.expectRevert(bytes("OrderVault: already swept"));
        OrderVault(payable(vault)).settle();
    }

    function test_ReceivePayment_RecordsPayer() public {
        address vault = _createDefaultOrder();
        uint256 halfAmt2 = EXPECTED_AMOUNT / 2;

        usdc.mint(payer, halfAmt2);
        vm.prank(payer);
        usdc.transfer(vault, halfAmt2);

        // Use receivePayment with explicit payer address.
        vm.expectEmit(true, true, false, true, vault);
        emit OrderVault.PartialPaymentReceived(CHARGE_ID, payer, halfAmt2, halfAmt2, EXPECTED_AMOUNT - halfAmt2);
        OrderVault(payable(vault)).receivePayment(payer);
    }

    function test_Revert_VaultNoETH() public {
        address vault = _createDefaultOrder();
        vm.deal(stranger, 1 ether);
        vm.prank(stranger);
        vm.expectRevert(bytes("OrderVault: no ETH"));
        (bool ok,) = vault.call{value: 1 ether}("");
        (ok);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
//  23. deposit / depositWithPermit — atomic settle-through-vault
// ─────────────────────────────────────────────────────────────────────────────
contract DepositTest is PaymentRouterTestBase {

    function test_Deposit_FullAmount_SweepsAndAttributesPayer() public {
        address vault = _createDefaultOrder();
        usdc.mint(payer, EXPECTED_AMOUNT);

        uint256 platformFee = (EXPECTED_AMOUNT * PLATFORM_FEE_BPS) / 10_000;
        uint256 devFee      = (EXPECTED_AMOUNT * DEV_FEE_BPS) / 10_000;
        uint256 merchantAmt = EXPECTED_AMOUNT - platformFee - devFee;

        vm.startPrank(payer);
        usdc.approve(vault, EXPECTED_AMOUNT);
        // Funds + event in the SAME tx: payer is msg.sender, not address(0).
        vm.expectEmit(true, true, false, true, vault);
        emit OrderVault.PaymentReceived(CHARGE_ID, payer, EXPECTED_AMOUNT, platformFee, devFee, merchantAmt);
        OrderVault(payable(vault)).deposit(EXPECTED_AMOUNT);
        vm.stopPrank();

        OrderVault v = OrderVault(payable(vault));
        assertTrue(v.swept());
        assertEq(v.received(), EXPECTED_AMOUNT);
        // Sweep only credits pendingClaims — the USDC stays in the vault.
        assertEq(usdc.balanceOf(vault), EXPECTED_AMOUNT);
        assertEq(usdc.balanceOf(payer), 0);
    }

    function test_Deposit_Partial_NoSweep() public {
        address vault = _createDefaultOrder();
        uint256 half = EXPECTED_AMOUNT / 2;
        usdc.mint(payer, half);

        vm.startPrank(payer);
        usdc.approve(vault, half);
        OrderVault(payable(vault)).deposit(half);
        vm.stopPrank();

        OrderVault v = OrderVault(payable(vault));
        assertFalse(v.swept());
        assertEq(v.received(), half);
    }

    function test_Deposit_CompletesOverPreexistingPlainTransfer() public {
        address vault = _createDefaultOrder();
        uint256 half = EXPECTED_AMOUNT / 2;

        // Exchange-style plain transfer first (unaccounted until settled).
        usdc.mint(stranger, half);
        vm.prank(stranger);
        usdc.transfer(vault, half);

        // In-app deposit of the remaining half sweeps and accounts for both.
        usdc.mint(payer, half);
        vm.startPrank(payer);
        usdc.approve(vault, half);
        OrderVault(payable(vault)).deposit(half);
        vm.stopPrank();

        OrderVault v = OrderVault(payable(vault));
        assertTrue(v.swept());
        assertEq(v.received(), EXPECTED_AMOUNT);
    }

    function test_Revert_Deposit_ZeroAmount() public {
        address vault = _createDefaultOrder();
        vm.prank(payer);
        vm.expectRevert(bytes("OrderVault: zero deposit"));
        OrderVault(payable(vault)).deposit(0);
    }

    function test_Revert_Deposit_AfterSweep() public {
        address vault = _createDefaultOrder();
        _payVault(vault, EXPECTED_AMOUNT); // full sweep

        usdc.mint(payer, 1e6);
        vm.startPrank(payer);
        usdc.approve(vault, 1e6);
        vm.expectRevert(bytes("OrderVault: already swept"));
        OrderVault(payable(vault)).deposit(1e6);
        vm.stopPrank();
    }

    function test_Revert_Deposit_NoAllowance() public {
        address vault = _createDefaultOrder();
        usdc.mint(payer, EXPECTED_AMOUNT);
        // No approve — SafeERC20 transferFrom must revert (atomic: no funds move).
        vm.prank(payer);
        vm.expectRevert();
        OrderVault(payable(vault)).deposit(EXPECTED_AMOUNT);
        assertEq(usdc.balanceOf(payer), EXPECTED_AMOUNT);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
//  24. depositWithPermit — one-tx payment with off-chain approval
// ─────────────────────────────────────────────────────────────────────────────
contract DepositWithPermitTest is PaymentRouterTestBase {
    uint256 internal permitPk;
    address internal permitPayer;

    function setUp() public override {
        super.setUp();
        (permitPayer, permitPk) = makeAddrAndKey("permitPayer");
    }

    /// @dev Build an EIP-2612 signature over the mock token's domain.
    function _signPermit(
        address owner_,
        address spender,
        uint256 value,
        uint256 nonce,
        uint256 deadline
    ) internal view returns (uint8 v, bytes32 r, bytes32 s) {
        bytes32 structHash = keccak256(
            abi.encode(
                keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"),
                owner_,
                spender,
                value,
                nonce,
                deadline
            )
        );
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", usdc.DOMAIN_SEPARATOR(), structHash));
        (v, r, s) = vm.sign(permitPk, digest);
    }

    function test_DepositWithPermit_FullAmount_SweepsInOneTx() public {
        address vault = _createDefaultOrder();
        usdc.mint(permitPayer, EXPECTED_AMOUNT);
        uint256 deadline = block.timestamp + 1 hours;

        (uint8 sigV, bytes32 sigR, bytes32 sigS) = _signPermit(
            permitPayer,
            vault,
            EXPECTED_AMOUNT,
            usdc.nonces(permitPayer),
            deadline
        );

        // No prior approve: the permit alone must be enough.
        vm.prank(permitPayer);
        OrderVault(payable(vault)).depositWithPermit(EXPECTED_AMOUNT, deadline, sigV, sigR, sigS);

        OrderVault v = OrderVault(payable(vault));
        assertTrue(v.swept());
        assertEq(v.received(), EXPECTED_AMOUNT);
        assertEq(usdc.balanceOf(permitPayer), 0);
        assertEq(usdc.nonces(permitPayer), 1);
    }

    function test_Revert_DepositWithPermit_BadSignature() public {
        address vault = _createDefaultOrder();
        usdc.mint(permitPayer, EXPECTED_AMOUNT);
        uint256 deadline = block.timestamp + 1 hours;

        // Sign with the wrong key.
        (, uint256 wrongPk) = makeAddrAndKey("wrongSigner");
        bytes32 structHash = keccak256(
            abi.encode(
                keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"),
                permitPayer,
                vault,
                EXPECTED_AMOUNT,
                usdc.nonces(permitPayer),
                deadline
            )
        );
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", usdc.DOMAIN_SEPARATOR(), structHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(wrongPk, digest);

        vm.prank(permitPayer);
        vm.expectRevert();
        OrderVault(payable(vault)).depositWithPermit(EXPECTED_AMOUNT, deadline, v, r, s);
        // Atomic: no funds moved on a failed permit.
        assertEq(usdc.balanceOf(permitPayer), EXPECTED_AMOUNT);
    }

    function test_Revert_DepositWithPermit_ExpiredDeadline() public {
        address vault = _createDefaultOrder();
        usdc.mint(permitPayer, EXPECTED_AMOUNT);
        uint256 deadline = block.timestamp - 1;

        (uint8 v, bytes32 r, bytes32 s) = _signPermit(
            permitPayer,
            vault,
            EXPECTED_AMOUNT,
            usdc.nonces(permitPayer),
            deadline
        );

        vm.prank(permitPayer);
        vm.expectRevert();
        OrderVault(payable(vault)).depositWithPermit(EXPECTED_AMOUNT, deadline, v, r, s);
    }
}
