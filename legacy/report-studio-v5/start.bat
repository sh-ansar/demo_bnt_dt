@echo off
start "BNT Report Studio" cmd /c "python -m http.server 8080"
timeout /t 1 >nul
start http://localhost:8080
