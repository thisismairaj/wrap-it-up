import * as fs from 'node:fs'
import * as path from 'node:path'

export function hotPath(brainDir: string): string {
  return path.join(brainDir, 'hot.md')
}

export function writeHot(brainDir: string, content: string): string {
  const p = hotPath(brainDir)
  fs.writeFileSync(p, content.endsWith('\n') ? content : `${content}\n`, 'utf8')
  return p
}

export function readHot(brainDir: string): string | null {
  const p = hotPath(brainDir)
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null
}
