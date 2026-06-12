import assert from "node:assert/strict";
import test from "node:test";
import { getCredibilityTier } from "./credibility-tier.ts";

test("credibility tier starts as establishing when there is little evidence", () => {
  const tier = getCredibilityTier({
    reviewCount: 0,
    averageReviewQuality: 0,
    helpfulVoteCount: 0,
    contributionSignalCount: 0,
    profileCompletePercentage: 30,
    verifiedBacklinkCount: 0,
    publicProfileEnabled: false,
  });

  assert.equal(tier.key, "establishing");
  assert.equal(tier.label, "Establishing");
});

test("credibility tier recognizes verified contributors", () => {
  const tier = getCredibilityTier({
    reviewCount: 1,
    averageReviewQuality: 65,
    helpfulVoteCount: 0,
    contributionSignalCount: 0,
    profileCompletePercentage: 70,
    verifiedBacklinkCount: 0,
    publicProfileEnabled: false,
  });

  assert.equal(tier.key, "verified");
  assert.equal(tier.label, "Verified Contributor");
});

test("credibility tier recognizes trusted contributors with peer validation", () => {
  const tier = getCredibilityTier({
    reviewCount: 3,
    averageReviewQuality: 75,
    helpfulVoteCount: 2,
    contributionSignalCount: 1,
    profileCompletePercentage: 80,
    verifiedBacklinkCount: 0,
    publicProfileEnabled: true,
  });

  assert.equal(tier.key, "trusted");
  assert.equal(tier.label, "Trusted Contributor");
});

test("credibility tier recognizes cohort authorities", () => {
  const tier = getCredibilityTier({
    reviewCount: 5,
    averageReviewQuality: 82,
    helpfulVoteCount: 5,
    contributionSignalCount: 3,
    profileCompletePercentage: 90,
    verifiedBacklinkCount: 1,
    publicProfileEnabled: true,
  });

  assert.equal(tier.key, "authority");
  assert.equal(tier.label, "Cohort Authority");
});

test("credibility tier recognizes public credibility leaders", () => {
  const tier = getCredibilityTier({
    reviewCount: 8,
    averageReviewQuality: 88,
    helpfulVoteCount: 10,
    contributionSignalCount: 5,
    profileCompletePercentage: 95,
    verifiedBacklinkCount: 3,
    publicProfileEnabled: true,
  });

  assert.equal(tier.key, "leader");
  assert.equal(tier.label, "Public Credibility Leader");
});
