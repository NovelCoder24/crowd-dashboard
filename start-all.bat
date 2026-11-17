@echo off
setlocal enabledelayedexpansion
title CrowdFlow - Drishti-Safe All-in-One Launcher

echo ======================================================================
echo    DRISHTI-SAFE : CROWDFLOW TACTICAL COMMAND CENTER LAUNCHER
echo    Real-time Stampede Hazard Detection ^& Crowd Analytics
echo ======================================================================
echo.

:: Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not found in PATH. Please install Node.js (v18+).
    pause
    exit /b 1
)

:: Check Python
set PYTHON_BIN=python
if exist "%~dp0ai\venv\Scripts\python.exe" (
    set PYTHON_BIN="%~dp0ai\venv\Scripts\python.exe"
    echo [INFO] Detected dedicated Python virtual environment at ai\venv
) else (
    where python >nul 2>nul
    if %ERRORLEVEL% NEQ 0 (
        echo [WARNING] Python not found in PATH. AI Edge inference may not start.
    )
)

echo.
echo [1/3] Starting Backend API ^& Telemetry Gateway (port 3000)...
start "CrowdFlow - Backend Server" cmd /k "cd /d "%~dp0backend" && node index.js"

:: Give backend a second to bind
timeout /t 2 /nobreak >nul

echo [2/3] Starting AI Vision Engine (Synthetic Simulation mode)...
echo       (Tip: to run live video feed, run: cd ai ^&^& python main.py --source 3.mp4)
if "%1"=="" (
    start "CrowdFlow - AI Edge Engine" cmd /k "cd /d "%~dp0ai" && !PYTHON_BIN! main.py --simulate"
) else (
    start "CrowdFlow - AI Edge Engine" cmd /k "cd /d "%~dp0ai" && !PYTHON_BIN! main.py %*"
)

timeout /t 2 /nobreak >nul

echo [3/3] Starting Frontend Command Center UI (port 5173)...
start "CrowdFlow - Frontend Client" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ======================================================================
echo [SUCCESS] All CrowdFlow services launched successfully!
echo.
echo   - Frontend UI:  http://localhost:5173
echo   - Backend API:  http://localhost:3000
echo   - AI Telemetry: Stream / Simulation active
echo ======================================================================
echo Opening dashboard in your default browser in 3 seconds...
timeout /t 3 /nobreak >nul
start http://localhost:5173

echo.
echo Press any key to exit this launcher window (services will stay running in their windows)...
pause >nul
