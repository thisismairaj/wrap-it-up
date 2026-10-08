---
description: Wrap the local-repo brain session - capture what happened into today's log, promote durables to the wiki, refresh hot.md so the next session starts with zero recap.
---
You are wrapping up the current session against this repo's `.claude-brain/` (if one doesn't
exist yet, tell the user to run `wrap-it-up init` first, and stop). The goal: leave everything
documented well enough that the next session - yours or the user's - can pick up cold with **zero
recap**.

All of the `wrap-it-up` CLI's write commands read their body from **stdin**, not an argument - use
a heredoc or a piped `printf`/`echo`, never a quoted inline argument (quoting breaks differently
across shells, especially PowerShell 5.1).

Do, in order:

1. **Reconstruct the session first.** Before writing anything, scan back over this session and
   list, concretely: what we did, what was **achieved** (shipped, verified, merged), what
   **remains** (in progress, not started), **open items & blockers**, **decisions** made,
   **lessons** learned, and the **next concrete actions**. Get this right before writing anything
   below - it's the raw material for every other step. Be specific: names, paths, commits, real
   numbers - not a vague summary.

2. **Write today's log.** For each durable decision, run:
   ```
   wrap-it-up log Decisions <<'EOF'
   - **<what>** - <why>
   EOF
   ```
   Same pattern for `wrap-it-up log Lessons`, `wrap-it-up log "Action items"`, and
   `wrap-it-up log Notes` (use Notes for the session narrative - what we did / achieved / what
   remains / blockers, as a dated block). Each call appends one entry; call it once per entry, not
   once with everything crammed together.

3. **Promote durables to the wiki.** For each decision, lesson, or new concept that deserves its
   own page (not every session has one - don't force it), run:
   ```
   wrap-it-up wiki <kebab-case-slug> <<'EOF'
   # <Title>

   <body>
   EOF
   ```
   One concept per page. If the slug already exists, this updates it in place - edit, don't create
   a `-v2`. The index gets linked automatically the first time a slug is created; nothing else to
   do there.

4. **Refresh `hot.md`** - the ~500-word context bridge the SessionStart hook loads first next
   time:
   ```
   wrap-it-up hot <<'EOF'
   <what we did this session, what was achieved, open threads, decisions made, next concrete actions>
   EOF
   ```
   Someone reading only `hot.md` should be able to resume without reading the full log.

5. **Cross-session memory, if anything actually generalizes.** If the session produced a fact that
   should surface in *future, unrelated* repos - a standing preference, a hard-won gotcha that
   isn't specific to this one project - file it in whatever native cross-project memory system this
   Claude Code setup uses (if any), not in this repo's `.claude-brain/`. Skip this step entirely if
   nothing from this session generalizes beyond this project - most sessions won't have anything
   here.

6. **Report** exactly which commands you ran and which files changed - log, wiki pages (new vs.
   updated), `hot.md`.

Be honest: if the session produced nothing durable, say so plainly, still refresh `hot.md` with
something like "no durable changes this session; last real context: …", and stop. Never invent
decisions or fabricate wiki pages to look productive - an accurate "we didn't finish X, blocker is
Y" is worth more to the next session than a padded summary.
