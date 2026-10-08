import * as fs from 'node:fs';
import * as path from 'node:path';
const SECTION_HEADING = '## Wiki pages in this brain';
// Idempotent: adds a `- [slug](wiki/slug.md) - description` line under the
// "Wiki pages in this brain" section of index.md, unless a line for that
// slug is already there. Creates the section (and a minimal index.md) if
// neither exists yet, rather than assuming `ensureBrain` already ran.
export function addWikiLinkToIndex(brainDir, slug, description) {
    const indexPath = path.join(brainDir, 'index.md');
    const linkText = `wiki/${slug}.md`;
    const line = `- [\`${slug}.md\`](${linkText}) - ${description}`;
    let content = fs.existsSync(indexPath) ? fs.readFileSync(indexPath, 'utf8') : `# ${path.basename(path.dirname(brainDir))}\n`;
    if (content.includes(linkText))
        return; // already linked, nothing to do
    if (!content.includes(SECTION_HEADING)) {
        content = `${content.trimEnd()}\n\n${SECTION_HEADING}\n\n${line}\n`;
    }
    else {
        const headingIdx = content.indexOf(SECTION_HEADING);
        const afterHeadingIdx = headingIdx + SECTION_HEADING.length;
        const rest = content.slice(afterHeadingIdx);
        const nextHeadingMatch = rest.match(/\n## /);
        const insertAt = nextHeadingMatch
            ? afterHeadingIdx + nextHeadingMatch.index + 1
            : content.length;
        const before = content.slice(0, insertAt).replace(/\s*$/, '\n');
        const after = content.slice(insertAt);
        content = `${before}${line}\n\n${after}`.replace(/\n{3,}/g, '\n\n');
    }
    fs.mkdirSync(path.dirname(indexPath), { recursive: true });
    fs.writeFileSync(indexPath, content, 'utf8');
}
