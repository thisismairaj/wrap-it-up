import * as fs from 'node:fs';
import * as path from 'node:path';
import { BRAIN_DIR_NAME } from './paths.js';
const INDEX_SKELETON = (projectName) => `# ${projectName}

Local context for this repo. Keep this page short and current - it's loaded
at the start of every session along with \`hot.md\` (once one exists).

## What this project is

(fill this in - a sentence or two)

## Wiki pages in this brain
`;
// Idempotent: creates .claude-brain/{wiki,logs}/, a starter index.md if one
// doesn't exist yet, and makes sure .claude-brain/ is in the repo's root
// .gitignore (appending to an existing file, creating one if missing).
// Safe to call on every run - never overwrites an existing index.md.
export function ensureBrain(repoRoot) {
    const brainDir = path.join(repoRoot, BRAIN_DIR_NAME);
    const wikiDir = path.join(brainDir, 'wiki');
    const logsDir = path.join(brainDir, 'logs');
    const indexPath = path.join(brainDir, 'index.md');
    const alreadyExisted = fs.existsSync(brainDir);
    fs.mkdirSync(wikiDir, { recursive: true });
    fs.mkdirSync(logsDir, { recursive: true });
    if (!fs.existsSync(indexPath)) {
        const projectName = path.basename(repoRoot);
        fs.writeFileSync(indexPath, INDEX_SKELETON(projectName), 'utf8');
    }
    ensureGitignored(repoRoot);
    return { brainDir, created: !alreadyExisted };
}
function ensureGitignored(repoRoot) {
    const gitignorePath = path.join(repoRoot, '.gitignore');
    const entry = `${BRAIN_DIR_NAME}/`;
    if (!fs.existsSync(gitignorePath)) {
        fs.writeFileSync(gitignorePath, `${entry}\n`, 'utf8');
        return;
    }
    const content = fs.readFileSync(gitignorePath, 'utf8');
    const alreadyThere = content
        .split(/\r?\n/)
        .some((line) => line.trim() === entry || line.trim() === BRAIN_DIR_NAME);
    if (!alreadyThere) {
        const needsNewline = content.length > 0 && !content.endsWith('\n');
        fs.appendFileSync(gitignorePath, `${needsNewline ? '\n' : ''}${entry}\n`, 'utf8');
    }
}
