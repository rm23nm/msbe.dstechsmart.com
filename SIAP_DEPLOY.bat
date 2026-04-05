@echo off
title Bungkus SubMasjidKuSmart (Dstech Edition)
color 0A

echo ==============================================
echo   MEMPROSES SUB-PRODUK (BUILT VERSION)
echo ==============================================
echo.

:: 1. Build Frontend menjadi kode mesin aman (dist)
echo [1/3] Mengonversi kode mentah menjadi kode mesin (Build)...
call npm run build

:: 2. Siapkan Folder Release
echo [2/3] Menyiapkan Folder Release...
if not exist "release_submasjidkusmart" mkdir "release_submasjidkusmart"

:: 3. Copy hanya file MATANG (keamanan data)
echo [3/3] Menyalin file inti (Tanpa Source Code)...
xcopy /s /e /y /i "dist\*" "release_submasjidkusmart\dist\" 1>nul

:: Copy backend tanpa harus menyalin node_modules yang berat
echo Menyalin Backend...
xcopy /s /e /y "backend\*" "release_submasjidkusmart\backend\" /exclude:exclude_list.txt 1>nul

:: Hapus file log/db lokal di folder backend release (untuk keamanan)
del "release_submasjidkusmart\backend\dev.db" /q 2>nul
del "release_submasjidkusmart\backend\exclude_list.txt" /q 2>nul

:: Buat instruksi cepat untuk Anda
echo Silakan copy folder "release_submasjidkusmart" ini ke VPS Client. > "release_submasjidkusmart\PETUNJUK_DEPLOY.txt"
echo Step 1: Jalankan npm install di folder ini. >> "release_submasjidkusmart\PETUNJUK_DEPLOY.txt"
echo Step 2: Edit file .env masukan LICENSE_KEY. >> "release_submasjidkusmart\PETUNJUK_DEPLOY.txt"
echo Step 3: Jalankan pm2 start backend/server.js. >> "release_submasjidkusmart\PETUNJUK_DEPLOY.txt"

echo.
echo ==============================================
echo   PROSES BUNGKUS SELESAI!
echo   Buka folder: release_submasjidkusmart
echo ==============================================
pause
