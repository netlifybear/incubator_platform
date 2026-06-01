import assert from "node:assert/strict";
import test from "node:test";
import { escapeHtml, escapeHtmlAttribute } from "./html.ts";

test("escapeHtml escapes text that would otherwise become markup", () => {
  assert.equal(
    escapeHtml(`<strong>"Founder" & 'peer'</strong>`),
    "&lt;strong&gt;&quot;Founder&quot; &amp; &#39;peer&#39;&lt;/strong&gt;",
  );
});

test("escapeHtmlAttribute escapes attribute-breaking characters", () => {
  assert.equal(escapeHtmlAttribute(`https://example.com?a=1&b="x"`), "https://example.com?a=1&amp;b=&quot;x&quot;");
});
