@echo off
title Sinkronisasi GitHub Masjidku Smart
color 0A
echo ==============================================
echo   Sinkronisasi Otomatis Masjidku Smart ke GitHub
echo ==============================================
echo.

cd /d "%~dp0"

:: Cek apakah command git dikenali secara default
SET GIT_CMD=git
git --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    SET GIT_CMD="C:\Program Files\Git\cmd\git.exe"
)

echo [1/3] Menambahkan file yang berubah ke antrean...
%GIT_CMD% add .
IF %ERRORLEVEL% NEQ 0 GOTO error

echo [2/3] Menyimpan rekaman perubahan lokal...
set mytimestamp=%date% %time:~0,8%
%GIT_CMD% commit -m "Auto Update Lokal: %mytimestamp%"
:: Kita abaikan errorlevel fungsi commit ini jika tidak ada yang berubah (sudah up to date)

echo [3/3] Mengunggah file ke server GitHub...
%GIT_CMD% push origin main
IF %ERRORLEVEL% NEQ 0 GOTO error

echo.
echo ==============================================
echo      SINKRONISASI BERHASIL DAN SELESAI!        
echo ==============================================
echo Kode terbaru Anda sudah aman tersimpan di GitHub.
echo.
pause
exit

:error
color 0C
echo.
echo ==============================================
echo    SINKRONISASI GAGAL! PERIKSA ERROR DI ATAS
echo ==============================================
echo Pastikan koneksi internet jalan dan tidak ada konflik.
echo.
pause
exit
