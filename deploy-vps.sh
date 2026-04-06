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
# Generate client agar sinkron dengan skema terbaru
npx prisma generate
# Push skema ke database live
npx prisma db push --accept-data-loss
cd ..

# 3. Jalankan Diagnosa (PENTING)
echo " "
echo "🔍 [3/5] Menjalankan Diagnosa Sistem..."
node backend/check-vps-status.js
if [ $? -ne 0 ]; then
    echo "❌ Diagnosa gagal! Cek pesan kesalahan di atas."
    # exit 1 (Opsional: berhenti jika kritis)
fi

# 4. Build ulang Frontend (opsional jika hanya merubah backend)
echo " "
echo "🏗️ [4/5] Membangun ulang file frontend (Build)..."
npm run build

# 5. Restart aplikasi menggunakan PM2
echo " "
echo "♻️ [5/5] Merestart semua proses aplikasi..."
pm2 restart all

echo " "
echo "===================================================="
echo "  ✅ UPDATE SELESAI ! APLIKASI SUDAH LIVE           "
echo "===================================================="
echo " "
