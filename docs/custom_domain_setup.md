# 🌐 Panduan Pengaturan Domain Kustom (Enterprise)

Selamat! Sebagai pengguna **Paket Enterprise**, Anda berhak menggunakan domain kustom sendiri (contoh: `www.masjidal-ikhlas.com`) untuk menggantikan URL default `/masjid/[slug]`.

Berikut adalah langkah-langkah teknis untuk menghubungkan domain Anda ke platform **MasjidKu Smart**.

---

## 1. Persiapan Domain (Pihak Registrar)
Anda harus memiliki akses ke panel kontrol domain (contoh: Niagahoster, GoDaddy, Rumahweb, dll).

### Langkah Konfigurasi DNS:
1.  Login ke panel registrar domain Anda.
2.  Cari menu **DNS Management** atau **Manage DNS**.
3.  Tambahkan record baru dengan rincian berikut:
    *   **Type**: `CNAME`
    *   **Host/Name**: `www` atau subdomain pilihan Anda (misal: `masjid`)
    *   **Value/Destination**: `ms.dstechsmart.com` (Main Domain Platform)
    *   **TTL**: `3600` (Default)
4.  Jika Anda ingin menggunakan domain utama tanpa `www`, arahkan **A Record** ke alamat IP Server kami: `103.xxx.xxx.xxx` (Silakan hubungi Tim Support untuk mendapatkan IP aktif).

---

## 2. Pengaturan di Aplikasi MasjidKu
Setelah DNS dikonfigurasi, Anda perlu mendaftarkannya di sistem kami.

1.  Buka **Pengaturan Masjid** → Tab **Halaman Publik**.
2.  Gulir ke bagian **Domain Kustom**.
3.  Masukkan nama domain Anda (tanpa `https://`), contoh: `masjidalikhlas.com`.
4.  Klik **Simpan Perubahan**.

> [!NOTE]
> Perubahan DNS memerlukan waktu propagasi antara **1 hingga 24 jam**. Nama domain Anda mungkin tidak langsung aktif seketika.

---

## 3. Aktivasi SSL (HTTPS)
Demi keamanan dan kepercayaan jamaah, setiap domain kustom wajib menggunakan sertifikat SSL (HTTPS).

*   Sistem kami akan mendeteksi domain baru secara otomatis.
*   Tim teknis kami akan memproses sertifikat SSL via *Let's Encrypt* dalam waktu maksimal 2x24 jam setelah domain terhubung.
*   Setelah aktif, gembok hijau akan muncul di browser saat membuka domain Anda.

---

## 4. Keuntungan Menggunakan Domain Sendiri
*   **Profesionalisme**: Meningkatkan citra masjid di mata masyarakat dan sponsor.
*   **Kemudahan Akses**: Jamaah cukup mengetik nama masjid Anda langsung.
*   **SEO Friendly**: Lebih mudah ditemukan di Google dengan nama domain yang spesifik.

---

> [!TIP]
> Jika Anda mengalami kesulitan dalam pengaturan di panel domain, silakan hubungi **WhatsApp Support** kami dengan mengirimkan akses login registrar domain Anda, dan tim kami akan membantu menyetelnya secara gratis.
