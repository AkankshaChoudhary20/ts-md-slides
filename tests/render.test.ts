import { test } from "node:test";
import assert from "node:assert/strict";
import { buildDeckHtml } from "../src/render.js";

const SAMPLE = [
  "# Title Slide",
  "Welcome!",
  "",
  "---",
  "",
  "## Second Slide",
  "- one",
  "- two",
  "",
  "---",
  "",
  "## Third Slide",
  "```js",
  'console.log("hi");',
  "```",
].join("\n");

test("generated HTML contains one .slide section per slide", () => {
  const html = buildDeckHtml(SAMPLE, { title: "Test Deck" });
  const matches = html.match(/class="slide"/g) ?? [];
  assert.equal(matches.length, 3);
});

test("generated HTML is self-contained (no external script/link tags)", () => {
  const html = buildDeckHtml(SAMPLE, { title: "Test Deck" });
  assert.doesNotMatch(html, /<script[^>]+src=/i);
  assert.doesNotMatch(html, /<link[^>]+href="https?:/i);
  assert.doesNotMatch(html, /cdn\./i);
});

test("includes the document title", () => {
  const html = buildDeckHtml(SAMPLE, { title: "My Presentation" });
  assert.match(html, /<title>My Presentation<\/title>/);
});

test("renders markdown content (headings, lists, code) into HTML", () => {
  const html = buildDeckHtml(SAMPLE, { title: "Test Deck" });
  assert.match(html, /<h1>Title Slide<\/h1>/);
  assert.match(html, /<li>one<\/li>/);
  assert.match(html, /<pre><code/);
});

test("live reload script is only injected when requested", () => {
  const withReload = buildDeckHtml(SAMPLE, { liveReload: true });
  const without = buildDeckHtml(SAMPLE, { liveReload: false });
  assert.match(withReload, /__livereload/);
  assert.doesNotMatch(without, /__livereload/);
});
