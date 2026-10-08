#!/usr/bin/env node
// Idempotently registers the wrap-it-up SessionStart hook in the user's
// global ~/.claude/settings.json, without clobbering anything already
// there - reads the existing file, appends only if an entry with this
// exact command doesn't already exist, writes back. Run by install.sh /
// install.ps1, not meant to be run standalone.
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

const HOOK_COMMAND = 'wrap-it-up session-start'
// WRAP_IT_UP_SETTINGS_PATH_OVERRIDE exists only so this script is testable
// in isolation (os.homedir() ignores $HOME on Windows, so a test can't
// sandbox it that way) - not a real user-facing setting.
const settingsPath =
  process.env.WRAP_IT_UP_SETTINGS_PATH_OVERRIDE || path.join(os.homedir(), '.claude', 'settings.json')

fs.mkdirSync(path.dirname(settingsPath), { recursive: true })

let settings = {}
if (fs.existsSync(settingsPath)) {
  const raw = fs.readFileSync(settingsPath, 'utf8').trim()
  if (raw.length > 0) {
    try {
      settings = JSON.parse(raw)
    } catch (e) {
      console.error(`${settingsPath} exists but isn't valid JSON - not touching it. Add the SessionStart hook manually:`)
      console.error(`  { "type": "command", "command": "${HOOK_COMMAND}" }`)
      process.exit(1)
    }
  }
}

settings.hooks = settings.hooks || {}
settings.hooks.SessionStart = settings.hooks.SessionStart || []

const alreadyRegistered = settings.hooks.SessionStart.some((entry) =>
  (entry.hooks || []).some((h) => h.type === 'command' && h.command === HOOK_COMMAND)
)

if (alreadyRegistered) {
  console.log('SessionStart hook already registered - nothing to do.')
  process.exit(0)
}

settings.hooks.SessionStart.push({
  matcher: '',
  hooks: [{ type: 'command', command: HOOK_COMMAND }],
})

fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n', 'utf8')
console.log(`Registered the SessionStart hook in ${settingsPath}`)
