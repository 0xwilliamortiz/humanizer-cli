// The panel: printed by Node, always the same, regardless of what binary is
// in this folder. It reads SKILL.md for its facts (version, pattern count,
// where the file came from) but never asks the binary anything.
//
// Colours match the binary's own palette, so the panel and the output of the
// commands below it look like one piece.

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const paint = (code) => (s) => (useColor ? `\x1b[${code}m${s}\x1b[0m` : String(s));

export const c = {
  bold: paint("1"),
  dim: paint("38;5;245"),
  faint: paint("38;5;240"),
  pencil: paint("38;5;174"),
  ok: paint("38;5;108"),
};

function loadSkill(here, explicitPath) {
  const tries = explicitPath
    ? [explicitPath]
    : [join(process.cwd(), "SKILL.md"), join(here, "SKILL.md"), join(here, "..", "SKILL.md")];
  for (const path of tries) {
    if (existsSync(path)) return { text: readFileSync(path, "utf8"), from: path };
  }
  return { text: "", from: "SKILL.md (not found)" };
}

function parseVersionAndCount(text) {
  const fm = text.match(/^---\n([\s\S]*?)\n---\n/);
  const version = fm ? (fm[1].match(/version:\s*["']?([^"'\n]+)/) || [, "?"])[1].trim() : "?";
  const count = (text.match(/^### \d+\.\s+/gm) || []).length;
  return { version, count };
}

const COMMANDS = [
  ["patterns", "list every pattern, by group"],
  ["show <n>", "one pattern in full, with before/after"],
  ["search <term>", "find patterns by keyword"],
  ["check <file>", "scan a draft for the mechanical tells"],
  ["prompt [file]", "print the prompt to paste into any chat"],
  ["install", "how to load the skill into an agent"],
  ["doctor", "what is running and where the skill came from"],
];

export function printPanel({ here, exeLabel, skillPath }) {
  const { text, from } = loadSkill(here, skillPath);
  const { version, count } = parseVersionAndCount(text);
  const width = Math.min(process.stdout.columns || 80, 76);
  const rule = "─".repeat(Math.max(20, width - 2));

  console.log(`  ${c.bold("humanizer")} ${c.dim(version)}`);
  console.log(`  ${c.faint(rule)}`);
  console.log(c.dim(`  ${count} patterns of AI writing, in 5 groups, taken from`));
  console.log(c.dim(`  Wikipedia's "Signs of AI writing" guide.`));
  console.log("");
  for (const [name, description] of COMMANDS) {
    console.log(`  ${c.pencil(name.padEnd(18))}${c.dim(description)}`);
  }
  console.log("");
  console.log(`  ${c.faint(from)}`);
  console.log(`  ${c.faint(`running on ${exeLabel}`)}`);
}
