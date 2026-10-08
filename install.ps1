Write-Host "Installing wrap-it-up..."

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "node is required (https://nodejs.org) - install it and re-run."
    exit 1
}

Write-Host "Installing the wrap-it-up CLI globally via npm..."
npm install -g github:thisismairaj/wrap-it-up
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
