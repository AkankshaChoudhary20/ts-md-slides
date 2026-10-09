import { marked } from "marked";
import { splitMarkdownIntoSlides } from "./markdownToSlides.js";

export interface RenderOptions {
  /** Document title, shown in the <title> tag. */
  title?: string;
  /** When true, injects a small SSE-based live-reload client script. */
  liveReload?: boolean;
}

/** Converts each slide's Markdown source into an HTML fragment. */
export function slidesToHtmlFragments(slidesMarkdown: string[]): string[] {
  return slidesMarkdown.map((md) => marked.parse(md, { async: false }) as string);
}

const STYLE = `
  :root {
    color-scheme: light dark;
    --bg: #111318;
    --fg: #f4f4f5;
    --accent: #7dd3fc;
    --muted: #8b8f99;
    --code-bg: #1c1f26;
  }
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    height: 100%;
    background: var(--bg);
    color: var(--fg);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
  }
  #deck {
    position: relative;
    width: 100%;
    height: 100vh;
    overflow: hidden;
  }
  .slide {
    position: absolute;
    inset: 0;
    display: none;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    padding: 6vh 8vw;
    overflow-y: auto;
  }
  .slide.active {
    display: flex;
  }
  .slide h1, .slide h2, .slide h3 {
    line-height: 1.2;
    margin-top: 0;
  }
  .slide h1 { font-size: 3rem; }
  .slide h2 { font-size: 2.25rem; }
  .slide h3 { font-size: 1.5rem; }
  .slide p, .slide li { font-size: 1.35rem; line-height: 1.5; }
  .slide ul, .slide ol { padding-left: 1.4em; }
  .slide a { color: var(--accent); }
  .slide pre {
    background: var(--code-bg);
    padding: 1em 1.25em;
    border-radius: 8px;
    overflow-x: auto;
    max-width: 100%;
    font-size: 1rem;
  }
  .slide code {
    font-family: "SF Mono", Menlo, Consolas, monospace;
  }
  .slide :not(pre) > code {
    background: var(--code-bg);
    padding: 0.15em 0.4em;
    border-radius: 4px;
  }
  .slide blockquote {
    border-left: 4px solid var(--accent);
    margin-left: 0;
    padding-left: 1em;
    color: var(--muted);
  }
  .slide img { max-width: 100%; }

  #controls {
    position: fixed;
    bottom: 18px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 14px;
    background: rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(6px);
    padding: 8px 16px;
    border-radius: 999px;
    z-index: 10;
    font-size: 0.95rem;
    user-select: none;
  }
  #controls button {
    background: transparent;
    border: 1px solid var(--muted);
    color: var(--fg);
    border-radius: 999px;
    width: 32px;
    height: 32px;
    cursor: pointer;
    font-size: 1rem;
    line-height: 1;
  }
  #controls button:hover {
    border-color: var(--accent);
    color: var(--accent);
  }
  #controls #counter {
    color: var(--muted);
    min-width: 3.5em;
    text-align: center;
    font-variant-numeric: tabular-nums;
  }

  @media print {
    @page { size: landscape; margin: 15mm; }
    html, body { height: auto; background: white; color: black; }
    #deck { height: auto; overflow: visible; }
    .slide, .slide.active {
      position: static;
      display: flex;
      min-height: 150mm;
      padding: 0;
      overflow: visible;
      break-after: page;
    }
    .slide:last-child { break-after: auto; }
    .slide pre, .slide :not(pre) > code { background: #eee; color: black; }
    .slide a, .slide blockquote { color: #333; }
    #controls { display: none; }
  }
`;

const NAV_SCRIPT = `
(function () {
  var slides = Array.prototype.slice.call(document.querySelectorAll(".slide"));
  var counter = document.getElementById("counter");
  var current = 0;

  function show(index) {
    if (index < 0 || index >= slides.length) return;
    slides[current].classList.remove("active");
    current = index;
    slides[current].classList.add("active");
    counter.textContent = (current + 1) + " / " + slides.length;
    if (history.replaceState) {
      history.replaceState(null, "", "#" + (current + 1));
    }
  }

  function next() { show(current + 1); }
  function prev() { show(current - 1); }

  document.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
      e.preventDefault();
      next();
    } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
      e.preventDefault();
      prev();
    } else if (e.key === "Home") {
      show(0);
    } else if (e.key === "End") {
      show(slides.length - 1);
    }
  });

  var nextBtn = document.getElementById("next-btn");
  var prevBtn = document.getElementById("prev-btn");
  if (nextBtn) nextBtn.addEventListener("click", next);
  if (prevBtn) prevBtn.addEventListener("click", prev);

  var initial = parseInt((location.hash || "").replace("#", ""), 10);
  if (!isNaN(initial) && initial >= 1 && initial <= slides.length) {
    show(initial - 1);
  } else {
    show(0);
  }
})();
`;

const LIVE_RELOAD_SCRIPT = `
(function () {
  function connect() {
    var es = new EventSource("/__livereload");
    es.addEventListener("reload", function () {
      location.reload();
    });
    es.onerror = function () {
      es.close();
      setTimeout(connect, 1000);
    };
  }
  connect();
})();
`;

/** Builds a complete, self-contained HTML document for the given Markdown source. */
export function buildDeckHtml(markdownSource: string, options: RenderOptions = {}): string {
  const slidesMarkdown = splitMarkdownIntoSlides(markdownSource);
  const htmlSlides = slidesToHtmlFragments(slidesMarkdown);
  const title = escapeHtml(options.title ?? "Slide Deck");

  const slideDivs = htmlSlides
    .map((html, i) => `      <section class="slide" data-index="${i}">\n${indent(html, 8)}\n      </section>`)
    .join("\n");

  const liveReloadTag = options.liveReload
    ? `\n  <script>\n${LIVE_RELOAD_SCRIPT}\n  </script>`
    : "";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>${STYLE}
  </style>
</head>
<body>
  <div id="deck">
${slideDivs}
  </div>
  <div id="controls">
    <button id="prev-btn" aria-label="Previous slide">&#8592;</button>
    <span id="counter">1 / ${htmlSlides.length}</span>
    <button id="next-btn" aria-label="Next slide">&#8594;</button>
  </div>
  <script>${NAV_SCRIPT}
  </script>${liveReloadTag}
</body>
</html>
`;
}

function indent(text: string, spaces: number): string {
  const pad = " ".repeat(spaces);
  return text
    .split("\n")
    .map((line) => (line.length ? pad + line : line))
    .join("\n");
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
