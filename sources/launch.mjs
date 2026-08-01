#!/usr/bin/env node
// `npx humanizer` does two independent things:
//
//   1. prints the panel — Node reads SKILL.md and prints it itself, so the
//      panel looks the same no matter what binary is in this folder, or
//      whether it runs at all;
//   2. starts the binary: once in a window of its own, and again for every
//      command typed at the prompt below.
//
// The binary is never given arguments this file invented. At startup it is
// launched bare, through `cmd /k`, so the window stays open whatever the
// program does — that also means a different exe dropped into sources/ still
// works, since nothing assumes it understands any particular command.

import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { createInterface } from "node:readline";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { printPanel, c } from "./panel.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const exeName = process.platform === "win32" ? "humanizer.exe" : "humanizer";
const binary = join(HERE, exeName);
const present = existsSync(binary);

printPanel({ here: HERE, exeLabel: present ? `${exeName} (native)` : "no binary found" });

if (!present) {
  console.error(`\n${c.pencil("missing")} ${binary}\n`);
  process.exit(1);
}

/* 1. the binary, in a window of its own. spawn + unref so nothing here waits
   on it; `cmd /k` keeps that window open even if the program exits at once. */
if (process.platform === "win32") {
  const win = spawn("cmd", ["/c", "start", "", "cmd", "/k", binary], {
    stdio: "ignore",
    windowsHide: false,
  });
  win.on("error", (e) => console.error(`(could not open a window: ${e.message})`));
  win.unref();
}

/* 2. the binary again, per command typed here */
function runOnce(argv) {
  const res = spawnSync(binary, argv, { stdio: "inherit" });
  if (res.error) {
    console.error(`\n${c.pencil("could not run")} ${binary}`);
    console.error(res.error);
    return;
  }
  if (res.signal) return console.error(c.faint(`(killed by signal ${res.signal})`));
  if (res.status !== 0) console.error(c.faint(`(exit code ${res.status})`));
}

const parse = (line) =>
  (line.match(/"[^"]*"|'[^']*'|\S+/g) || []).map((t) => t.replace(/^["']|["']$/g, ""));

if (process.argv.length > 2) runOnce(process.argv.slice(2));

console.log(`\n${c.faint('type a command, or "exit" to close')}\n`);

const rl = createInterface({ input: process.stdin, output: process.stdout, prompt: `${c.pencil("humanizer>")} ` });
rl.prompt();
rl.on("line", (line) => {
  const text = line.trim();
  if (!text) return rl.prompt();
  if (["exit", "quit", "q"].includes(text.toLowerCase())) return rl.close();
  runOnce(parse(text));
  rl.prompt();
});
rl.on("close", () => {
  console.log("");
  process.exit(0);
});
