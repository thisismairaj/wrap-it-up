import * as fs from 'node:fs'
import * as path from 'node:path'

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/

export function isValidSlug(slug: string): boolean {
  return SLUG_RE.test(slug)
}

// Writes the full page content (the caller - the /wrap-it-up prompt,
// reasoning about what happened this session - supplies the whole body
// each time, same as editing it directly would). Returns whether this was
// a brand-new page, so the caller knows whether to also update index.md.
export function upsertWikiPage(brainDir: string, slug: string, body: string): { path: string; isNew: boolean } {
  const wikiDir = path.join(brainDir, 'wiki')
  fs.mkdirSync(wikiDir, { recursive: true })
  const pagePath = path.join(wikiDir, `${slug}.md`)
  const isNew = !fs.existsSync(pagePath)
  fs.writeFileSync(pagePath, body.endsWith('\n') ? body : `${body}\n`, 'utf8')
  return { path: pagePath, isNew }
}
