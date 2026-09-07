# md-slides Demo

A tiny presentation to show off the tool.

Press the right arrow, space, or click the next button to continue.

---

## Why md-slides?

- Write slides in plain **Markdown**
- No build step required to view the output
- Output is a single self-contained HTML file
- Works completely offline — no CDN, no network calls

---

## Splitting slides

Slides are separated by a horizontal rule on its own line:

```
# Slide A

content

---

# Slide B
```

That's the only convention you need to remember.

---

## Code blocks

Fenced code blocks are supported out of the box:

```js
function greet(name) {
  console.log(`Hello, ${name}!`);
}

greet("world");
```

---

## Navigation

| Key            | Action        |
| -------------- | ------------- |
| `→` / `Space`  | Next slide    |
| `←`            | Previous slide|
| `Home` / `End` | First / last  |

You can also click the on-screen prev/next buttons.

---

## Try it live

Run:

```
md-slides serve examples/demo.md
```

...and edit this file. The browser will reload automatically.

---

# Thanks!

Built with TypeScript, `marked`, and `chokidar`.
