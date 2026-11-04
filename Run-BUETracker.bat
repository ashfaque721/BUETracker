@echo off
title BUETracker - BUET Academic Suite
set ELECTRON_RUN_AS_NODE=

if exist "%~dp0release\win-unpacked\BUETracker.exe" (
    start "" "%~dp0release\win-unpacked\BUETracker.exe"
    exit
)

if exist "%~dp0release\BUETracker 1.0.0.exe" (
    start "" "%~dp0release\BUETracker 1.0.0.exe"
    exit
)

if exist "%~dp0release\BUETracker.exe" (
    start "" "%~dp0release\BUETracker.exe"
    exit
)

echo [ERROR] BUETracker executable not found in release folder!
pause
exit
