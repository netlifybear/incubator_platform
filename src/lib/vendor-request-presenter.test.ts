import assert from "node:assert/strict";
import test from "node:test";
import {
  closedRequestLabel,
  fulfilledRequestLabel,
  founderRequestActionLabel,
  requestCountLabel,
  requestStatusLabel,
} from "./vendor-request-presenter.ts";

test("request count label pluralizes open requests", () => {
  assert.equal(requestCountLabel(0), "0 open requests");
  assert.equal(requestCountLabel(1), "1 open request");
  assert.equal(requestCountLabel(2), "2 open requests");
});

test("request status labels are human-readable", () => {
  assert.equal(requestStatusLabel("open"), "Open");
  assert.equal(requestStatusLabel("fulfilled"), "Fulfilled");
  assert.equal(requestStatusLabel("closed"), "Closed");
  assert.equal(requestStatusLabel("unexpected"), "Unexpected");
});

test("fulfilled request label names the created vendor", () => {
  assert.equal(
    fulfilledRequestLabel("Brightline Payroll"),
    "Fulfilled with Brightline Payroll",
  );
});

test("founder request action label points fulfilled requests to their vendor", () => {
  assert.equal(founderRequestActionLabel("open"), "Waiting for admin match");
  assert.equal(founderRequestActionLabel("closed"), "Closed by admin");
  assert.equal(
    founderRequestActionLabel("fulfilled", "Brightline Payroll"),
    "View Brightline Payroll",
  );
});

test("closed request label includes the admin note when present", () => {
  assert.equal(closedRequestLabel(), "Closed without a note.");
  assert.equal(
    closedRequestLabel("Duplicate of the payroll request."),
    "Admin note: Duplicate of the payroll request.",
  );
});
