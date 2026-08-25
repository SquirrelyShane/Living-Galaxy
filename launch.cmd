@echo off
rem Living Galaxy - one double-click from cold laptop to open cockpit (Windows).
rem
rem     launch.cmd                 server up (it makes its own certs) -> browser open
rem     set PORT=9000 & launch.cmd
rem     set GALAXY_PASS=... & launch.cmd     (unattended)
rem     set GALAXY_NAME=nexis & launch.cmd   (players join at nexis.local)
rem
rem Needs Node 18+ and NOTHING else: since v1.03.02 the server issues its own TLS
rem certificate in pure Node at boot (no openssl, no Git Bash - the old flow needed
rem both and failed half-way without them). Windows resolves .local names natively,
rem so players on the LAN join by name, never by IP.
setlocal enabledelayedexpansion
cd /d "%~dp0"

if "%PORT%"=="" set PORT=8765
if "%GALAXY_NAME%"=="" set GALAXY_NAME=galaxy

where node >nul 2>nul || (
    echo ERROR: node was not found. Install Node 18+ from nodejs.org and re-run.
    pause & exit /b 1
)

rem -- stop a galaxy a previous launch left running --------------------
rem A stale server holds the port and makes the new one die with "address in use".
powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | Where-Object { $_.CommandLine -like '*server\main.js*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }" >nul 2>nul

rem -- the vault passphrase --------------------------------------------
rem First ever run: whatever you type here BECOMES the vault passphrase - remember it.
rem Every later run must use that same one. (Forgotten? Delete the galaxy-data folder;
rem that resets the galaxy and loses accounts, banked credits and world history.)
if "%GALAXY_PASS%"=="" (
    set /p GALAXY_PASS=Vault passphrase:
)

rem -- lift off ----------------------------------------------------------
rem The server runs in its own window and SHOWS its words there (who joined, where
rem players connect) while also mirroring them to living-galaxy.log for diagnostics.
rem One caution about that window: clicking inside it puts Windows consoles into
rem text-selection mode (title becomes "Select ...") which can pause output - press
rem Esc in it if that happens. Close that window to stop the galaxy.
echo Starting the galaxy server...
del living-galaxy.log >nul 2>nul
start "Living Galaxy server" node server\main.js --port=%PORT% --name=%GALAXY_NAME% --logfile=living-galaxy.log

rem Ready means answering, not merely running. The server speaks https (it just made
rem its own certificate); probe http too so a plain run is still detected and reported.
set SCHEME=
for /l %%i in (1,1,30) do (
    if "!SCHEME!"=="" (
        timeout /t 1 /nobreak >nul
        curl -fsk --max-time 1 https://127.0.0.1:%PORT%/api/status >nul 2>nul && set SCHEME=https
        if "!SCHEME!"=="" curl -fs --max-time 1 http://127.0.0.1:%PORT%/api/status >nul 2>nul && set SCHEME=http
    )
)
if "%SCHEME%"=="" (
    echo.
    echo ERROR: the galaxy server did not become ready. Its own words:
    echo ----------------------------------------
    type living-galaxy.log 2>nul
    echo ----------------------------------------
    echo The two usual causes:
    echo   - wrong vault passphrase ^(must match the one from the very first run;
    echo     delete galaxy-data to reset - that wipes accounts and world history^)
    echo   - port %PORT% still in use ^(the log says so if so^)
    pause
    exit /b 1
)

start "" %SCHEME%://localhost:%PORT%/

echo.
echo ========================================
echo  Living Galaxy is up
echo ========================================
echo  Players join at:  %SCHEME%://%GALAXY_NAME%.local:%PORT%/
echo    (boot screen:   wss://%GALAXY_NAME%.local:%PORT%^)
echo  First https visit on each device: accept the certificate warning once.
echo  Log: living-galaxy.log
echo.
echo  The "Living Galaxy server" window shows who joins, live.
echo  Close that window to stop the galaxy.
echo ========================================
echo.
rem Stay open - this banner is the one with the address players need. Without the
rem pause, a double-clicked launcher prints it and vanishes in the same instant.
pause
endlocal
