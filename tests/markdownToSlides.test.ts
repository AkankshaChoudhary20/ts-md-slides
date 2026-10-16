import { test } from "node:test";
import assert from "node:assert/strict";
import { splitMarkdownIntoSlides } from "../src/markdownToSlides.js";

test("splits markdown into slides on a `---` line", () => {
  const md = [
    "# Slide One",
    "Some intro text.",
    "",
    "---",
    "",
    "## Slide Two",
    "- a",
    "- b",
    "",
    "---",
    "",
    "### Slide Three",
  ].join("\n");

  const slides = splitMarkdownIntoSlides(md);

  assert.equal(slides.length, 3);
  assert.match(slides[0], /^# Slide One/);
  assert.match(slides[1], /^## Slide Two/);
  assert.match(slides[2], /^### Slide Three/);
});

test("ignores a single slide with no separators", () => {
  const md = "# Only slide\n\nJust one.";
  const slides = splitMarkdownIntoSlides(md);
  assert.equal(slides.length, 1);
  assert.equal(slides[0], md);
});

test("drops empty slides caused by leading, trailing, or duplicate separators", () => {
  const md = "---\n\n# First\n\n---\n---\n\n# Second\n\n---\n";
  const slides = splitMarkdownIntoSlides(md);
  assert.equal(slides.length, 2);
  assert.match(slides[0], /^# First/);
  assert.match(slides[1], /^# Second/);
});

test("does not split on `---` embedded within a line (not on its own line)", () => {
  const md = "# Title\n\nSome text with -- not a separator -- inline.";
  const slides = splitMarkdownIntoSlides(md);
  assert.equal(slides.length, 1);
});

test("handles CRLF line endings", () => {
  const md = "# One\r\n\r\n---\r\n\r\n# Two";
  const slides = splitMarkdownIntoSlides(md);
  assert.equal(slides.length, 2);
});


test("preserves slide separators inside backtick and tilde code fences", () => {
  for (const fence of ["```", "~~~"]) {
    const first = ["# Code", fence + "yaml", "key: value", "---", "next: value", fence].join("\n");
    assert.deepEqual(splitMarkdownIntoSlides(first + "\n---\n# Next"), [first, "# Next"]);
  }
});

test("shorter or mismatched fences do not close a code block", () => {
  const first = ["````markdown", "```", "~~~", "---", "````"].join("\n");
  assert.deepEqual(splitMarkdownIntoSlides(first + "\n---\n# Next"), [first, "# Next"]);
});

test("an unclosed code fence keeps the rest on the same slide", () => {
  const source = "# Example\n```yaml\n---\nvalue: 1";
  assert.deepEqual(splitMarkdownIntoSlides(source), [source]);
});
