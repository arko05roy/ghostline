// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ICreditRegistry} from "./ICreditRegistry.sol";

/**
 * @title ICreditInterceptor
 * @notice Interface for the CreditInterceptor contract - middleware for DeFi actions
 * @dev Wraps DeFi actions and auto-generates credit events
 */
interface ICreditInterceptor {
    // ============ Events ============

    event SwapIntercepted(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );

    event LendIntercepted(
        address indexed user,
        address indexed token,
        uint256 amount
    );

    event StakeIntercepted(
        address indexed user,
        uint256 amount
    );

    event TransferIntercepted(
        address indexed user,
        address indexed to,
        address indexed token,
        uint256 amount
    );

    event RepayIntercepted(
        address indexed user,
        uint256 indexed loanId,
        uint256 amount
    );

    event LiquidityProvided(
        address indexed user,
        address indexed token0,
        address indexed token1,
        uint256 amount0,
        uint256 amount1
    );

    event ProtocolWhitelisted(address indexed protocol);
    event ProtocolRemoved(address indexed protocol);
    event RegistryUpdated(address indexed oldRegistry, address indexed newRegistry);

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
    ) external payable returns (uint256 amountOut);

    /**
     * @notice Intercept a lending deposit and generate credit event
     * @param token The token being lent
     * @param amount The amount to lend
     */
    function interceptLend(address token, uint256 amount) external;

    /**
     * @notice Intercept a staking action and generate credit event
     * @param amount The amount to stake (in native token)
     */
    function interceptStake(uint256 amount) external payable;

    /**
     * @notice Intercept a token transfer and generate credit event
     * @param to The recipient address
     * @param token The token being transferred
     * @param amount The amount to transfer
     */
    function interceptTransfer(address to, address token, uint256 amount) external;

    /**
     * @notice Intercept a loan repayment and generate credit event
     * @param loanId The loan ID being repaid
     * @param amount The repayment amount
     */
    function interceptRepay(uint256 loanId, uint256 amount) external;

    /**
     * @notice Intercept liquidity provision and generate credit event
     * @param token0 First token in the pair
     * @param token1 Second token in the pair
     * @param amount0 Amount of first token
     * @param amount1 Amount of second token
     */
    function interceptProvideLiquidity(
        address token0,
        address token1,
        uint256 amount0,
        uint256 amount1
    ) external;

    // ============ Admin Functions ============

    /**
     * @notice Whitelist a DeFi protocol for interaction
     * @param protocol The protocol address to whitelist
     */
    function whitelistProtocol(address protocol) external;

    /**
     * @notice Remove a protocol from whitelist
     * @param protocol The protocol address to remove
     */
    function removeProtocol(address protocol) external;

    /**
     * @notice Set the credit registry address
     * @param registry The new registry address
     */
    function setRegistry(address registry) external;

    /**
     * @notice Initialize the contract (for proxy pattern)
     * @param owner The owner address
     * @param registry The credit registry address
     */
    function initialize(address owner, address registry) external;

    // ============ View Functions ============

    /**
     * @notice Check if a protocol is whitelisted
     * @param protocol The protocol address
     * @return Whether the protocol is whitelisted
     */
    function isWhitelisted(address protocol) external view returns (bool);

    /**
     * @notice Get the credit registry address
     * @return The registry address
     */
    function getRegistry() external view returns (address);
}
