<h1 align="center">wrap-it-up</h1>

<p align="center">
  A context-engineering <code>/wrap-it-up</code> command for Claude Code: a plain-markdown,<br/>
  per-repo brain that closes the loop between sessions.
</p>

---

## The problem

Every new Claude Code session starts from zero. You re-explain your stack, your decisions, the
bug you already fixed last week - by the end of a sprint, you've told it the same thing twenty
times. That's not a prompting problem, it's a **context engineering** problem: what's actually in
the model's context window, and when.

Most "AI memory" tools answer that with a vector database you have to trust. `wrap-it-up` answers
it with plain markdown files, scoped to the repo you're in, that you can `cat`, `grep`, and
`git diff` like anything else.

## What it actually is

- **`wrap-it-up init`** - sets up `.claude-brain/` in the current repo (gitignored automatically).
- **`/wrap-it-up`** - at the end of a session, reconstructs what happened and files it into the
  brain: decisions, lessons, action items, and a short `hot.md` bridge for next time.
- **A `SessionStart` hook** - auto-loads that brain back into context the next time a session
  starts in this repo. No re-explaining.

Two-sided, not just retrieval: most memory tools only load context in. This one also curates what
goes *out*, at the moment it's cheapest to capture - right when the session ends, while it's still
fresh.

## Why the structure is the actual product

- **Decisions** - an ADR log. Evergreen, high signal, rarely needs revisiting.
- **Lessons** - the gotchas that cost real debugging time once. Highest ROI line in the whole
  system: rediscovering a bug costs more than the one line it takes to write it down.
- **Action items** - explicitly short-lived. Not every piece of context deserves the same
  lifespan, and this system doesn't pretend otherwise.
- **Wiki** - durable concepts get promoted out of the daily log into their own page. Most of a
  session is noise; only what's worth keeping graduates.
- **`hot.md`** - a compressed ~500-word rolling bridge, refreshed by every `/wrap-it-up`, loaded
  first at the next session's start. The full log is there if you need it, but you don't reload it
  every time - that's the actual context-engineering move: compress for the common case, keep the
  detail for when you need it.

It's honest by design: if a session produced nothing durable, `/wrap-it-up` says so and still
refreshes `hot.md` - it never fabricates decisions to look productive. That matters here
specifically, because this output becomes tomorrow's input; a padded log degrades every session
after it.

## Install

**macOS/Linux:**
```bash
curl -fsSL https://raw.githubusercontent.com/thisismairaj/wrap-it-up/main/install.sh | bash
```

**Windows (PowerShell):**
```powershell
irm https://raw.githubusercontent.com/thisismairaj/wrap-it-up/main/install.ps1 | iex
```

This installs the `wrap-it-up` CLI globally via npm, drops the `/wrap-it-up` command into
`~/.claude/commands/`, and registers the `SessionStart` hook in `~/.claude/settings.json` -
merged in alongside whatever's already there, nothing else touched. Idempotent, safe to re-run.
**Open a new terminal afterward** so `PATH` picks up the new npm global bin.

## Usage

```bash
cd your-repo
wrap-it-up init          # sets up .claude-brain/, adds it to .gitignore
```

Then just work normally. At the end of a session, inside Claude Code:

```
/wrap-it-up
```

That's it - no flags, no arguments. The command reconstructs the session itself and writes
everything into `.claude-brain/`.

## The CLI underneath

`/wrap-it-up` is a prompt that calls this CLI for the mechanical parts - the LLM only does the
part that actually needs reasoning (deciding what happened and what's worth keeping):

```bash
wrap-it-up init                 # set up .claude-brain/ in the current repo
wrap-it-up log <section>        # append stdin as an entry to today's log
                                 # (section: Decisions | Lessons | "Action items" | "Wiki touched" | Notes)
wrap-it-up wiki <slug>          # create/update a wiki page from stdin
wrap-it-up hot                  # overwrite hot.md from stdin
wrap-it-up session-start        # SessionStart hook entry point (reads hook JSON on stdin)
wrap-it-up status               # show this repo's brain state
```

Every multi-word command reads its body from **stdin**, never a quoted argument. Windows
PowerShell 5.1 silently strips embedded quotes before handing them to a native `.exe` - the same
gotcha documented in [logcli-shortcuts](https://github.com/thisismairaj/logcli-shortcuts) - so
this CLI sidesteps the whole class of bug instead of working around it per-shell.

## What it doesn't do

- No vector embeddings, no semantic search - it's `grep`-able markdown, on purpose.
- No cross-repo memory - `.claude-brain/` is scoped to one repo. If you need something to
  generalize across projects, that belongs in Claude Code's own cross-session memory, not here.
- Doesn't touch anything outside `.claude-brain/` and the one `SessionStart` hook entry it adds.

## Development

```bash
npm install
npm run build    # compiles src/ -> dist/
```

`dist/` is committed, same reason [ayat-of-the-day](https://github.com/thisismairaj/ayat-of-the-day)
and [claude-pray](https://github.com/utkudarilmaz/claude-pray) commit their own `dist/`:
`npm install -g github:thisismairaj/wrap-it-up` works straight off the repo, no build step
required of the person installing it.

## License

MIT
