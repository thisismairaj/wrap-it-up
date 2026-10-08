import * as fs from 'node:fs'
import * as path from 'node:path'

// Fixed taxonomy, same order every log - different sections have genuinely
// different lifespans (Decisions/Lessons are evergreen, Action items rot
// fast), and keeping the order fixed is what makes every log in a vault
// scannable the same way.
export const LOG_SECTIONS = ['Decisions', 'Lessons', 'Action items', 'Wiki touched', 'Notes'] as const
export type LogSection = (typeof LOG_SECTIONS)[number]

export function isLogSection(s: string): s is LogSection {
  return (LOG_SECTIONS as readonly string[]).includes(s)
}

function todayStamp(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function skeleton(date: string): string {
  const sections = LOG_SECTIONS.map((s) => `## ${s}\n`).join('\n')
  return `# ${date}\n\n${sections}`
}

export function todayLogPath(brainDir: string): string {
  return path.join(brainDir, 'logs', `${todayStamp()}.md`)
}

// Appends `entry` under `## <section>` in today's log, creating the log
// (with the full section skeleton) first if it doesn't exist yet. Inserts
// right after the section heading, before whatever already followed it -
// so repeated calls accumulate entries under the same heading instead of
// clobbering each other.
export function appendToSection(brainDir: string, section: LogSection, entry: string): string {
  const logPath = todayLogPath(brainDir)

  if (!fs.existsSync(logPath)) {
    fs.mkdirSync(path.dirname(logPath), { recursive: true })
    fs.writeFileSync(logPath, skeleton(todayStamp()), 'utf8')
  }

  const content = fs.readFileSync(logPath, 'utf8')
  const heading = `## ${section}`
  const headingIdx = content.indexOf(heading)

  if (headingIdx === -1) {
    // Section header missing for some reason (hand-edited file) - append a
    // fresh one at the end rather than failing.
    const updated = `${content.trimEnd()}\n\n${heading}\n\n${entry.trim()}\n`
    fs.writeFileSync(logPath, updated, 'utf8')
    return logPath
  }

  const afterHeadingIdx = headingIdx + heading.length
  const rest = content.slice(afterHeadingIdx)
  const nextHeadingMatch = rest.match(/\n## /)
  const insertAt = nextHeadingMatch
    ? afterHeadingIdx + (nextHeadingMatch.index as number) + 1
    : content.length

  const before = content.slice(0, insertAt).replace(/\s*$/, '\n')
  const after = content.slice(insertAt)
  const updated = `${before}${entry.trim()}\n\n${after}`.replace(/\n{3,}/g, '\n\n')

  fs.writeFileSync(logPath, updated, 'utf8')
  return logPath
}
