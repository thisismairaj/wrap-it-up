import { execFileSync } from 'node:child_process'
import * as path from 'node:path'

export const BRAIN_DIR_NAME = '.claude-brain'

// Walks up from `cwd` to the enclosing git repo's root, the same way `git`
// itself resolves it (handles worktrees, since this shells out to git
// rather than hand-rolling a .git-folder walk). Returns null if `cwd` isn't
// inside a git repo at all - the brain only makes sense scoped to a repo.
export function findRepoRoot(cwd: string): string | null {
  try {
    const out = execFileSync('git', ['-C', cwd, 'rev-parse', '--show-toplevel'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
    return out.trim()
  } catch {
    return null
  }
}

export function getBrainDir(repoRoot: string): string {
  return path.join(repoRoot, BRAIN_DIR_NAME)
}
