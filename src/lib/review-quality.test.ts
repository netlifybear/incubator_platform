import assert from "node:assert/strict";
import test from "node:test";
import {
  analyzeMetrics,
  analyzeReviewText,
  generateChecklist,
} from "./review-quality.ts";
import founderRules from "../config/review-rules-founder.json" with { type: "json" };
import consumerRules from "../config/review-rules-consumer.json" with { type: "json" };

test("metrics: counts chars and words", () => {
  const m = analyzeMetrics("Used their tax service for Q3 filing.");
  assert.equal(m.length, 37);
  assert.equal(m.wordCount, 7);
});

test("metrics: detects numbers", () => {
  assert.equal(analyzeMetrics("No digits here").hasNumbers, false);
  assert.equal(analyzeMetrics("Saved $5,000").hasNumbers, true);
  assert.equal(analyzeMetrics("Filed Q3 taxes").hasNumbers, true);
});

test("metrics: detects proper nouns", () => {
  assert.equal(analyzeMetrics("all lowercase").hasProperNouns, false);
  assert.equal(analyzeMetrics("Used Smith Law").hasProperNouns, true);
});

test("metrics: detects service mentions", () => {
  assert.equal(analyzeMetrics("Great pizza!").hasServiceMention, false);
  assert.equal(analyzeMetrics("Hired them for tax filing").hasServiceMention, true);
  assert.equal(analyzeMetrics("They provided excellent service").hasServiceMention, true);
});

test("metrics: detects outcomes", () => {
  assert.equal(analyzeMetrics("They were nice").hasOutcome, false);
  assert.equal(analyzeMetrics("They saved me $5,000").hasOutcome, true);
  assert.equal(analyzeMetrics("The trademark was approved").hasOutcome, true);
});

test("metrics: detects excessive punctuation", () => {
  assert.equal(analyzeMetrics("Normal text.").hasExcessivePunctuation, false);
  assert.equal(analyzeMetrics("Amazing!!!").hasExcessivePunctuation, true);
  assert.equal(analyzeMetrics("THIS IS LOUD").hasExcessivePunctuation, true);
});

test("metrics: detects sentiment balance", () => {
  assert.equal(analyzeMetrics("Great service, highly recommend.").hasBothSentiments, false);
  assert.equal(
    analyzeMetrics("Great service but expensive for what you get.").hasBothSentiments,
    true,
  );
});

test("metrics: calculates keyword repetition density", () => {
  const m = analyzeMetrics("great great great great great service");
  assert.ok(m.keywordRepetitionDensity > 0.3);
});

test("founder mode: short text triggers errors", () => {
  const result = analyzeReviewText("Great.", founderRules);
  const errors = result.warnings.filter((w) => w.severity === "error");
  assert.ok(errors.length > 0);
  assert.ok(errors.some((e) => e.ruleId === "F_LEN_001"));
  assert.ok(errors.some((e) => e.ruleId === "F_SPEC_001"));
});

test("founder mode: detailed text passes length checks", () => {
  const text =
    "Hired Smith Law for trademark filing. They saved us $5,000 and got approval in 4 months. " +
    "The team was responsive and knowledgeable. The only downside was slow email communication " +
    "during the initial onboarding. Would recommend them for early-stage founders needing IP protection.";
  const result = analyzeReviewText(text, founderRules);
  const lengthErrors = result.warnings.filter(
    (w) => w.category === "length" && w.severity === "error",
  );
  assert.equal(lengthErrors.length, 0);
});

test("founder mode: disclosure check fails when not disclosed", () => {
  const result = analyzeReviewText("Detailed review text here.", founderRules, false);
  const discWarnings = result.warnings.filter((w) => w.ruleId === "F_DISC_001");
  assert.ok(discWarnings.length > 0);
});

test("founder mode: disclosure check passes when disclosed", () => {
  const result = analyzeReviewText("Detailed review text here.", founderRules, true);
  const discWarnings = result.warnings.filter((w) => w.ruleId === "F_DISC_001");
  assert.equal(discWarnings.length, 0);
});

test("consumer mode: short text gets suggestions not errors", () => {
  const result = analyzeReviewText("Great.", consumerRules);
  const errors = result.warnings.filter((w) => w.severity === "error");
  assert.equal(errors.length, 0);
  const suggestions = result.warnings.filter((w) => w.severity === "suggestion");
  assert.ok(suggestions.length > 0);
});

test("score: perfect text scores 100", () => {
  const text =
    "Hired Smith Law for trademark filing. The outcome was great — they saved me $5,000 " +
    "and got approval in 4 months. Very responsive team but onboarding was slow. " +
    "Would recommend for early-stage founders.";
  const result = analyzeReviewText(text, founderRules, true);
  assert.equal(result.score, 100);
});

test("score: empty text scores low", () => {
  const result = analyzeReviewText("", founderRules);
  assert.ok(result.score < 50);
});

test("checklist: generates items based on metrics", () => {
  const metrics = analyzeMetrics("Great.");
  const checklist = generateChecklist("Great.", false, metrics);
  assert.ok(Array.isArray(checklist));
  assert.ok(checklist.length > 0);
  assert.ok(checklist.every((c) => c.id && c.label && c.suggestion !== undefined));
});

test("checklist: disclosure passes when already disclosed", () => {
  const metrics = analyzeMetrics("Saved $500 using their service.");
  const checklist = generateChecklist("Saved $500 using their service.", true, metrics);
  const disc = checklist.find((c) => c.id === "disclosure");
  assert.ok(disc?.passed);
});
