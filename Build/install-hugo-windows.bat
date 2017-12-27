@echo off >nul

cd /D %~dp0
cd ..
echo | set /p="Working directory: "
cd
powershell -Command "Invoke-Expression (New-Object net.webclient).downloadstring('https://get.scoop.sh')"
scoop update; scoop install ".Build\hugo-0.31.1.json"
pause
