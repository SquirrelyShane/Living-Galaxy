@echo off
rem Living Galaxy - install the Cloudflare Tunnel connector (Windows).
rem
rem     tunnel.cmd                      asks for the token, then installs
rem     tunnel.cmd eyJhIjoiNz...        token on the command line
rem     tunnel.cmd --uninstall          remove the service
rem     tunnel.cmd --status             is it installed and running?
rem
rem Installing a Windows service needs an ELEVATED shell. Cloudflare's dashboard hands
rem you a bare `cloudflared.exe service install <token>` line, and in an ordinary
rem PowerShell that dies with "Cannot establish a connection to the service control
rem manager: Access is denied" - which reads like a broken download rather than a
rem missing right-click. So this script checks for elevation and RE-LAUNCHES ITSELF
rem elevated (one UAC prompt) instead of failing at you.
setlocal enabledelayedexpansion
cd /d "%~dp0"

rem -- are we elevated? `net session` is the classic cheap probe: it needs admin. -----
net session >nul 2>nul
if errorlevel 1 (
    if "%~1"=="" (
        echo Paste the token from the Cloudflare dashboard's install command.
        echo   ^(the long eyJ... string - the command itself is not needed^)
        set /p TOKEN=Token:
    ) else (
        set TOKEN=%~1
    )
    echo.
    echo Not running as Administrator - asking Windows for elevation...
    rem Hand the token to the elevated copy of this same script.
    powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -ArgumentList '!TOKEN!' -Verb RunAs"
    echo A new Administrator window is doing the install. This one is done.
    timeout /t 4 >nul
    exit /b 0
)

rem -- from here on we ARE elevated ------------------------------------------------
where cloudflared >nul 2>nul
if errorlevel 1 (
    echo cloudflared is not on PATH.
    echo Install it first:  winget install --id Cloudflare.cloudflared
    echo   ^(or download cloudflared.exe from Cloudflare and put it beside this script^)
    pause & exit /b 1
)

if /i "%~1"=="--status" (
    sc query cloudflared
    echo.
    echo RUNNING = the tunnel is up. STOPPED = start it with: sc start cloudflared
    pause & exit /b 0
)

if /i "%~1"=="--uninstall" (
    cloudflared service uninstall
    echo Service removed. living-galaxy.com will stop resolving to this machine.
    pause & exit /b 0
)

set TOKEN=%~1
if "%TOKEN%"=="" set /p TOKEN=Token:
if "%TOKEN%"=="" (echo No token given. & pause & exit /b 1)

rem A previous half-install would make this one fail; clearing first is harmless.
cloudflared service uninstall >nul 2>nul

echo Installing the tunnel connector as a Windows service...
cloudflared service install %TOKEN%
if errorlevel 1 (
    echo.
    echo Install failed. Usual causes:
    echo   - the token was truncated when pasted ^(it is very long^)
    echo   - a connector is already installed: run  tunnel.cmd --uninstall  first
    pause & exit /b 1
)

echo.
echo ========================================
echo  Tunnel connector installed
echo ========================================
echo  It starts with Windows from now on - no need to run this again.
echo.
echo  Next, in the Cloudflare dashboard, the tunnel's Public Hostname must be:
echo    Domain:  living-galaxy.com     ^(subdomain empty^)
echo    Service: HTTPS  ^-^>  localhost:8765
echo    TLS:     "No TLS Verify" turned ON
echo.
echo  Then start the galaxy with launch.cmd and players can reach
echo    https://living-galaxy.com          ^(boot screen: wss://living-galaxy.com^)
echo ========================================
pause
endlocal