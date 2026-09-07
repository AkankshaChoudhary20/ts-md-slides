import * as http from "node:http";
import * as fs from "node:fs";
import * as path from "node:path";
import chokidar, { FSWatcher } from "chokidar";
import { buildDeckHtml } from "./render.js";

export interface ServeOptions {
  port?: number;
}

export interface ServeHandle {
  server: http.Server;
  watcher: FSWatcher;
  close: () => Promise<void>;
}

/**
 * Starts a local dev server that renders `inputPath` as a slide deck and
 * live-reloads connected browsers (via Server-Sent Events) whenever the
 * source Markdown file changes on disk.
 */
export function startServer(inputPath: string, options: ServeOptions = {}): Promise<ServeHandle> {
  const port = options.port ?? 3000;
  const absPath = path.resolve(inputPath);
  const title = path.basename(absPath);

  const sseClients = new Set<http.ServerResponse>();

  function render(): string {
    const source = fs.readFileSync(absPath, "utf8");
    return buildDeckHtml(source, { title, liveReload: true });
  }

  const server = http.createServer((req, res) => {
    const url = req.url ?? "/";

    if (url === "/__livereload") {
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      });
      res.write("\n");
      sseClients.add(res);
      req.on("close", () => {
        sseClients.delete(res);
      });
      return;
    }

    try {
      const html = render();
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(html);
    } catch (err) {
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Failed to render deck: " + (err instanceof Error ? err.message : String(err)));
    }
  });

  const watcher = chokidar.watch(absPath, { ignoreInitial: true });
  watcher.on("change", () => {
    for (const client of sseClients) {
      client.write("event: reload\ndata: reload\n\n");
    }
  });

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, () => {
      resolve({
        server,
        watcher,
        close: () =>
          new Promise<void>((res) => {
            for (const client of sseClients) client.end();
            watcher.close().then(() => {
              server.close(() => res());
            });
          }),
      });
    });
  });
}
