# 🕌 PANDUAN IMPLEMENTASI SUB-PRODUK (WHITE-LABEL)
## SISTEM DIGITALISASI MASJIDKU SMART V2.0

---

## 1. PENDAHULUAN
Dokumen ini menjelaskan cara kerja dan aplikasi dari sistem **SubMasjidKuSmart**—sebuah varian produk mandiri (standalone) yang dikhususkan untuk 1 masjid saja dengan kontrol domain dan hosting sendiri, namun tetap terhubung secara lisensi ke server pusat Anda.

---

## 2. SISTEM KERJA (HOW IT WORKS)

### A. Pengenalan Mode Produk
- **Mode Pusat (SaaS)**: Aplikasi berjalan di domain Anda (masjidkusmart.com) untuk melayani ribuan masjid sekaligus.
- **Mode Mandiri (White-Label)**: Aplikasi diinstal di hosting client (misal: masjidraya.com). Secara otomatis, UI (Antarmuka) akan terkunci hanya untuk 1 masjid.

### B. Mekanisme Keamanan (License Gatekeeper)
1. **Verification on Boot**: Setiap kali server client dijalankan, aplikasi akan "bertanya" ke server pusat via API rahasia: *"Kunci ABC apakah valid untuk domain dstechsmart.com?"*.
2. **Global Lockdown**: Jika server pusat tidak memvalidasi (Status Revoked atau Key Mismatch), maka seluruh fitur di server client akan **dibekukan otomatis** (403 Forbidden).
3. **Data Isolation**: Database di server client akan dipaksa (Hard-Locked) hanya membaca dan menyimpan data milik ID Masjid yang berlisensi.

---

## 3. CARA APLIKASI (OPERATIONAL STEPS)

### LANGKAH 1: Persiapan di Server Pusat (Master)
Sebelum menyerahkan software ke pembeli:
1. Akses database pusat Anda di **aaPanel / phpMyAdmin**.
2. Masukkan baris baru di tabel `License`:
   - `key`: Buat kode unik (contoh: `MASJID-BARU-2024`).
   - `domain`: Alamat domain client (contoh: `masjidbaru.com`).
   - `mosque_id`: ID unik masjid tersebut yang sudah didaftarkan di sistem Anda.

### LANGKAH 2: Instalasi di Hosting Client (Sub-Produk)
1. Copy seluruh folder proyek ke server baru mereka.
2. Ganti nama file `.env.sub.example` menjadi **`.env`**.
3. Isi kolom di `.env` sebagai berikut:
   ```bash
   LICENSE_KEY=MASJID-BARU-2024
   LICENSE_SERVER_URL=https://masjidkusmart.com
   VITE_SINGLE_MOSQUE_MODE=true
   ```
4. Jalankan perintah `npm install && npm run build` di server baru.

---

## 4. SISTEM UPDATE OTOMATIS (CORE SYNC)

**Bagaimana jika Anda membuat fitur baru di MasjidKuSmart (Pusat)?**
Karena kodenya satu repository:
1. Anda hanya perlu `git push` kode baru ke repo GitHub Anda.
2. Di server client (Sub), Anda cukup jalankan:
   `git pull origin main`
3. Seluruh fitur canggih terbaru (seperti AI, Mode Live TV, dll) akan otomatis muncul di server client tersebut **TANPA merusak sistem lisensinya**.

---

## 5. TROUBLESHOOTING (PEMECAHAN MASALAH)
| Masalah | Penyebab | Solusi |
|---------|----------|--------|
| Muncul "License Revoked" | Lisensi dimatikan oleh Admin Pusat | Cek status di tabel `License` server pusat. |
| Layar Putih (Blank) | Belum npx prisma db push | Jalankan `cd backend && npx prisma db push` di server client. |
| Nama Masjid Tidak Berubah | Cache Browser | Lakukan Hard Refresh (Ctrl+Shift+R). |

---
**© 2024 Tim Pengembang MasjidKu Smart**
*Digitalisasi Untuk Kemakmuran Umat*
