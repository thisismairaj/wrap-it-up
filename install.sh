#!/usr/bin/env bash
set -euo pipefail

echo "Installing wrap-it-up..."

if ! command -v node >/dev/null 2>&1; then
  echo "node is required (https://nodejs.org) - install it and re-run." >&2
  exit 1
fi

echo "Installing the wrap-it-up CLI globally via npm..."
# A tarball URL, not the "github:owner/repo" shorthand - that shorthand
# leaves a dangling symlink to a temp cache dir on some npm versions
# (reproduced on npm 11.19.0 / Node 24 on Windows), which breaks the
# install silently until the next `require()` fails.
npm install -g https://github.com/thisismairaj/wrap-it-up/archive/refs/heads/main.tar.gz

mkdir -p "$HOME/.claude/commands"
echo "Fetching the /wrap-it-up command..."
curl -fsSL https://raw.githubusercontent.com/thisismairaj/wrap-it-up/main/command/wrap-it-up.md \
  -o "$HOME/.claude/commands/wrap-it-up.md"

echo "Registering the SessionStart hook (merges into ~/.claude/settings.json, doesn't touch anything else there)..."
tmp_merge="$(mktemp)"
curl -fsSL https://raw.githubusercontent.com/thisismairaj/wrap-it-up/main/install/merge-hook.js -o "$tmp_merge"
node "$tmp_merge"
rm -f "$tmp_merge"

echo
echo "Done. In any git repo:"
echo "  wrap-it-up init      # sets up .claude-brain/ for this repo (gitignored)"
echo "  /wrap-it-up          # at the end of a session, inside Claude Code"
