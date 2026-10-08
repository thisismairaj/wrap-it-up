import * as fs from 'node:fs'
import * as path from 'node:path'
import { readHot } from './hot.js'

// Composes the context block injected at session start: the stable
// index.md overview, plus whichever bridge is cheapest/freshest - hot.md
// (the compressed rolling summary /wrap-it-up refreshes) if one exists,
// falling back to the single most recent raw log otherwise. Returns null
// if there's no brain for this project at all - the hook should then stay
// completely silent.
export function composeContext(brainDir: string, projectName: string): string | null {
  if (!fs.existsSync(brainDir)) return null

  const indexPath = path.join(brainDir, 'index.md')
  const indexContent = fs.existsSync(indexPath) ? fs.readFileSync(indexPath, 'utf8') : ''

  let bridge = readHot(brainDir)
  let bridgeLabel = 'hot.md (context bridge from the last /wrap-it-up)'

  if (!bridge) {
    const logsDir = path.join(brainDir, 'logs')
    if (fs.existsSync(logsDir)) {
      const files = fs
        .readdirSync(logsDir)
        .filter((f) => f.endsWith('.md'))
        .sort()
        .reverse()
      if (files.length > 0) {
        bridge = fs.readFileSync(path.join(logsDir, files[0]), 'utf8')
        bridgeLabel = 'most recent raw session log (no hot.md yet - run /wrap-it-up to generate one)'
      }
    }
  }

  let out = `Local brain for project "${projectName}" (${brainDir}/index.md - read this before assuming prior state, and update it via wrap-it-up when something durable changes):\n\n${indexContent.trim()}`

  if (bridge) {
    out += `\n\n---\n\n${bridgeLabel}:\n\n${bridge}`
  }

  return out
}
