import assert from "node:assert/strict";
import test from "node:test";
import {
  PUBLIC_LEADERBOARD_MIN_FOUNDERS,
  shouldShowPublicLeaderboard,
} from "./leaderboard-privacy.ts";

test("public leaderboard is hidden below the privacy threshold", () => {
  assert.equal(shouldShowPublicLeaderboard(PUBLIC_LEADERBOARD_MIN_FOUNDERS - 1), false);
  assert.equal(shouldShowPublicLeaderboard(PUBLIC_LEADERBOARD_MIN_FOUNDERS), true);
});
