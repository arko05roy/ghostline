// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// Re-export OpenZeppelin's ERC1967Proxy for testing
// This file exists to make the ERC1967Proxy artifact available in tests
import {ERC1967Proxy as OZProxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

/**
 * @title ERC1967Proxy
 * @notice Wrapper for OpenZeppelin's ERC1967Proxy to generate artifact
 */
contract ERC1967Proxy is OZProxy {
    constructor(
        address implementation,
        bytes memory data
    ) OZProxy(implementation, data) {}
}
