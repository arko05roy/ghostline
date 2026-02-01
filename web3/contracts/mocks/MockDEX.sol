// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title MockDEX
 * @notice Mock DEX for testing swap functionality
 * @dev Simple 1:1 swap ratio for testing
 */
contract MockDEX {
    using SafeERC20 for IERC20;

    event Swap(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );

    /// @notice Exchange rate multiplier (in basis points, 10000 = 1:1)
    uint256 public exchangeRateBps = 10000;

    /**
     * @notice Swap tokens
     * @param tokenIn Input token
     * @param tokenOut Output token
     * @param amountIn Amount of input token
     * @return amountOut Amount of output token
     */
    function swap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external returns (uint256 amountOut) {
        require(tokenIn != tokenOut, "MockDEX: same tokens");
        require(amountIn > 0, "MockDEX: zero amount");

        // Calculate output with exchange rate
        amountOut = (amountIn * exchangeRateBps) / 10000;

        // Transfer tokens
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);
        IERC20(tokenOut).safeTransfer(msg.sender, amountOut);

        emit Swap(msg.sender, tokenIn, tokenOut, amountIn, amountOut);
    }

    /**
     * @notice Set exchange rate for testing
     * @param rateBps Rate in basis points (10000 = 1:1)
     */
    function setExchangeRate(uint256 rateBps) external {
        exchangeRateBps = rateBps;
    }

    /**
     * @notice Add liquidity to DEX (for testing)
     * @param token Token to add
     * @param amount Amount to add
     */
    function addLiquidity(address token, uint256 amount) external {
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
    }
}
