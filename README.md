# MasjidKu Smart App

Platform digital terlengkap untuk manajemen masjid modern.

## Tentang Aplikasi

MasjidKu Smart App adalah aplikasi self-hosted yang sudah **sepenuhnya independen** dari platform pihak ketiga manapun. Semua data tersimpan di database lokal (SQLite via Prisma) dan backend Node.js milik sendiri.

## Fitur Utama

- ✅ Dashboard keuangan masjid (pemasukan, pengeluaran, laporan)
- ✅ Manajemen jamaah & kepengurusan
- ✅ Jadwal kegiatan & absensi QR Code
- ✅ Pengumuman publik
- ✅ Layar TV Digital Signage (jadwal shalat, info masjid)
- ✅ Manajemen donasi & QRIS
- ✅ Halaman publik masjid (portofolio)
- ✅ AI Analitik keuangan otomatis
- ✅ Autentikasi 2FA (TOTP)
- ✅ Multi-masjid (multi-tenant)

## Cara Menjalankan

### Prerequisites
- Node.js v18+
- npm

### 1. Install dependencies frontend
```bash
npm install
```

### 2. Install dependencies backend
```bash
cd backend && npm install
```

### 3. Setup database
```bash
cd backend
npx prisma db push    # Sync schema ke database SQLite
node seed.js          # Buat akun superadmin awal
```

### 4. Jalankan backend
```bash
cd backend
node server.js
# Backend berjalan di http://localhost:3000
```

### 5. Jalankan frontend (development)
```bash
npm run dev
# Frontend berjalan di http://localhost:5173
```

### 6. Build untuk production
```bash
npm run build
# Lalu jalankan hanya backend: node backend/server.js
# Akses di http://localhost:3000
```

## Environment Variables (opsional)

Buat file `.env` di root project:
```
VITE_BACKEND_URL=http://localhost:3000/api
```

Buat file `.env` di folder `backend/`:
```
DATABASE_URL=file:./dev.db
JWT_SECRET=your_secret_key_here
PORT=3000
```

## Akun Default (setelah seed)

- **Email:** rm23n@ymail.com
- **Password:** M4m4cantik@
- **Role:** Superadmin

## Tech Stack

- **Frontend:** React 18 + Vite + TailwindCSS + shadcn/ui
- **Backend:** Node.js + Express
- **Database:** SQLite (via Prisma ORM)
- **Auth:** JWT + bcrypt + TOTP (2FA)
