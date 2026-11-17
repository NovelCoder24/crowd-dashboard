<#
.SYNOPSIS
    CrowdFlow / Drishti-Safe All-in-One Service Launcher (PowerShell)
.DESCRIPTION
    Launches Backend, AI Edge Engine (Video or Simulation), and Frontend concurrently.
.PARAMETER Mode
    Execution mode for AI Edge: "Simulate" (default, zero-camera required) or "Video".
.PARAMETER Source
    Video file path or camera index (default: "3.mp4" when Mode is Video).
.PARAMETER NoBrowser
    If specified, suppresses auto-opening the browser.
#>
param(
    [ValidateSet("Simulate", "Video")]
    [string]$Mode = "Simulate",
    [string]$Source = "3.mp4",
    [switch]$NoBrowser
)

$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "   DRISHTI-SAFE : CROWDFLOW TACTICAL COMMAND CENTER LAUNCHER" -ForegroundColor Yellow
Write-Host "   Real-Time Stampede Prevention & Crowd Bottleneck Intelligence" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

# Verify Node
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Node.js is required but was not found in PATH." -ForegroundColor Red
    exit 1
}

# Determine Python binary
$pythonBin = "python"
$venvPython = Join-Path $Root "ai\venv\Scripts\python.exe"
if (Test-Path $venvPython) {
    $pythonBin = $venvPython
    Write-Host "[INFO] Using virtual environment Python at: $venvPython" -ForegroundColor Green
} else {
    if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
        Write-Host "[WARNING] Python not found in PATH. AI module might fail to launch." -ForegroundColor Yellow
    }
}

# 1. Start Backend
Write-Host "[1/3] Launching Backend API & SSE/Pusher Gateway on port 3000..." -ForegroundColor Magenta
Start-Process cmd.exe -ArgumentList "/k cd /d `"$Root\backend`" && node index.js" -WindowStyle Normal

Start-Sleep -Seconds 2

# 2. Start AI Edge Node
if ($Mode -eq "Simulate") {
    Write-Host "[2/3] Launching AI Edge Engine in Synthetic Simulation Mode (--simulate)..." -ForegroundColor Magenta
    $aiArgs = "/k cd /d `"$Root\ai`" && `"$pythonBin`" main.py --simulate"
} else {
    Write-Host "[2/3] Launching AI Edge Engine in Video Inference Mode (--source `"$Source`")..." -ForegroundColor Magenta
    $aiArgs = "/k cd /d `"$Root\ai`" && `"$pythonBin`" main.py --source `"$Source`""
}
Start-Process cmd.exe -ArgumentList $aiArgs -WindowStyle Normal

Start-Sleep -Seconds 2

# 3. Start Frontend
Write-Host "[3/3] Launching Frontend Command Center UI on port 5173..." -ForegroundColor Magenta
Start-Process cmd.exe -ArgumentList "/k cd /d `"$Root\frontend`" && npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "======================================================================" -ForegroundColor Green
Write-Host " [SUCCESS] All CrowdFlow services have been dispatched successfully!" -ForegroundColor Green
Write-Host "   - Command Center UI:  http://localhost:5173" -ForegroundColor White
Write-Host "   - Backend Ingestion:  http://localhost:3000" -ForegroundColor White
Write-Host "   - Stream / SSE Feed:  http://localhost:3000/api/stream" -ForegroundColor White
Write-Host "======================================================================" -ForegroundColor Green
Write-Host ""

if (-not $NoBrowser) {
    Write-Host "Opening Command Center in browser..." -ForegroundColor Gray
    Start-Sleep -Seconds 2
    Start-Process "http://localhost:5173"
}
