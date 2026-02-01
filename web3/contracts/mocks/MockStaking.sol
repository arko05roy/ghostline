// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title MockStaking
 * @notice Mock staking contract for testing
 * @dev Accepts native token (ETH/CTC) stakes
 */
contract MockStaking {
    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);

    /// @notice User stakes
    mapping(address => uint256) public stakes;

    /// @notice User stake timestamps
    mapping(address => uint256) public stakeTimestamps;

    /// @notice Total staked
    uint256 public totalStaked;

    /// @notice APY in basis points (1000 = 10%)
    uint256 public apyBps = 1000;

    /**
     * @notice Stake native token
     */
    function stake() external payable {
        require(msg.value > 0, "MockStaking: zero amount");

        stakes[msg.sender] += msg.value;
        stakeTimestamps[msg.sender] = block.timestamp;
        totalStaked += msg.value;

        emit Staked(msg.sender, msg.value);
    }

    /**
     * @notice Unstake native token
     * @param amount Amount to unstake
     */
    function unstake(uint256 amount) external {
        require(stakes[msg.sender] >= amount, "MockStaking: insufficient stake");

        stakes[msg.sender] -= amount;
        totalStaked -= amount;

        payable(msg.sender).transfer(amount);

        emit Unstaked(msg.sender, amount);
    }

    /**
     * @notice Calculate pending rewards
     * @param user User address
     * @return Pending rewards
     */
    function pendingRewards(address user) external view returns (uint256) {
        if (stakes[user] == 0 || stakeTimestamps[user] == 0) {
            return 0;
        }

        uint256 duration = block.timestamp - stakeTimestamps[user];
        uint256 annualReward = (stakes[user] * apyBps) / 10000;
        return (annualReward * duration) / 365 days;
    }

    /**
     * @notice Set APY for testing
     * @param _apyBps APY in basis points
     */
    function setApy(uint256 _apyBps) external {
        apyBps = _apyBps;
    }

    /**
     * @notice Get user stake
     * @param user User address
     * @return Stake amount
     */
    function getStake(address user) external view returns (uint256) {
        return stakes[user];
    }

    receive() external payable {}
}
