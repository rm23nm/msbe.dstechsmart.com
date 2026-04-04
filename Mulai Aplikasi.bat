@echo off
title MasjidKu Smart Server Backend & Frontend
color 0A
echo ==============================================
echo   Memulai Aplikasi MasjidKu Smart...
echo ==============================================
echo.
echo Pastikan tidak menutup jendela ini agar aplikasi tetap berjalan!
echo Jika ingin melihat aplikasinya, buka browser dan ketik:
echo http://localhost:3000
echo.

cd /d "%~dp0"

:: Jalankan backend (yang akan otomatis melayani frontend dist di port 3000)
node backend/server.js

pause
