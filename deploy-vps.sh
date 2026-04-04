#!/bin/bash

# ==========================================
# RE-DEPLOYMENT SCRIPT FOR VPS (LINUX ONLY)
# ==========================================

echo " "
echo "===================================================="
echo "  🚀 MEMULAI UPDATE APLIKASI MASJIDKU SMART         "
echo "===================================================="
echo " "

# 1. Pastikan kita di folder root project
# cd /www/wwwroot/ms.dstechsmart.com

echo "🔄 [1/4] Mengambil kode terbaru dari GitHub..."
git pull origin main

# 2. Sinkronkan Database (Prisma)
echo " "
echo "🗄️ [2/4] Sinkronisasi skema database..."
cd backend
# NB: Gunakan node path modul jika prisma tidak terinstall secara global
node node_modules/prisma/build/index.js db push --accept-data-loss
cd ..

# 3. Build ulang Frontend (opsional jika hanya merubah backend)
# Namun sangat penting jika ada perubahan tampilan (UI)
echo " "
echo "🏗️ [3/4] Membangun ulang file frontend (Build)..."
npm run build

# 4. Restart aplikasi menggunakan PM2
echo " "
echo "♻️ [4/4] Merestart semua proses aplikasi..."
pm2 restart all

echo " "
echo "===================================================="
echo "  ✅ UPDATE SELESAI ! APLIKASI SUDAH LIVE           "
echo "===================================================="
echo " "
