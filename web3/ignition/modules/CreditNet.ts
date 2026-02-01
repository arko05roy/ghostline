import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * CreditNet Protocol Deployment Module
 * 
 * Deploys all core contracts for the CreditNet Protocol:
 * 1. Implementation contracts (for cloning)
 * 2. CreditChainFactory (master deployer)
 * 3. CrossChainBridge
 * 4. Mock contracts for testing
 */
const CreditNetModule = buildModule("CreditNet", (m) => {
    // ============ Deploy Implementation Contracts ============

    // These are the master copies that will be cloned by the factory
    const creditRegistry = m.contract("CreditRegistry", [], { id: "CreditRegistryImpl" });
    const creditInterceptor = m.contract("CreditInterceptor", [], { id: "CreditInterceptorImpl" });
    const creditVault = m.contract("CreditVault", [], { id: "CreditVaultImpl" });
    const ghostScoreVerifier = m.contract("GhostScoreVerifier", [], { id: "GhostScoreVerifierImpl" });
    const creditNFT = m.contract("CreditNFT", [], { id: "CreditNFTImpl" });

    // ============ Deploy Mock Token for Testing ============

    const mockToken = m.contract("MockERC20", [
        "CreditCoin",
        "CTC",
        18
    ], { id: "MockCTC" });

    // ============ Deploy Factory ============

    // The factory uses the implementation contracts for gas-efficient cloning
    const creditChainFactory = m.contract("CreditChainFactory", [
        creditRegistry,
        creditInterceptor,
        creditVault,
        ghostScoreVerifier,
        creditNFT,
        mockToken,  // Default lending token
    ], { id: "CreditChainFactory" });

    // ============ Deploy CrossChainBridge ============

    const crossChainBridge = m.contract("CrossChainBridge", [], { id: "CrossChainBridge" });

    return {
        // Implementation contracts
        creditRegistry,
        creditInterceptor,
        creditVault,
        ghostScoreVerifier,
        creditNFT,

        // Mock token
        mockToken,

        // Core infrastructure
        creditChainFactory,
        crossChainBridge,
    };
});

export default CreditNetModule;
