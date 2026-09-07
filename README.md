# md-slides

A small CLI that turns a Markdown file into a slide deck.

- **`build`** — generates a single self-contained HTML file (inline CSS + JS,
  zero external requests, zero CDN dependencies) that you can open directly
  in a browser or double-click from Finder/Explorer.
- **`serve`** — starts a local dev server that renders the deck on the fly
  and live-reloads your browser (via Server-Sent Events) whenever you save
  the source Markdown file.

Slides are split from a single Markdown file using the standard convention:
a line containing only `---` (a horizontal rule) starts a new slide.
Markdown is rendered with [`marked`](https://github.com/markedjs/marked);
file watching in `serve` uses [`chokidar`](https://github.com/paulmillr/chokidar).

Navigation in the generated deck (both `build` output and the `serve`
preview) is hand-rolled — no reveal.js, no external JS/CSS:

| Input                | Action         |
| --------------------- | -------------- |
| `→` / `Space` / `PgDn` | Next slide     |
| `←` / `PgUp`           | Previous slide |
| `Home` / `End`         | First / last slide |
| Prev/Next buttons     | Click to navigate |

## Install

```bash
git clone <this-repo>
cd ts-md-slides
npm install
npm run build
npm link          # makes the `md-slides` command available globally
```

Without `npm link`, you can still run it via `node dist/cli.js ...` after
`npm run build`, or `npx ts-node src/cli.ts ...` if you have `ts-node`
installed.

## Usage

### Build a static deck

```bash
md-slides build examples/demo.md
# -> examples/demo.html (self-contained, works offline)

md-slides build examples/demo.md -o out/deck.html
```

### Live-reload preview server

```bash
md-slides serve examples/demo.md
# Serving demo.md at http://localhost:3000
# Watching for changes... (Ctrl+C to stop)

md-slides serve examples/demo.md -p 8080
```

Edit `examples/demo.md` while `serve` is running and the browser tab will
reload automatically.

### Help

```bash
md-slides --help
```

## Writing slides

Split slides with a `---` line on its own:

```markdown
# Title Slide

Some intro text.

---

## Second Slide

- bullet one
- bullet two

---

## Code

​```js
console.log("hello");
​```
```

Each slide's Markdown is rendered independently, so headings, lists, links,
blockquotes, images, and fenced code blocks (rendered as plain
`<pre><code>`, no syntax highlighting) all work as expected.

See [`examples/demo.md`](examples/demo.md) for a complete example — build it
with:

```bash
md-slides build examples/demo.md
open examples/demo.html   # macOS; use `xdg-open`/`start` elsewhere
```

## Project layout

```
src/
  cli.ts               CLI entry point (build / serve commands)
  markdownToSlides.ts   Splits a Markdown document into per-slide Markdown
  render.ts             Renders slides to a self-contained HTML document
  serve.ts               Dev server + chokidar watch + SSE live reload
tests/
  markdownToSlides.test.ts
  render.test.ts
examples/
  demo.md               Sample deck used in the README/smoke tests
```

## Development

```bash
npm run build   # tsc -> dist/
npm test        # compiles src+tests to dist-test/ and runs node:test
```

Tests use Node's built-in [`node:test`](https://nodejs.org/api/test.html)
runner and `node:assert/strict` — no extra test framework dependency.

## Notes / limitations

- No syntax highlighting for code blocks (plain `<pre><code>`), by design —
  keeps the tool dependency-free and the output small.
- The `---` slide separator must be on its own line, matching the standard
  Markdown horizontal-rule convention. YAML frontmatter delimited by `---`
  is not treated specially — avoid frontmatter in slide source files.
