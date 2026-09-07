#!/usr/bin/env node
import * as fs from "node:fs";
import * as path from "node:path";
import { buildDeckHtml } from "./render.js";
import { startServer } from "./serve.js";

function printUsage(): void {
  console.log(`md-slides - convert Markdown into a self-contained slide deck

Usage:
  md-slides build <input.md> [-o output.html]
  md-slides serve <input.md> [-p port]

Options:
  -o, --output <file>   Output HTML file for "build" (default: <input>.html)
  -p, --port <number>   Port for "serve" (default: 3000)
  -h, --help            Show this help message
`);
}

interface ParsedArgs {
  positional: string[];
  output?: string;
  port?: number;
  help: boolean;
}

function parseArgs(argv: string[]): ParsedArgs {
  const positional: string[] = [];
  let output: string | undefined;
  let port: number | undefined;
  let help = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "-o" || arg === "--output") {
      output = argv[++i];
    } else if (arg === "-p" || arg === "--port") {
      port = Number(argv[++i]);
    } else if (arg === "-h" || arg === "--help") {
      help = true;
    } else {
      positional.push(arg);
    }
  }

  return { positional, output, port, help };
}

function runBuild(inputFile: string, outputFile: string | undefined): void {
  const absInput = path.resolve(inputFile);
  if (!fs.existsSync(absInput)) {
    console.error(`Error: input file not found: ${inputFile}`);
    process.exit(1);
  }

  const source = fs.readFileSync(absInput, "utf8");
  const title = path.basename(absInput, path.extname(absInput));
  const html = buildDeckHtml(source, { title });

  const outPath = outputFile
    ? path.resolve(outputFile)
    : path.join(path.dirname(absInput), `${title}.html`);

  fs.writeFileSync(outPath, html, "utf8");
  console.log(`Built slide deck: ${outPath}`);
}

async function runServe(inputFile: string, port: number | undefined): Promise<void> {
  const absInput = path.resolve(inputFile);
  if (!fs.existsSync(absInput)) {
    console.error(`Error: input file not found: ${inputFile}`);
    process.exit(1);
  }

  const handle = await startServer(absInput, { port });
  const address = handle.server.address();
  const actualPort = typeof address === "object" && address ? address.port : port ?? 3000;
  console.log(`Serving ${path.basename(absInput)} at http://localhost:${actualPort}`);
  console.log("Watching for changes... (Ctrl+C to stop)");

  const shutdown = async () => {
    await handle.close();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

async function main(): Promise<void> {
  const [, , command, ...rest] = process.argv;

  if (!command || command === "-h" || command === "--help") {
    printUsage();
    process.exit(command ? 0 : 1);
  }

  const { positional, output, port, help } = parseArgs(rest);

  if (help || positional.length === 0) {
    printUsage();
    process.exit(help ? 0 : 1);
  }

  const inputFile = positional[0];

  switch (command) {
    case "build":
      runBuild(inputFile, output);
      break;
    case "serve":
      await runServe(inputFile, port);
      break;
    default:
      console.error(`Unknown command: ${command}`);
      printUsage();
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
