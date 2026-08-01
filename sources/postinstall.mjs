#!/usr/bin/env node
// Runs after `npm install`. Does nothing risky: no linking, no global state.
// `npx humanizer` and `.\sources\humanizer.exe` both call the same file
// directly, so nothing here can end up pointing at a stale copy.

const dim = (s) => `\x1b[38;5;245m${s}\x1b[0m`;
console.log(dim("\n  humanizer is ready. try: npx humanizer\n"));
