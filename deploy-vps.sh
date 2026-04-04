#!/bin/bash
# ============================================================
# SCRIPT DEPLOY MASJIDKU SMART - JALANKAN DI VPS
# Menggunakan "prisma db push" (bukan migrate) sesuai setup lokal
# ============================================================
# Cara penggunaan: bash deploy-vps.sh
# ============================================================

set -e

COLOR_GREEN="\033[0;32m"
COLOR_YELLOW="\033[1;33m"
COLOR_RED="\033[0;31m"
COLOR_RESET="\033[0m"

echo -e "${COLOR_GREEN}"
echo "============================================================"
echo "  🕌 DEPLOY MASJIDKU SMART - VPS UPDATE SCRIPT"
echo "============================================================"
echo -e "${COLOR_RESET}"

# ---- LANGKAH 1: Pull kode terbaru dari GitHub ----
echo -e "${COLOR_YELLOW}[1/6] Mengambil kode terbaru dari GitHub...${COLOR_RESET}"
git pull origin main
echo -e "${COLOR_GREEN}✅ Git pull selesai${COLOR_RESET}"

# ---- LANGKAH 2: Install/update dependencies backend ----
echo -e "${COLOR_YELLOW}[2/6] Menginstall dependencies backend...${COLOR_RESET}"
cd backend
npm install
echo -e "${COLOR_GREEN}✅ Npm install backend selesai${COLOR_RESET}"

# ---- LANGKAH 3: Sinkronisasi Schema DB (KRITIS! Membuat tabel baru) ----
echo -e "${COLOR_YELLOW}[3/6] Sinkronisasi schema database (tambah tabel baru jika ada)...${COLOR_RESET}"
npx prisma db push --accept-data-loss
echo -e "${COLOR_GREEN}✅ Prisma db push selesai (tabel baru sudah dibuat)${COLOR_RESET}"

# ---- LANGKAH 4: Generate Prisma Client agar backend bisa pakai model baru ----
echo -e "${COLOR_YELLOW}[4/6] Generating Prisma Client terbaru...${COLOR_RESET}"
npx prisma generate
echo -e "${COLOR_GREEN}✅ Prisma generate selesai${COLOR_RESET}"

cd ..

# ---- LANGKAH 5: Build frontend ----
echo -e "${COLOR_YELLOW}[5/6] Build ulang frontend...${COLOR_RESET}"
npm install
npm run build
echo -e "${COLOR_GREEN}✅ Frontend build selesai${COLOR_RESET}"

# ---- LANGKAH 6: Restart PM2 ----
echo -e "${COLOR_YELLOW}[6/6] Restart aplikasi (PM2)...${COLOR_RESET}"
pm2 reload ecosystem.config.js --env production
pm2 save
echo -e "${COLOR_GREEN}✅ PM2 restart selesai${COLOR_RESET}"

echo -e "${COLOR_GREEN}"
echo "============================================================"
echo "  ✅ DEPLOY BERHASIL! Aplikasi sudah terupdate."
echo "============================================================"
echo -e "${COLOR_RESET}"
