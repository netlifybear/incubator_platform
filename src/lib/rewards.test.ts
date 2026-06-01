import assert from "node:assert/strict";
import test from "node:test";
import { computeTierProgress, computeReviewStreak } from "./rewards.ts";

test("tier progress starts at New Contributor for 0 points", () => {
  const p = computeTierProgress(0);
  assert.equal(p?.current.title, "New Contributor");
  assert.equal(p?.next?.title, "Bronze Contributor");
});

test("tier progress shows Bronze at 25 points", () => {
  const p = computeTierProgress(25);
  assert.equal(p?.current.title, "Bronze Contributor");
  assert.equal(p?.next?.title, "Silver Contributor");
});

test("tier progress shows Silver at 50 points", () => {
  const p = computeTierProgress(50);
  assert.equal(p?.current.title, "Silver Contributor");
  assert.equal(p?.next?.title, "Gold Contributor");
});

test("tier progress shows Gold at 100 points", () => {
  const p = computeTierProgress(100);
  assert.equal(p?.current.title, "Gold Contributor");
  assert.equal(p?.next?.title, "Platinum Contributor");
});

test("tier progress at 200+ points has no next tier", () => {
  const p = computeTierProgress(200);
  assert.equal(p?.current.title, "Platinum Contributor");
  assert.equal(p?.next, null);
});

test("tier progress at 300 points also maxed", () => {
  const p = computeTierProgress(300);
  assert.equal(p?.current.title, "Platinum Contributor");
  assert.equal(p?.next, null);
});

test("tier progress between thresholds has partial progress", () => {
  const p = computeTierProgress(12);
  assert.equal(p?.current.title, "New Contributor");
  assert(p!.progress > 0 && p!.progress < 1);
});

test("computeReviewStreak returns 0 for null date", () => {
  assert.equal(computeReviewStreak(null), 0);
});

test("computeReviewStreak returns 1 for recent date", () => {
  const recent = new Date(Date.now() - 86400000); // 1 day ago
  assert.equal(computeReviewStreak(recent), 1);
});

test("computeReviewStreak returns 0 for date older than 1 week", () => {
  const old = new Date(Date.now() - 8 * 86400000); // 8 days ago
  assert.equal(computeReviewStreak(old), 0);
});
