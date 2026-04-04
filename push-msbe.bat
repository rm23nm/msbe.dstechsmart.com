@echo off
title Sinkronisasi ke Staging (msbe.dstechsmart.com)
color 0B
echo ==============================================
echo   Sinkronisasi ke REPOSITORY UJI COBA (MSBE)
echo ==============================================
echo.

cd /d "%~dp0"

:: Cek apakah command git dikenali
SET GIT_CMD=git
git --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    SET GIT_CMD="C:\Program Files\Git\cmd\git.exe"
)

echo [1/3] Menambahkan file ke antrean...
%GIT_CMD% add .

echo [2/3] Menyimpan rekaman perubahan...
set mytimestamp=%date% %time:~0,8%
%GIT_CMD% commit -m "STAGING UPDATE: %mytimestamp%"

echo [3/3] Mengunggah file ke msbe.dstechsmart.com...
%GIT_CMD% push staging main
IF %ERRORLEVEL% NEQ 0 GOTO error

echo.
echo ==============================================
echo      SINKRONISASI MSBE BERHASIL!        
echo ==============================================
echo Silakan cek di: https://github.com/rm23nm/msbe.dstechsmart.com
echo.
pause
exit

:error
echo.
echo ==============================================
echo    GAGAL PUSH KE MSBE!
echo ==============================================
echo Pastikan koneksi internet jalan atau coba login git kembali.
echo.
pause
exit
