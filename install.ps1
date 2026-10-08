Write-Host "Installing wrap-it-up..."

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "node is required (https://nodejs.org) - install it and re-run."
    exit 1
}

Write-Host "Installing the wrap-it-up CLI globally via npm..."
# A tarball URL, not the "github:owner/repo" shorthand - that shorthand
# leaves a dangling symlink to a temp cache dir on some npm versions
# (reproduced on npm 11.19.0 / Node 24 on Windows), which breaks the
# install silently until the next `require()` fails.
npm install -g https://github.com/thisismairaj/wrap-it-up/archive/refs/heads/main.tar.gz
if ($LASTEXITCODE -ne 0) {
    Write-Error "npm install failed - see output above."
    exit 1
}

$commandsDir = "$env:USERPROFILE\.claude\commands"
New-Item -ItemType Directory -Force -Path $commandsDir | Out-Null
Write-Host "Fetching the /wrap-it-up command..."
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/thisismairaj/wrap-it-up/main/command/wrap-it-up.md" `
    -OutFile "$commandsDir\wrap-it-up.md"

Write-Host "Registering the SessionStart hook (merges into ~/.claude/settings.json, doesn't touch anything else there)..."
$tmpMerge = [System.IO.Path]::GetTempFileName()
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/thisismairaj/wrap-it-up/main/install/merge-hook.js" -OutFile $tmpMerge
node $tmpMerge
Remove-Item $tmpMerge -Force

Write-Host ""
Write-Host "Done. In any git repo:"
Write-Host "  wrap-it-up init      # sets up .claude-brain/ for this repo (gitignored)"
Write-Host "  /wrap-it-up          # at the end of a session, inside Claude Code"
Write-Host ""
Write-Host "Open a new terminal afterward so PATH picks up the newly installed npm global bin."
