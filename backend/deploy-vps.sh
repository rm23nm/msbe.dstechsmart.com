#!/bin/bash

echo "🚀 Memulai proses update MasjidKu Smart..."

# 1. Ambil update terbaru dari GitHub
echo "🔄 Mengambil kode terbaru dari GitHub..."
git pull origin main

# 2. Sinkronisasi Database
echo "🗄️ Sinkronisasi skema database (Prisma)..."
cd backend
node node_modules/prisma/build/index.js db push --accept-data-loss
cd ..

# 3. Build ulang Frontend (hanya jika ada perubahan tampilan)
echo "🏗️ Membangun ulang file frontend (Build)..."
npm run build

# 4. Restart Server agar update aktif
echo "♻️ Me-restart aplikasi dengan PM2..."
pm2 restart all

echo "✅ Update Selesai! Aplikasi Anda sudah diperbarui."

