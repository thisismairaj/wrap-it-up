#!/usr/bin/env node
import { findRepoRoot, getBrainDir } from '../lib/paths.js'
import { ensureBrain } from '../lib/scaffold.js'
import { appendToSection, isLogSection, LOG_SECTIONS, todayLogPath } from '../lib/log.js'
import { upsertWikiPage, isValidSlug } from '../lib/wiki.js'
import { addWikiLinkToIndex } from '../lib/indexPage.js'
import { writeHot, hotPath } from '../lib/hot.js'
import { composeContext } from '../lib/sessionContext.js'
import * as fs from 'node:fs'
import * as path from 'node:path'

// All multi-word content (log entries, wiki bodies, hot.md content) comes
// in on stdin, never as a quoted argv argument - PowerShell 5.1 silently
// strips embedded quotes before a native exe ever sees them (same gotcha
// documented in logcli-shortcuts), so stdin-first sidesteps the whole class
// of bug instead of working around it per-shell.
function readStdin(): string {
  try {
    return fs.readFileSync(0, 'utf8')
  } catch {
    return ''
  }
}

function fail(msg: string): never {
  process.stderr.write(`${msg}\n`)
  process.exit(1)
}

// Auto-creates the brain if it doesn't exist yet, rather than requiring a
// separate `wrap-it-up init` step first - init is just idempotent folder
// setup, so there's no real reason to make it a precondition. `init` still
// exists as its own command for anyone who wants to set the gitignore entry
// up ahead of time without writing anything.
function requireBrain(): { repoRoot: string; brainDir: string } {
  const repoRoot = findRepoRoot(process.cwd())
  if (!repoRoot) fail('Not inside a git repo - wrap-it-up only makes sense scoped to one.')
  const { brainDir } = ensureBrain(repoRoot!)
  return { repoRoot: repoRoot!, brainDir }
}

function main(): void {
  const [, , cmd, ...args] = process.argv

  switch (cmd) {
    case 'init': {
      const repoRoot = findRepoRoot(process.cwd())
      if (!repoRoot) fail('Not inside a git repo - wrap-it-up only makes sense scoped to one.')
      const { brainDir, created } = ensureBrain(repoRoot!)
      console.log(created ? `Created ${brainDir}` : `${brainDir} already set up`)
      return
    }

    case 'log': {
      const section = args[0]
      if (!section || !isLogSection(section)) {
        fail(`Usage: wrap-it-up log <section>\nSection must be one of: ${LOG_SECTIONS.join(', ')}\nEntry text is read from stdin.`)
      }
      const entry = readStdin().trim()
      if (!entry) fail('No entry text on stdin.')
      const { brainDir } = requireBrain()
      const logPath = appendToSection(brainDir, section as any, entry)
      console.log(`Appended to ${logPath}`)
      return
    }

    case 'wiki': {
      const slug = args[0]
      if (!slug || !isValidSlug(slug)) {
        fail('Usage: wrap-it-up wiki <kebab-case-slug>\nPage body is read from stdin.')
      }
      const body = readStdin()
      if (!body.trim()) fail('No page body on stdin.')
      const { brainDir } = requireBrain()
      const { path: pagePath, isNew } = upsertWikiPage(brainDir, slug, body)
      if (isNew) {
        const firstLine = body.split('\n').find((l) => l.trim().length > 0) || slug
        const description = firstLine.replace(/^#+\s*/, '').slice(0, 120)
        addWikiLinkToIndex(brainDir, slug, description)
      }
      console.log(`${isNew ? 'Created' : 'Updated'} ${pagePath}`)
      return
    }

    case 'hot': {
      const content = readStdin()
      if (!content.trim()) fail('No content on stdin.')
      const { brainDir } = requireBrain()
      const p = writeHot(brainDir, content)
      console.log(`Refreshed ${p}`)
      return
    }

    case 'session-start': {
      // Hook entry point: reads the SessionStart hook's JSON payload from
      // stdin, emits hookSpecificOutput JSON on success, or prints nothing
      // and exits 0 if there's no brain for this project - silent no-op,
      // never blocks or clutters a session that isn't opted in.
      const input = readStdin()
      let cwd = process.cwd()
      try {
        const parsed = JSON.parse(input)
        if (parsed && typeof parsed.cwd === 'string') cwd = parsed.cwd
      } catch {
        // malformed/empty stdin - fall back to process.cwd()
      }

      const repoRoot = findRepoRoot(cwd)
      if (!repoRoot) return // not a git repo at all - nothing to do

      const brainDir = getBrainDir(repoRoot)
      const projectName = path.basename(repoRoot)
      const context = composeContext(brainDir, projectName)
      if (!context) return // no brain for this project - silent no-op

      process.stdout.write(
        JSON.stringify({
          hookSpecificOutput: {
            hookEventName: 'SessionStart',
            additionalContext: context,
          },
        })
      )
      return
    }

    case 'status': {
      const repoRoot = findRepoRoot(process.cwd())
      if (!repoRoot) fail('Not inside a git repo.')
      const brainDir = getBrainDir(repoRoot!)
      if (!fs.existsSync(brainDir)) {
        console.log(`No brain at ${brainDir}`)
        return
      }
      const wikiDir = path.join(brainDir, 'wiki')
      const logsDir = path.join(brainDir, 'logs')
      const wikiCount = fs.existsSync(wikiDir) ? fs.readdirSync(wikiDir).filter((f) => f.endsWith('.md')).length : 0
      const logCount = fs.existsSync(logsDir) ? fs.readdirSync(logsDir).filter((f) => f.endsWith('.md')).length : 0
      const hasHot = fs.existsSync(hotPath(brainDir))
      console.log(`${brainDir}`)
      console.log(`  wiki pages: ${wikiCount}`)
      console.log(`  logs: ${logCount}`)
      console.log(`  hot.md: ${hasHot ? 'present' : 'not yet - run /wrap-it-up'}`)
      console.log(`  today's log: ${todayLogPath(brainDir)}`)
      return
    }

    case '--help':
    case '-h':
    case undefined:
      console.log(`wrap-it-up - a per-repo context-engineering brain for Claude Code

Usage:
  wrap-it-up init                 Set up .claude-brain/ in the current repo
  wrap-it-up log <section>        Append stdin as an entry to today's log
                                   (section: ${LOG_SECTIONS.join(' | ')})
  wrap-it-up wiki <slug>          Create/update a wiki page from stdin
  wrap-it-up hot                  Overwrite hot.md from stdin
  wrap-it-up session-start        SessionStart hook entry point (reads hook JSON on stdin)
  wrap-it-up status               Show this repo's brain state
`)
      return

    default:
      fail(`Unknown command: ${cmd}\nRun "wrap-it-up --help" for usage.`)
  }
}

main()
