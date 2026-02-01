/// GhostScore ZK Circuit
/// Proves that a user's credit score is above a threshold without revealing the actual score.
///
/// This enables privacy-preserving credit verification:
/// - Lenders can verify borrowers meet minimum credit requirements
/// - Users never expose their actual score, only that it exceeds a threshold
/// - Commitment ties the proof to a specific user without revealing their address

/// Pedersen hash for commitments (available in Noir's standard library)
use std::hash::pedersen_hash;

/// Compute the user's score commitment
/// commitment = pedersen_hash(actual_score, user_address_hash, salt)
///
/// This creates a binding commitment that:
/// - Hides the actual score
/// - Ties the proof to a specific user
/// - Prevents replay attacks via the salt
fn compute_commitment(score: Field, user_address_hash: Field, salt: Field) -> Field {
    pedersen_hash([score, user_address_hash, salt])
}

/// Compute tier from score
/// Returns tier index: 0=Newcomer, 1=Builder, 2=Trusted, 3=Elite
fn get_tier(score: u32) -> u8 {
    if score >= 600 {
        3 // Elite
    } else if score >= 300 {
        2 // Trusted
    } else if score >= 100 {
        1 // Builder
    } else {
        0 // Newcomer
    }
}

/// Main circuit: Prove score >= threshold
///
/// Private inputs (hidden from verifier):
/// - actual_score: The user's real credit score (0-1000)
/// - salt: Random value for commitment generation
/// - user_address_hash: Hash of user's address (for binding proof to user)
///
/// Public inputs (visible to verifier):
/// - score_threshold: Minimum score being proven (e.g., 300 for "Trusted" tier)
/// - commitment: Hash binding the proof to this specific user and score
///
/// The circuit proves:
/// 1. actual_score >= score_threshold (without revealing actual_score)
/// 2. commitment == hash(actual_score, user_address_hash, salt)
fn main(
    // Private inputs
    actual_score: u32,
    salt: Field,
    user_address_hash: Field,
    // Public inputs
    score_threshold: pub u32,
    commitment: pub Field,
) {
    // Constraint 1: Score must be at least the threshold
    assert(actual_score >= score_threshold, "Score below threshold");

    // Constraint 2: Score must be valid (0-1000 range)
    assert(actual_score <= 1000, "Score exceeds maximum");

    // Constraint 3: Verify the commitment matches
    // This ties the proof to a specific user and score without revealing them
    let computed_commitment = compute_commitment(actual_score as Field, user_address_hash, salt);
    assert(commitment == computed_commitment, "Invalid commitment");
}

/// Test the main circuit
#[test]
fn test_basic_proof() {
    // User has score 450, proving >= 300 (Trusted tier)
    let actual_score: u32 = 450;
    let salt: Field = 12345;
    let user_address_hash: Field = 0x1234567890abcdef;
    let score_threshold: u32 = 300;

    // Compute the commitment
    let commitment = compute_commitment(actual_score as Field, user_address_hash, salt);

    // This should pass
    main(
        actual_score,
        salt,
        user_address_hash,
        score_threshold,
        commitment,
    );
}

#[test]
fn test_elite_tier_proof() {
    // User has score 750, proving >= 600 (Elite tier)
    let actual_score: u32 = 750;
    let salt: Field = 99999;
    let user_address_hash: Field = 0xfedcba9876543210;
    let score_threshold: u32 = 600;

    let commitment = compute_commitment(actual_score as Field, user_address_hash, salt);

    main(
        actual_score,
        salt,
        user_address_hash,
        score_threshold,
        commitment,
    );
}

#[test]
fn test_exact_threshold() {
    // User has score exactly at threshold
    let actual_score: u32 = 300;
    let salt: Field = 11111;
    let user_address_hash: Field = 0xaaaaaaaaaaaaaaaa;
    let score_threshold: u32 = 300;

    let commitment = compute_commitment(actual_score as Field, user_address_hash, salt);

    // Exact match should pass
    main(
        actual_score,
        salt,
        user_address_hash,
        score_threshold,
        commitment,
    );
}

#[test(should_fail_with = "Score below threshold")]
fn test_insufficient_score() {
    // User has score 250, trying to prove >= 300
    let actual_score: u32 = 250;
    let salt: Field = 22222;
    let user_address_hash: Field = 0xbbbbbbbbbbbbbbbb;
    let score_threshold: u32 = 300;

    let commitment = compute_commitment(actual_score as Field, user_address_hash, salt);

    // This should fail
    main(
        actual_score,
        salt,
        user_address_hash,
        score_threshold,
        commitment,
    );
}

#[test(should_fail_with = "Invalid commitment")]
fn test_wrong_commitment() {
    let actual_score: u32 = 450;
    let salt: Field = 33333;
    let user_address_hash: Field = 0xcccccccccccccccc;
    let score_threshold: u32 = 300;

    // Use a wrong commitment
    let wrong_commitment: Field = 0x1234;

    // This should fail due to commitment mismatch
    main(
        actual_score,
        salt,
        user_address_hash,
        score_threshold,
        wrong_commitment,
    );
}

#[test]
fn test_tier_function() {
    assert(get_tier(50) == 0); // Newcomer
    assert(get_tier(150) == 1); // Builder
    assert(get_tier(400) == 2); // Trusted
    assert(get_tier(800) == 3); // Elite
}
