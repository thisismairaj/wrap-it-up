#!/usr/bin/env node
// Runs automatically after `npm install -g wrap-it-up-cli`, so that's the
// ENTIRE install - no separate install.sh/install.ps1 steps required. Drops
// the /wrap-it-up command into ~/.claude/commands/ and registers the
// SessionStart hook in ~/.claude/settings.json, merged in alongside
// whatever's already there. Only runs for a global install - a plain local
// `npm install` (e.g. a contributor working on this repo) shouldn't modify
// the developer's real ~/.claude/ config as a side effect.
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
const HOOK_COMMAND = 'wrap-it-up session-start';
function log(msg) {
    console.log(`wrap-it-up: ${msg}`);
}
function installCommand() {
    const scriptDir = path.dirname(fileURLToPath(import.meta.url));
    const packageRoot = path.resolve(scriptDir, '..', '..'); // dist/scripts -> dist -> package root
    const src = path.join(packageRoot, 'command', 'wrap-it-up.md');
    const commandsDir = path.join(os.homedir(), '.claude', 'commands');
    const dest = path.join(commandsDir, 'wrap-it-up.md');
    if (!fs.existsSync(src)) {
        log(`command template missing at ${src} - skipping (unexpected for a real install).`);
        return;
    }
    fs.mkdirSync(commandsDir, { recursive: true });
    fs.copyFileSync(src, dest);
    log(`installed the /wrap-it-up command -> ${dest}`);
}
function registerHook() {
    const settingsPath = process.env.WRAP_IT_UP_SETTINGS_PATH_OVERRIDE || path.join(os.homedir(), '.claude', 'settings.json');
    fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
    let settings = {};
    if (fs.existsSync(settingsPath)) {
        const raw = fs.readFileSync(settingsPath, 'utf8').trim();
        if (raw.length > 0) {
            try {
                settings = JSON.parse(raw);
            }
            catch {
                log(`${settingsPath} exists but isn't valid JSON - not touching it. Add this hook manually if you want auto-loaded context:`);
                log(`  { "type": "command", "command": "${HOOK_COMMAND}" }`);
                return;
            }
        }
    }
    settings.hooks = settings.hooks || {};
    settings.hooks.SessionStart = settings.hooks.SessionStart || [];
    const alreadyRegistered = settings.hooks.SessionStart.some((entry) => (entry.hooks || []).some((h) => h.type === 'command' && h.command === HOOK_COMMAND));
    if (alreadyRegistered) {
        log('SessionStart hook already registered.');
        return;
    }
    settings.hooks.SessionStart.push({
        matcher: '',
        hooks: [{ type: 'command', command: HOOK_COMMAND }],
    });
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n', 'utf8');
    log(`registered the SessionStart hook in ${settingsPath}`);
}
function main() {
    if (process.env.npm_config_global !== 'true') {
        return; // local install (e.g. a contributor's `npm install`) - don't touch ~/.claude/
    }
    try {
        installCommand();
        registerHook();
        log('setup complete - try "wrap-it-up init" in any repo, or /wrap-it-up at the end of a Claude Code session.');
    }
    catch (e) {
        log(`setup step failed (${e.message}) - the CLI itself still works; see install.sh/install.ps1 for a manual fallback.`);
    }
}
main();
