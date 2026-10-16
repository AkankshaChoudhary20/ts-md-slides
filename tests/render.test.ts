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

// Execute the generated browser script so the test checks keyboard behavior,
// rather than matching implementation text.
import { runInNewContext } from "node:vm";
function navigation() {
  let keydown: (event: any) => void = () => {};
  let active = 0;
  const slides = [0, 1, 2].map(index => ({ classList: {
    remove() {}, add() { active = index; }
  } }));
  const script = buildDeckHtml("# One\n---\n# Two\n---\n# Three")
    .match(/<script>([\s\S]*?)<\/script>/)![1];
  runInNewContext(script, {
    document: {
      querySelectorAll: () => slides,
      getElementById: (id: string) => id === 'counter' ? {} : { addEventListener() {} },
      addEventListener: (_: string, handler: typeof keydown) => { keydown = handler; }
    },
    history: { replaceState() {} }, location: { hash: '' }
  });
  return { keydown, active: () => active };
}

test("navigation preserves editing keys and modified shortcuts", () => {
  const nav = navigation();
  for (const target of [
    { tagName: 'INPUT' }, { tagName: 'TEXTAREA' }, { tagName: 'SELECT' },
    { tagName: 'SPAN', isContentEditable: true }
  ]) {
    for (const key of ['ArrowRight', 'ArrowLeft', ' ', 'Home', 'End', 'PageDown', 'PageUp']) {
      nav.keydown({ key, target, preventDefault() { assert.fail('editing key consumed'); } });
      assert.equal(nav.active(), 0);
    }
  }
  for (const option of ['ctrlKey', 'metaKey', 'altKey', 'defaultPrevented']) {
    nav.keydown({ key: 'ArrowRight', [option]: true, preventDefault() { assert.fail('shortcut consumed'); } });
    assert.equal(nav.active(), 0);
  }
});

test("navigation still advances and prevents scrolling for plain arrow keys", () => {
  const nav = navigation();
  let prevented = false;
  nav.keydown({ key: 'ArrowRight', target: { tagName: 'BODY' }, preventDefault() { prevented = true; } });
  assert.equal(nav.active(), 1);
  assert.equal(prevented, true);
});
