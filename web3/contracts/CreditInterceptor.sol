// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ICreditInterceptor} from "./interfaces/ICreditInterceptor.sol";
import {ICreditRegistry} from "./interfaces/ICreditRegistry.sol";

/**
 * @title CreditInterceptor
 * @notice Middleware layer that wraps DeFi actions and auto-generates credit events
 * @dev All DeFi interactions go through this contract to build credit history
 * 
 * Example flow:
 * 1. User calls interceptSwap(tokenIn, tokenOut, amount)
 * 2. Interceptor executes swap via whitelisted DEX
 * 3. Interceptor calls registry.registerCreditEvent(user, SWAP, amount)
 * 4. User receives swap output + credit score increases
 */
contract CreditInterceptor is 
    Initializable, 
    OwnableUpgradeable, 
    ReentrancyGuardUpgradeable,
    ICreditInterceptor 
{
    using SafeERC20 for IERC20;

    // ============ State Variables ============

    /// @notice Credit registry for recording events
    ICreditRegistry public registry;

    /// @notice Whitelisted DeFi protocols
    mapping(address => bool) public whitelistedProtocols;

    /// @notice DEX router for swaps (can be set by owner)
    address public dexRouter;

    /// @notice Staking contract (can be set by owner)
    address public stakingContract;

    /// @notice Lending pool (can be set by owner)
    address public lendingPool;

    /// @notice Credit vault for loan repayments
    address public creditVault;

    // ============ Constructor ============

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    // ============ Initialization ============

    /**
     * @notice Initialize the contract (for proxy pattern)
     * @param _owner The owner address
     * @param _registry The credit registry address
     */
    function initialize(
        address _owner,
        address _registry
    ) external initializer {
        __Ownable_init(_owner);
        __ReentrancyGuard_init();

        require(_registry != address(0), "CreditInterceptor: zero registry");
        registry = ICreditRegistry(_registry);
    }

    // ============ Core Intercept Functions ============

    /**
     * @notice Intercept a token swap and generate credit event
     * @param tokenIn The input token address
     * @param tokenOut The output token address
     * @param amountIn The input amount
     * @param minAmountOut Minimum output amount (slippage protection)
     * @return amountOut The actual output amount
     */
    function interceptSwap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut
    ) external payable override nonReentrant returns (uint256 amountOut) {
        require(amountIn > 0, "CreditInterceptor: zero amount");
        require(tokenIn != tokenOut, "CreditInterceptor: same tokens");

        // Transfer tokens from user
        if (tokenIn != address(0)) {
            IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);
        } else {
            require(msg.value == amountIn, "CreditInterceptor: incorrect ETH");
        }

        // Execute swap (simplified - in production would call DEX router)
        // For hackathon demo, we simulate the swap
        amountOut = _executeSwap(tokenIn, tokenOut, amountIn);
        require(amountOut >= minAmountOut, "CreditInterceptor: slippage");

        // Transfer output to user
        if (tokenOut != address(0)) {
            IERC20(tokenOut).safeTransfer(msg.sender, amountOut);
        } else {
            payable(msg.sender).transfer(amountOut);
        }

        // Register credit event
        registry.registerCreditEvent(msg.sender, ICreditRegistry.ActionType.SWAP, amountIn);

        emit SwapIntercepted(msg.sender, tokenIn, tokenOut, amountIn, amountOut);
    }

    /**
     * @notice Intercept a lending deposit and generate credit event
     * @param token The token being lent (use address(0) for native CTC)
     * @param amount The amount to lend
     */
    function interceptLend(address token, uint256 amount) external payable override nonReentrant {
        require(amount > 0, "CreditInterceptor: zero amount");

        // Transfer tokens from user
        if (token != address(0)) {
            IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        } else {
            require(msg.value == amount, "CreditInterceptor: incorrect CTC");
        }

        // Execute lending (simplified - in production would call lending pool)
        _executeLend(token, amount);

        // Register credit event
        registry.registerCreditEvent(msg.sender, ICreditRegistry.ActionType.LEND, amount);

        emit LendIntercepted(msg.sender, token, amount);
    }

    /**
     * @notice Intercept a staking action and generate credit event
     * @param amount The amount to stake (in native token)
     */
    function interceptStake(uint256 amount) external payable override nonReentrant {
        require(amount > 0, "CreditInterceptor: zero amount");
        require(msg.value == amount, "CreditInterceptor: incorrect ETH");

        // Execute staking (simplified - in production would call staking contract)
        _executeStake(amount);

        // Register credit event
        registry.registerCreditEvent(msg.sender, ICreditRegistry.ActionType.STAKE, amount);

        emit StakeIntercepted(msg.sender, amount);
    }

    /**
     * @notice Intercept a token transfer and generate credit event
     * @param to The recipient address
     * @param token The token being transferred (use address(0) for native CTC)
     * @param amount The amount to transfer
     */
    function interceptTransfer(
        address to,
        address token,
        uint256 amount
    ) external payable override nonReentrant {
        require(to != address(0), "CreditInterceptor: zero recipient");
        require(amount > 0, "CreditInterceptor: zero amount");

        // Transfer tokens from sender to recipient
        if (token != address(0)) {
            IERC20(token).safeTransferFrom(msg.sender, to, amount);
        } else {
            require(msg.value == amount, "CreditInterceptor: incorrect CTC");
            payable(to).transfer(amount);
        }

        // Register credit event
        registry.registerCreditEvent(msg.sender, ICreditRegistry.ActionType.TRANSFER, amount);

        emit TransferIntercepted(msg.sender, to, token, amount);
    }

    /**
     * @notice Intercept a loan repayment and generate credit event
     * @param loanId The loan ID being repaid
     * @param amount The repayment amount
     * @dev REPAY has the HIGHEST weight - repayment is the best credit signal
     */
    function interceptRepay(uint256 loanId, uint256 amount) external payable override nonReentrant {
        require(amount > 0, "CreditInterceptor: zero amount");
        require(msg.value == amount, "CreditInterceptor: incorrect CTC");

        // Execute repayment (will be handled by CreditVault)
        _executeRepay(loanId, amount);

        // Register credit event with highest weight action
        registry.registerCreditEvent(msg.sender, ICreditRegistry.ActionType.REPAY, amount);

        emit RepayIntercepted(msg.sender, loanId, amount);
    }

    /**
     * @notice Intercept liquidity provision and generate credit event
     * @param token0 First token in the pair (use address(0) for native CTC)
     * @param token1 Second token in the pair (use address(0) for native CTC)
     * @param amount0 Amount of first token
     * @param amount1 Amount of second token
     */
    function interceptProvideLiquidity(
        address token0,
        address token1,
        uint256 amount0,
        uint256 amount1
    ) external payable override nonReentrant {
        require(amount0 > 0 || amount1 > 0, "CreditInterceptor: zero amounts");

        uint256 nativeRequired = 0;
        if (token0 == address(0)) nativeRequired += amount0;
        if (token1 == address(0)) nativeRequired += amount1;

        if (nativeRequired > 0) {
            require(msg.value == nativeRequired, "CreditInterceptor: incorrect CTC");
        }

        // Transfer tokens from user
        if (token0 != address(0) && amount0 > 0) {
            IERC20(token0).safeTransferFrom(msg.sender, address(this), amount0);
        }
        if (token1 != address(0) && amount1 > 0) {
            IERC20(token1).safeTransferFrom(msg.sender, address(this), amount1);
        }

        // Execute liquidity provision (simplified)
        _executeProvideLiquidity(token0, token1, amount0, amount1);

        // Register credit event - use combined value
        uint256 totalValue = amount0 + amount1;
        registry.registerCreditEvent(msg.sender, ICreditRegistry.ActionType.PROVIDE_LIQUIDITY, totalValue);

        emit LiquidityProvided(msg.sender, token0, token1, amount0, amount1);
    }

    // ============ Admin Functions ============

    /**
     * @notice Whitelist a DeFi protocol for interaction
     * @param protocol The protocol address to whitelist
     */
    function whitelistProtocol(address protocol) external override onlyOwner {
        require(protocol != address(0), "CreditInterceptor: zero address");
        whitelistedProtocols[protocol] = true;
        emit ProtocolWhitelisted(protocol);
    }

    /**
     * @notice Remove a protocol from whitelist
     * @param protocol The protocol address to remove
     */
    function removeProtocol(address protocol) external override onlyOwner {
        whitelistedProtocols[protocol] = false;
        emit ProtocolRemoved(protocol);
    }

    /**
     * @notice Set the credit registry address
     * @param _registry The new registry address
     */
    function setRegistry(address _registry) external override onlyOwner {
        require(_registry != address(0), "CreditInterceptor: zero address");
        address oldRegistry = address(registry);
        registry = ICreditRegistry(_registry);
        emit RegistryUpdated(oldRegistry, _registry);
    }

    /**
     * @notice Set the DEX router for swaps
     * @param _dexRouter The DEX router address
     */
    function setDexRouter(address _dexRouter) external onlyOwner {
        dexRouter = _dexRouter;
    }

    /**
     * @notice Set the staking contract
     * @param _stakingContract The staking contract address
     */
    function setStakingContract(address _stakingContract) external onlyOwner {
        stakingContract = _stakingContract;
    }

    /**
     * @notice Set the lending pool
     * @param _lendingPool The lending pool address
     */
    function setLendingPool(address _lendingPool) external onlyOwner {
        lendingPool = _lendingPool;
    }

    /**
     * @notice Set the credit vault for repayments
     * @param _creditVault The credit vault address
     */
    function setCreditVault(address _creditVault) external onlyOwner {
        creditVault = _creditVault;
    }

    // ============ View Functions ============

    /**
     * @notice Check if a protocol is whitelisted
     * @param protocol The protocol address
     * @return Whether the protocol is whitelisted
     */
    function isWhitelisted(address protocol) external view override returns (bool) {
        return whitelistedProtocols[protocol];
    }

    /**
     * @notice Get the credit registry address
     * @return The registry address
     */
    function getRegistry() external view override returns (address) {
        return address(registry);
    }

    // ============ Internal Functions (Simplified for Hackathon) ============

    /**
     * @notice Execute swap (simplified - simulates 1:1 swap for demo)
     * @dev In production, this would call the DEX router
     */
    function _executeSwap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) internal view returns (uint256) {
        // Simplified: 1:1 swap ratio for demo
        // In production: call dexRouter.swap(...)
        if (dexRouter != address(0)) {
            // Would integrate with actual DEX
        }
        return amountIn; // 1:1 for demo
    }

    /**
     * @notice Execute lending deposit (simplified)
     */
    function _executeLend(address token, uint256 amount) internal {
        // Simplified: tokens stay in this contract for demo
        // In production: call lendingPool.deposit(token, amount, ...)
        if (lendingPool != address(0)) {
            // Would integrate with actual lending pool
        }
    }

    /**
     * @notice Execute staking (simplified)
     */
    function _executeStake(uint256 amount) internal {
        // Simplified: ETH stays in this contract for demo
        // In production: call stakingContract.stake{value: amount}(...)
        if (stakingContract != address(0)) {
            // Would integrate with actual staking contract
        }
    }

    /**
     * @notice Execute loan repayment
     */
    function _executeRepay(uint256 loanId, uint256 amount) internal {
        // This will be called by CreditVault
        // The actual repayment logic is in CreditVault
        // This function is a hook point for credit event generation
    }

    /**
     * @notice Execute liquidity provision (simplified)
     */
    function _executeProvideLiquidity(
        address token0,
        address token1,
        uint256 amount0,
        uint256 amount1
    ) internal {
        // Simplified: tokens stay in this contract for demo
        // In production: call dexRouter.addLiquidity(...)
    }

    // ============ Receive ETH ============

    receive() external payable {}
}
