/**
 * Splits a Markdown document into an array of per-slide Markdown strings.
 *
 * Convention: a line that consists solely of a horizontal rule (`---`,
 * optionally surrounded by whitespace) on its own line separates slides.
 * Leading/trailing blank slides (e.g. a trailing separator with nothing
 * after it) are dropped.
 */
export function splitMarkdownIntoSlides(markdown: string): string[] {
  const normalized = markdown.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");

  const slides: string[] = [];
  let current: string[] = [];

  const HR_RE = /^\s*---\s*$/;

  for (const line of lines) {
    if (HR_RE.test(line)) {
      slides.push(current.join("\n").trim());
      current = [];
    } else {
      current.push(line);
    }
  }
  slides.push(current.join("\n").trim());

  return slides.filter((slide) => slide.length > 0);
}
