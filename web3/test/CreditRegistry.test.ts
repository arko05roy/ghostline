import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

/**
 * CreditRegistry Tests
 * 
 * Note: Since CreditRegistry uses OpenZeppelin's upgradeable pattern with
 * _disableInitializers() in constructor, we need to use a proxy for testing.
 * For simplicity, we'll use ERC1967Proxy.
 */
describe("CreditRegistry", function () {
    let creditRegistry: any;
    let owner: any;
    let user1: any;
    let user2: any;
    let interceptor: any;

    const DEFAULT_WEIGHTS = [10, 25, 50, 20, 5, 30]; // SWAP, LEND, REPAY, STAKE, TRANSFER, PROVIDE_LIQUIDITY

    beforeEach(async function () {
        [owner, user1, user2, interceptor] = await ethers.getSigners();

        // Deploy implementation
        const CreditRegistryImpl = await ethers.getContractFactory("CreditRegistry");
        const implementation = await CreditRegistryImpl.deploy();
        await implementation.waitForDeployment();

        // Deploy proxy with initialization data
        const initData = CreditRegistryImpl.interface.encodeFunctionData("initialize", [
            owner.address,
            DEFAULT_WEIGHTS
        ]);

        const ERC1967Proxy = await ethers.getContractFactory("ERC1967Proxy");
        const proxy = await ERC1967Proxy.deploy(
            await implementation.getAddress(),
            initData
        );
        await proxy.waitForDeployment();

        // Connect to proxy with CreditRegistry ABI
        creditRegistry = CreditRegistryImpl.attach(await proxy.getAddress());

        // Set interceptor
        await creditRegistry.setInterceptor(interceptor.address);
    });

    describe("Initialization", function () {
        it("should set owner correctly", async function () {
            expect(await creditRegistry.owner()).to.equal(owner.address);
        });

        it("should set default weights correctly", async function () {
            expect(await creditRegistry.getActionWeight(0)).to.equal(10); // SWAP
            expect(await creditRegistry.getActionWeight(1)).to.equal(25); // LEND
            expect(await creditRegistry.getActionWeight(2)).to.equal(50); // REPAY
            expect(await creditRegistry.getActionWeight(3)).to.equal(20); // STAKE
            expect(await creditRegistry.getActionWeight(4)).to.equal(5);  // TRANSFER
            expect(await creditRegistry.getActionWeight(5)).to.equal(30); // PROVIDE_LIQUIDITY
        });

        it("should not allow reinitialization", async function () {
            await expect(
                creditRegistry.initialize(user1.address, DEFAULT_WEIGHTS)
            ).to.be.revert(ethers);
        });
    });

    describe("Credit Event Registration", function () {
        it("should register credit event from interceptor", async function () {
            const amount = ethers.parseEther("100");

            await creditRegistry.connect(interceptor).registerCreditEvent(
                user1.address,
                0, // SWAP
                amount
            );

            expect(await creditRegistry.getCreditEventCount(user1.address)).to.equal(1);
            expect(await creditRegistry.getTotalCreditEvents()).to.equal(1);
        });

        it("should reject credit event from non-interceptor", async function () {
            const amount = ethers.parseEther("100");

            await expect(
                creditRegistry.connect(user1).registerCreditEvent(
                    user1.address,
                    0,
                    amount
                )
            ).to.be.revertedWith("CreditRegistry: caller is not interceptor");
        });

        it("should update user's credit score", async function () {
            const amount = ethers.parseEther("100");

            await creditRegistry.connect(interceptor).registerCreditEvent(
                user1.address,
                0, // SWAP
                amount
            );

            // User should be able to see their own score
            const score = await creditRegistry.connect(user1).getMyScore();
            expect(score).to.be.gt(0);
        });

        it("should update score commitment", async function () {
            const amount = ethers.parseEther("100");

            // Initially no commitment
            const initialCommitment = await creditRegistry.getScoreCommitment(user1.address);
            expect(initialCommitment).to.equal(ethers.ZeroHash);

            await creditRegistry.connect(interceptor).registerCreditEvent(
                user1.address,
                0,
                amount
            );

            // After event, commitment should be set
            const commitment = await creditRegistry.getScoreCommitment(user1.address);
            expect(commitment).to.not.equal(ethers.ZeroHash);
        });

        it("should emit CreditEventRecorded event", async function () {
            const amount = ethers.parseEther("100");

            await expect(
                creditRegistry.connect(interceptor).registerCreditEvent(
                    user1.address,
                    0,
                    amount
                )
            ).to.emit(creditRegistry, "CreditEventRecorded");
        });
    });

    describe("Score Privacy", function () {
        it("user can only see their own score", async function () {
            const amount = ethers.parseEther("100");

            await creditRegistry.connect(interceptor).registerCreditEvent(
                user1.address,
                2, // REPAY - highest weight
                amount
            );

            // User1 can see their score
            const user1Score = await creditRegistry.connect(user1).getMyScore();
            expect(user1Score).to.be.gt(0);

            // User2 sees zero (their own score, not user1's)
            const user2Score = await creditRegistry.connect(user2).getMyScore();
            expect(user2Score).to.equal(0);
        });

        it("user can only see their own credit history", async function () {
            const amount = ethers.parseEther("100");

            await creditRegistry.connect(interceptor).registerCreditEvent(
                user1.address,
                0,
                amount
            );

            // User1 can see their history
            const user1History = await creditRegistry.connect(user1).getMyCreditHistory();
            expect(user1History.length).to.equal(1);

            // User2 sees empty history
            const user2History = await creditRegistry.connect(user2).getMyCreditHistory();
            expect(user2History.length).to.equal(0);
        });
    });

    describe("Score Calculation", function () {
        it("should calculate higher score for higher weight actions", async function () {
            const amount = ethers.parseEther("100");

            // Register TRANSFER (weight 5) for user1
            await creditRegistry.connect(interceptor).registerCreditEvent(
                user1.address,
                4, // TRANSFER
                amount
            );

            // Register REPAY (weight 50) for user2
            await creditRegistry.connect(interceptor).registerCreditEvent(
                user2.address,
                2, // REPAY
                amount
            );

            const user1Score = await creditRegistry.connect(user1).getMyScore();
            const user2Score = await creditRegistry.connect(user2).getMyScore();

            // REPAY should give higher score than TRANSFER
            expect(user2Score).to.be.gt(user1Score);
        });

        it("should cap score at MAX_SCORE", async function () {
            // Register many high-value events
            for (let i = 0; i < 100; i++) {
                await creditRegistry.connect(interceptor).registerCreditEvent(
                    user1.address,
                    2, // REPAY
                    ethers.parseEther("1000")
                );
            }

            const score = await creditRegistry.connect(user1).getMyScore();
            const maxScore = await creditRegistry.MAX_SCORE();

            expect(score).to.equal(maxScore);
        });
    });

    describe("Admin Functions", function () {
        it("owner can update action weights", async function () {
            await creditRegistry.setActionWeight(0, 50); // SWAP now weight 50
            expect(await creditRegistry.getActionWeight(0)).to.equal(50);
        });

        it("non-owner cannot update action weights", async function () {
            await expect(
                creditRegistry.connect(user1).setActionWeight(0, 50)
            ).to.be.revert(ethers);
        });

        it("owner can update interceptor", async function () {
            await creditRegistry.setInterceptor(user2.address);

            // Old interceptor should fail
            await expect(
                creditRegistry.connect(interceptor).registerCreditEvent(
                    user1.address,
                    0,
                    ethers.parseEther("100")
                )
            ).to.be.revertedWith("CreditRegistry: caller is not interceptor");

            // New interceptor should work
            await creditRegistry.connect(user2).registerCreditEvent(
                user1.address,
                0,
                ethers.parseEther("100")
            );
        });
    });

    describe("Commitment Verification", function () {
        it("should verify valid commitment", async function () {
            const amount = ethers.parseEther("100");

            await creditRegistry.connect(interceptor).registerCreditEvent(
                user1.address,
                0,
                amount
            );

            // Get user's score and salt
            const score = await creditRegistry.connect(user1).getMyScore();
            const salt = await creditRegistry.connect(user1).getMySalt();

            // Verify commitment
            const isValid = await creditRegistry.verifyCommitment(user1.address, score, salt);
            expect(isValid).to.be.true;
        });

        it("should reject invalid commitment", async function () {
            const amount = ethers.parseEther("100");

            await creditRegistry.connect(interceptor).registerCreditEvent(
                user1.address,
                0,
                amount
            );

            // Try to verify with wrong score
            const wrongScore = 999;
            const salt = await creditRegistry.connect(user1).getMySalt();

            const isValid = await creditRegistry.verifyCommitment(user1.address, wrongScore, salt);
            expect(isValid).to.be.false;
        });
    });

    describe("Merkle Root", function () {
        it("should update merkle root after each event", async function () {
            const initialRoot = await creditRegistry.getRegistryMerkleRoot();

            await creditRegistry.connect(interceptor).registerCreditEvent(
                user1.address,
                0,
                ethers.parseEther("100")
            );

            const newRoot = await creditRegistry.getRegistryMerkleRoot();
            expect(newRoot).to.not.equal(initialRoot);
        });
    });
});
