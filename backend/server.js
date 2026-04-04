require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { PrismaClient } = require("@prisma/client");
const speakeasy = require("speakeasy");
const qrcode = require("qrcode");
const telegramService = require("./telegram-bot");

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET || "supersecretkey123";

// ============================
// AUTO-START TELEGRAM BOTS
// ============================
async function initAllTelegramBots() {
  try {
    const settings = await prisma.telegramSettings.findMany({ where: { bot_enabled: true } });
    const appSettings = await prisma.appSettings.findFirst();
    const globalGeminiKey = appSettings?.gemini_api_key || process.env.GEMINI_API_KEY;
    
    for (const setting of settings) {
      if (setting.bot_token) {
        const geminiKey = setting.gemini_api_key || globalGeminiKey;
        const serverUrl = process.env.SERVER_BASE_URL || `http://localhost:${PORT}`;
        telegramService.initTelegramBot(setting.mosque_id, setting.bot_token, prisma, geminiKey, serverUrl);
      }
    }
    if (settings.length > 0) {
      console.log(`[Telegram] ${settings.length} bot(s) berhasil diinisialisasi`);
    }
  } catch (e) {
    console.log("[Telegram] Belum ada bot yang dikonfigurasi");
  }
}

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Ensure uploads directory exists
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// Middleware to protect routes (excluding login and public APIs)
const authenticateToken = (req, res, next) => {
  // Allow public registration of Mosque
  if (req.method === "POST" && req.path === "/api/entities/Mosque") {
    return next();
  }

  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Missing token" });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user;
    next();
  });
};

/* ==================
   Public Endpoints
   ================== */

app.get("/api/public/mosque-by-domain", async (req, res) => {
  const { domain } = req.query;
  if (!domain) return res.status(400).json({ error: "Domain required" });

  try {
    const mosque = await prisma.mosque.findFirst({
      where: { custom_domain: domain },
      select: { id: true, slug: true, name: true }
    });
    
    if (!mosque) return res.status(404).json({ error: "Mosque not found for this domain" });
    res.json(mosque);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ==================
   Auth Endpoints
================== */

app.post("/api/auth/login", async (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) return res.status(400).json({ error: "Email and password required" });

  try {
    const user = await prisma.user.findUnique({ where: { email: identifier } });
    if (!user) return res.status(401).json({ error: "Email atau password salah" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Email atau password salah" });

    if (user.two_factor_enabled) {
      const method = user.two_factor_method || "totp";
      
      // Jika method WA/SMS, generate dan kirim OTP otomatis
      if (method === "whatsapp" || method === "sms") {
        if (!user.phone) {
          return res.status(400).json({ error: "Nomor telepon belum diatur. Tambah nomor HP di Pengaturan Profil." });
        }
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 menit
        await prisma.user.update({
          where: { id: user.id },
          data: { otp_code: otp, otp_expires: expires }
        });
        
        // Kirim via WhatsApp link (buka di server-side log dan kirim WA link jika ada nomor)
        const phone = user.phone.replace(/[^0-9]/g, "").replace(/^0/, "62");
        const waMsg = `[MasjidKu Smart] Kode OTP login Anda adalah: *${otp}*\n\nBerlaku selama 10 menit. Jangan bagikan kode ini kepada siapapun.`;
        const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(waMsg)}`;
        
        console.log(`\n=== OTP ${method.toUpperCase()} LOGIN ===`);
        console.log(`User    : ${user.email}`);
        console.log(`Phone   : ${user.phone}`);
        console.log(`OTP     : ${otp}`);
        console.log(`Expired : ${expires.toLocaleString('id-ID')}`);
        console.log(`WA URL  : ${waUrl}`);
        console.log(`=================================\n`);
        
        return res.json({
          requires_2fa: true,
          method,
          email: user.email,
          phone_hint: user.phone.replace(/(.{3}).*(.{3})/, "$1****$2"),
          wa_url: method === "whatsapp" ? waUrl : null, // Frontend bisa tampilkan link WA
          otp_debug: process.env.NODE_ENV !== "production" ? otp : undefined // Hanya tampil di dev
        });
      }
      
      // Default: TOTP
      return res.json({ requires_2fa: true, method: "totp", email: user.email });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET_KEY, { expiresIn: "7d" });
    const { password: _, ...userData } = user;
    res.json({ user: userData, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/auth/register", async (req, res) => {
  const { full_name, email, phone, password, mosque_id } = req.body;
  if (!email || !password || !mosque_id) return res.status(400).json({ error: "Email, password, dan ID masjid wajib diisi" });

  try {
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      const hash = await bcrypt.hash(password, 10);
      user = await prisma.user.create({
        data: { email, password: hash, full_name, phone, role: "user", current_mosque_id: mosque_id }
      });
    } else {
      user = await prisma.user.update({
        where: { email },
        data: { current_mosque_id: mosque_id, phone: phone || user.phone }
      });
    }

    const member = await prisma.mosqueMember.findFirst({ where: { user_email: email, mosque_id } });
    if (!member) {
      await prisma.mosqueMember.create({
        data: { user_email: email, user_name: full_name, user_phone: phone, mosque_id, role: "jamaah", status: "active" }
      });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET_KEY, { expiresIn: "7d" });
    const { password: _, ...userData } = user;
    res.json({ user: userData, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint khusus: daftar sebagai admin masjid dari Landing Page
app.post("/api/auth/register-mosque-admin", async (req, res) => {
  const { full_name, email, password, mosque_id } = req.body;
  if (!email || !password || !mosque_id) return res.status(400).json({ error: "Email, password, dan ID masjid wajib diisi" });
  if (password.length < 6) return res.status(400).json({ error: "Password minimal 6 karakter" });

  try {
    // Cek apakah email sudah digunakan
    let user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      return res.status(400).json({ error: "Email ini sudah terdaftar. Silakan login atau gunakan email lain." });
    }

    // Buat user baru dengan role admin
    const hash = await bcrypt.hash(password, 10);
    user = await prisma.user.create({
      data: { email, password: hash, full_name, role: "admin", current_mosque_id: mosque_id }
    });

    // Tambahkan sebagai pengurus di masjid
    await prisma.mosqueMember.create({
      data: { user_email: email, user_name: full_name, mosque_id, role: "pengurus", status: "active" }
    });

    // Update mosque owner email
    await prisma.mosque.update({ where: { id: mosque_id }, data: { email } });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET_KEY, { expiresIn: "7d" });
    const { password: _, ...userData } = user;
    res.json({ user: userData, token, message: "Akun admin berhasil dibuat" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/auth/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email wajib diisi" });

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: "Pengguna dengan email ini tidak ditemukan" });

    const resetToken = Math.random().toString(36).substring(2, 10);
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    await prisma.user.update({
      where: { email },
      data: { reset_password_token: resetToken, reset_password_expires: resetExpires }
    });

    const resetLink = `${process.env.APP_URL || "http://localhost:5173"}/reset-password?token=${resetToken}`;

    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      const nodemailer = require("nodemailer");
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 465,
        secure: process.env.SMTP_PORT == 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      await transporter.sendMail({
        from: `"MasjidKu Smart" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to: user.email,
        subject: "Reset Password MasjidKu Smart",
        html: `<h2>Halo ${user.full_name || user.email},</h2>
               <p>Kami menerima permintaan untuk mereset password akun MasjidKu Smart Anda.</p>
               <p>Silakan klik link di bawah ini untuk mereset password Anda:</p>
               <a href="${resetLink}" style="padding:10px 20px;background:#10b981;color:white;text-decoration:none;border-radius:5px;display:inline-block;margin:10px 0;">Reset Password</a>
               <p>Link ini hanya berlaku selama 1 jam.</p>
               <p>Jika Anda tidak meminta reset password, abaikan saja email ini.</p>
               <br/>
               <p>Salam,<br/>Tim MasjidKu Smart</p>`
      });
      console.log(`[SMTP] Email reset password terkirim ke ${user.email}`);
    } else {
      // SIMULASI PENGIRIMAN JIKA SMTP BELUM DIKONFIGURASI
      console.log(`\n=== PERMINTAAN RESET PASSWORD PADA MODE SIMULASI ===`);
      console.log(`PENTING: Email ini tidak benar-benar dikirim karena konfigurasi SMTP (.env) belum diatur.`);
      console.log(`Tujuan     : ${user.full_name || user.email}`);
      console.log(`Token Reset: ${resetToken}`);
      console.log(`Buka URL   : ${resetLink}`);
      console.log(`====================================================\n`);
    }

    res.json({ message: "Kami telah mengirimkan instruksi untuk reset password ke email Anda. Silakan cek inbox atau folder spam." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/auth/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) return res.status(400).json({ error: "Token dan password baru wajib diisi" });

  try {
    const user = await prisma.user.findFirst({
      where: { 
        reset_password_token: token,
        reset_password_expires: { gt: new Date() }
      }
    });

    if (!user) return res.status(400).json({ error: "Token tidak valid atau sudah kedaluwarsa" });

    const hash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hash, reset_password_token: null, reset_password_expires: null }
    });

    res.json({ message: "Password berhasil direset. Silakan login menggunakan kata sandi baru." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint untuk Ganti Password Mandiri (oleh User sendiri)
app.post("/api/auth/change-password", authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: "Password saat ini dan password baru wajib diisi" });

  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: "User tidak ditemukan" });

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return res.status(400).json({ error: "Password saat ini salah" });

    const hash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hash }
    });

    res.json({ message: "Password berhasil diubah" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint untuk Ganti Password oleh Admin (Superadmin mengubah sembarang, Admin Masjid mengubah jamaahnya)
app.post("/api/auth/admin-change-password", authenticateToken, async (req, res) => {
  const { userId, email, newPassword } = req.body;
  if ((!userId && !email) || !newPassword) return res.status(400).json({ error: "ID User/Email dan password baru wajib diisi" });

  try {
    const requester = await prisma.user.findUnique({ where: { id: req.user.id } });
    let targetUser = null;
    
    if (userId) {
      targetUser = await prisma.user.findUnique({ where: { id: userId } });
    } else if (email) {
      targetUser = await prisma.user.findUnique({ where: { email } });
    }
    
    if (!targetUser) return res.status(404).json({ error: "Target user tidak ditemukan" });

    // Validasi izin:
    if (requester.role !== "admin") {
      // Jika bukan superadmin, harus berupa admin_masjid atau yang memiliki akses ke current_mosque_id target
      if (requester.current_mosque_id !== targetUser.current_mosque_id && targetUser.role === "admin") {
        return res.status(403).json({ error: "Akses ditolak" });
      }
      if (targetUser.role === "admin") {
         return res.status(403).json({ error: "Tidak dapat mengubah password superadmin" });
      }
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: targetUser.id },
      data: { password: hash }
    });

    res.json({ message: "Password berhasil diubah oleh Admin" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint untuk verifikasi OTP WA/SMS
app.post("/api/auth/verify-otp", async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: "Email dan OTP wajib diisi" });

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: "Pengguna tidak ditemukan" });

    if (!user.otp_code || !user.otp_expires) {
      return res.status(400).json({ error: "Tidak ada OTP aktif untuk akun ini. Silakan login ulang." });
    }

    if (new Date() > new Date(user.otp_expires)) {
      return res.status(400).json({ error: "Kode OTP sudah kedaluwarsa. Silakan login ulang." });
    }

    if (user.otp_code !== String(otp).trim()) {
      return res.status(401).json({ error: "Kode OTP tidak valid" });
    }

    // OTP valid — hapus OTP lama, buat JWT token
    await prisma.user.update({
      where: { id: user.id },
      data: { otp_code: null, otp_expires: null }
    });

    const jwtToken = jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET_KEY, { expiresIn: "7d" });
    const { password: _, ...userData } = user;
    res.json({ user: { ...userData, otp_code: undefined, otp_expires: undefined }, token: jwtToken });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/auth/verify-2fa", async (req, res) => {
  const { email, token } = req.body;
  if (!email || !token) return res.status(400).json({ error: "Email dan 2FA token wajib diisi" });

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.two_factor_enabled || !user.two_factor_secret) {
      return res.status(401).json({ error: "2FA tidak aktif untuk akun ini" });
    }

    const isValid = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: "base32",
      token: token,
      window: 1
    });

    if (!isValid) return res.status(401).json({ error: "Kode Authenticator tidak valid" });

    const jwtToken = jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET_KEY, { expiresIn: "7d" });
    const { password: _, ...userData } = user;
    res.json({ user: userData, token: jwtToken });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/auth/2fa/generate", authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const secret = speakeasy.generateSecret({ name: `MasjidKu (${user.email})` });
    
    await prisma.user.update({
      where: { id: user.id },
      data: { two_factor_secret: secret.base32 }
    });

    qrcode.toDataURL(secret.otpauth_url, (err, data_url) => {
      if (err) return res.status(500).json({ error: "Gagal membuat QR Code" });
      res.json({ secret: secret.base32, qrCode: data_url });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/auth/2fa/enable", authenticateToken, async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: "Kode Authenticator wajib dihingga" });

  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user || !user.two_factor_secret) {
      return res.status(400).json({ error: "Proses setup 2FA belum diinisiasi" });
    }

    const isValid = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: "base32",
      token: token,
      window: 1
    });

    if (!isValid) return res.status(400).json({ error: "Kode Authenticator tidak valid" });

    await prisma.user.update({
      where: { id: user.id },
      data: { two_factor_enabled: true }
    });

    res.json({ message: "Autentikasi dua faktor berhasil diaktifkan" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/auth/2fa/disable", authenticateToken, async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: "Kode Authenticator wajib dihingga untuk menonaktifkan" });

  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user || !user.two_factor_enabled) {
      return res.status(400).json({ error: "2FA saat ini tidak aktif" });
    }

    const isValid = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: "base32",
      token: token,
      window: 1
    });

    if (!isValid) return res.status(400).json({ error: "Kode Authenticator tidak valid" });

    await prisma.user.update({
      where: { id: user.id },
      data: { two_factor_enabled: false, two_factor_secret: null }
    });

    res.json({ message: "Autentikasi dua faktor berhasil dinonaktifkan" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/auth/me", authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: "User not found" });
    const { password: _, ...userData } = user;
    res.json(userData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch("/api/auth/me", authenticateToken, async (req, res) => {
  try {
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: req.body
    });
    const { password: _, ...userData } = updatedUser;
    res.json(userData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/auth/seed", async (req, res) => {
  try {
    const hash = await bcrypt.hash("M4m4cantik@", 10);
    const admin = await prisma.user.upsert({
      where: { email: "rm23n@ymail.com" },
      update: {},
      create: {
        email: "rm23n@ymail.com",
        password: hash,
        full_name: "Superadmin",
        role: "admin",
      },
    });
    res.json({ message: "Seeded admin account", admin });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/integrations/core/uploadfile", authenticateToken, upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  const protocol = req.protocol;
  const host = req.get("host"); // includes port if present
  const fullUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
  res.json({ file_url: fullUrl });
});

/* ==================
   Telegram Broadcast Endpoint
================== */
app.post("/api/integrations/telegram/broadcast", authenticateToken, async (req, res) => {
  const { title, message } = req.body;
  if (!title || !message) return res.status(400).json({ error: "Title dan message wajib diisi" });

  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (user.role !== "admin" && user.role !== "superadmin") {
      return res.status(403).json({ error: "Akses ditolak. Khusus superadmin." });
    }

    const settings = await prisma.telegramSettings.findMany({ where: { bot_enabled: true } });
    let sentCount = 0;

    const msgHtml = `🚀 <b>PEMBARUAN SISTEM (SYSTEM UPDATE)</b> 🚀\n\n📌 <b>${title}</b>\n\n${message}\n\n<i>— Dikirim otomatis oleh Tim MasjidKu Smart</i>`;

    for (const setting of settings) {
      if (setting.bot_token && setting.chat_id) {
        await telegramService.sendTelegramNotification(setting.bot_token, setting.chat_id, msgHtml);
        sentCount++;
      }
    }

    res.json({ message: `Pengumuman update berhasil dikirim ke ${sentCount} grup Telegram masjid.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ==================
   Dynamic Entity CRUD Endpoints (Replaces Base44)
================== */

// ✅ Public absensi endpoint — no authentication required
app.post("/api/attendance", async (req, res) => {
  try {
    const { activity_id, mosque_id, member_name, member_email, member_phone } = req.body;
    if (!activity_id || !member_name) return res.status(400).json({ error: "activity_id dan member_name wajib diisi" });
    const result = await prisma.attendance.create({
      data: { activity_id, mosque_id, member_name, member_email: member_email || null, member_phone: member_phone || null }
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Public endpoint GET Attendance by activity_id (for admin viewing)
app.get("/api/attendance", async (req, res) => {
  try {
    const { activity_id, mosque_id } = req.query;
    const where = {};
    if (activity_id) where.activity_id = activity_id;
    if (mosque_id) where.mosque_id = mosque_id;
    const data = await prisma.attendance.findMany({ where, orderBy: { checked_in_at: "desc" }, take: 200 });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/entities/:model", async (req, res) => {
  const modelName = req.params.model;
  const prismaModel = modelName.charAt(0).toLowerCase() + modelName.slice(1);
  if (!prisma[prismaModel]) return res.status(404).json({ error: "Invalid entity" });

  try {
    const { filter, sort, limit } = req.query;
    let queryArgs = {};

    if (filter) {
      try { queryArgs.where = JSON.parse(filter); } catch (e) {}
    }
    
    if (sort) {
      const isDesc = sort.startsWith("-");
      const field = isDesc ? sort.slice(1) : sort;
      queryArgs.orderBy = { [field]: isDesc ? "desc" : "asc" };
    }

    if (limit) {
      queryArgs.take = parseInt(limit, 10);
    }

    const data = await prisma[prismaModel].findMany(queryArgs);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/entities/:model", authenticateToken, async (req, res) => {
  const modelName = req.params.model;
  const prismaModel = modelName.charAt(0).toLowerCase() + modelName.slice(1);
  if (!prisma[prismaModel]) return res.status(404).json({ error: "Invalid entity" });

  try {
    const { admin_password, ...data } = req.body;
    const result = await prisma[prismaModel].create({ data });
    
    // Auto provision admin_masjid user if registering a Mosque and admin_password is provided
    if (modelName === "Mosque" && admin_password && data.email) {
      const hash = await bcrypt.hash(admin_password, 10);
      
      // Upsert User
      let user = await prisma.user.findUnique({ where: { email: data.email } });
      if (!user) {
        user = await prisma.user.create({
          data: {
            email: data.email,
            password: hash,
            full_name: `Admin ${data.name}`,
            phone: data.phone || "",
            role: "admin_masjid",
            current_mosque_id: result.id
          }
        });
      } else {
        await prisma.user.update({
          where: { email: data.email },
          data: { password: hash, role: "admin_masjid", current_mosque_id: result.id }
        });
      }
      
      // Upsert MosqueMember
      const member = await prisma.mosqueMember.findFirst({ where: { user_email: data.email, mosque_id: result.id } });
      if (!member) {
        await prisma.mosqueMember.create({
          data: {
            user_email: data.email,
            user_name: `Admin ${data.name}`,
            user_phone: data.phone || "",
            mosque_id: result.id,
            role: "admin_masjid",
            status: "active"
          }
        });
      }
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch("/api/entities/:model/:id", authenticateToken, async (req, res) => {
  const modelName = req.params.model;
  const prismaModel = modelName.charAt(0).toLowerCase() + modelName.slice(1);
  if (!prisma[prismaModel]) return res.status(404).json({ error: "Invalid entity" });

  try {
    const { admin_password, ...data } = req.body;
    const result = await prisma[prismaModel].update({ where: { id: req.params.id }, data });
    
    // Update admin_masjid password if registering/updating Mosque and admin_password is provided
    if (modelName === "Mosque" && admin_password) {
      // Find mosque to get the email
      const targetEmail = data.email || (await prisma.mosque.findUnique({ where: { id: req.params.id } }))?.email;
      if (targetEmail) {
        const hash = await bcrypt.hash(admin_password, 10);
        let user = await prisma.user.findUnique({ where: { email: targetEmail } });
        if (user) {
          await prisma.user.update({
            where: { email: targetEmail },
            data: { password: hash }
          });
        }
      }
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/entities/:model/:id", authenticateToken, async (req, res) => {
  const modelName = req.params.model;
  const prismaModel = modelName.charAt(0).toLowerCase() + modelName.slice(1);
  if (!prisma[prismaModel]) return res.status(404).json({ error: "Invalid entity" });

  try {
    const result = await prisma[prismaModel].delete({ where: { id: req.params.id } });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ==================
   AI Analysis Endpoint (Local Statistical Analysis)
================== */
app.post("/api/ai/analyze", authenticateToken, async (req, res) => {
  try {
    const { mosque_id } = req.body;
    if (!mosque_id) return res.status(400).json({ error: "mosque_id wajib diisi" });

    const mosque = await prisma.mosque.findUnique({ where: { id: mosque_id } });
    if (!mosque) return res.status(404).json({ error: "Masjid tidak ditemukan" });

    const now = new Date();
    const thisMonthStr = now.toISOString().slice(0, 7);
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthStr = lastMonthDate.toISOString().slice(0, 7);

    const [transactions, activities, donations, members] = await Promise.all([
      prisma.transaction.findMany({ where: { mosque_id }, orderBy: { date: "desc" }, take: 500 }),
      prisma.activity.findMany({ where: { mosque_id }, orderBy: { date: "desc" } }),
      prisma.donation.findMany({ where: { mosque_id }, orderBy: { createdAt: "desc" } }),
      prisma.mosqueMember.findMany({ where: { mosque_id } }),
    ]);

    const sum = (arr, type) => arr.filter(t => t.type === type).reduce((s, t) => s + (t.amount || 0), 0);
    const fmt = (n) => "Rp " + (n || 0).toLocaleString("id-ID");

    const thisTxs = transactions.filter(t => t.date && t.date.startsWith(thisMonthStr));
    const lastTxs = transactions.filter(t => t.date && t.date.startsWith(lastMonthStr));

    const thisIncome = sum(thisTxs, "income");
    const thisExpense = sum(thisTxs, "expense");
    const lastIncome = sum(lastTxs, "income");
    const lastExpense = sum(lastTxs, "expense");
    const totalIncome = sum(transactions, "income");
    const totalExpense = sum(transactions, "expense");

    const incomeChange = lastIncome > 0 ? ((thisIncome - lastIncome) / lastIncome * 100).toFixed(1) : 0;
    const expenseChange = lastExpense > 0 ? ((thisExpense - lastExpense) / lastExpense * 100).toFixed(1) : 0;

    const categoryMap = {};
    transactions.forEach(t => {
      const cat = t.category || "Lainnya";
      if (!categoryMap[cat]) categoryMap[cat] = { income: 0, expense: 0, count: 0 };
      categoryMap[cat][t.type] += t.amount || 0;
      categoryMap[cat].count++;
    });

    const topCategories = Object.entries(categoryMap)
      .sort((a, b) => (b[1].income + b[1].expense) - (a[1].income + a[1].expense))
      .slice(0, 5);

    const upcomingActs = activities.filter(a => a.status === "upcoming");
    const completedActs = activities.filter(a => a.status === "completed");
    const confirmedDonations = donations.filter(d => d.status === "confirmed" || d.status === "completed");
    const pendingDonations = donations.filter(d => d.status === "pending");
    const activeMembers = members.filter(m => m.status === "active");

    let report = `# 📊 Laporan Analisis Keuangan\n`;
    report += `**${mosque.name}** — ${now.toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}\n\n`;
    report += `## 📈 Ringkasan Eksekutif\n\n`;
    report += `Masjid **${mosque.name}** memiliki total **${transactions.length} transaksi** keuangan dengan saldo keseluruhan sebesar **${fmt(totalIncome - totalExpense)}**. `;
    report += `Bulan ini tercatat pemasukan **${fmt(thisIncome)}**${incomeChange != 0 ? ` (${incomeChange > 0 ? "+" : ""}${incomeChange}% vs bulan lalu)` : ""} dan pengeluaran **${fmt(thisExpense)}**. `;
    report += `Jamaah aktif berjumlah **${activeMembers.length} anggota** dari total ${members.length} terdaftar.\n\n`;

    report += `## 💰 Keuangan Bulan Ini vs Bulan Lalu\n\n`;
    report += `| Kategori | Bulan Ini | Bulan Lalu | Tren |\n`;
    report += `|---|---|---|---|\n`;
    report += `| Pemasukan | ${fmt(thisIncome)} | ${fmt(lastIncome)} | ${incomeChange > 0 ? "🟢 +" : incomeChange < 0 ? "🔴 " : "⚪ "}${Math.abs(incomeChange)}% |\n`;
    report += `| Pengeluaran | ${fmt(thisExpense)} | ${fmt(lastExpense)} | ${expenseChange < 0 ? "🟢 -" : expenseChange > 0 ? "🔴 +" : "⚪ "}${Math.abs(expenseChange)}% |\n`;
    report += `| Saldo | ${fmt(thisIncome - thisExpense)} | ${fmt(lastIncome - lastExpense)} | — |\n\n`;

    report += `## 📂 Breakdown Kategori (Top 5)\n\n`;
    report += `| Kategori | Pemasukan | Pengeluaran | Transaksi |\n`;
    report += `|---|---|---|---|\n`;
    topCategories.forEach(([cat, val]) => {
      report += `| ${cat} | ${fmt(val.income)} | ${fmt(val.expense)} | ${val.count} |\n`;
    });
    report += "\n";

    report += `## 🎯 Kegiatan\n\n`;
    report += `- **Mendatang:** ${upcomingActs.length} kegiatan\n`;
    report += `- **Selesai:** ${completedActs.length} kegiatan\n`;
    if (upcomingActs.length > 0) {
      report += `- **Jadwal terdekat:** ${upcomingActs.slice(0, 3).map(a => `${a.title} (${a.date})`).join(", ")}\n`;
    }
    report += "\n";

    report += `## 🤝 Donasi\n\n`;
    report += `- **Total:** ${donations.length} donasi\n`;
    report += `- **Dikonfirmasi:** ${confirmedDonations.length} (${fmt(confirmedDonations.reduce((s, d) => s + (d.amount || 0), 0))})\n`;
    report += `- **Menunggu konfirmasi:** ${pendingDonations.length}\n\n`;

    report += `## ⚠️ Perhatian & Risiko\n\n`;
    const risks = [];
    if (thisIncome < lastIncome * 0.8 && lastIncome > 0) risks.push("🔴 Pemasukan bulan ini turun signifikan (>20%) dibanding bulan lalu");
    if (thisExpense > thisIncome * 0.9 && thisIncome > 0) risks.push("🔴 Pengeluaran mendekati atau melebihi pemasukan bulan ini");
    if (pendingDonations.length > 5) risks.push(`🟡 Ada ${pendingDonations.length} donasi yang belum dikonfirmasi`);
    if (activeMembers.length < 5) risks.push("🟡 Jumlah anggota aktif sangat sedikit");
    if (upcomingActs.length === 0) risks.push("🟡 Tidak ada kegiatan yang dijadwalkan");
    if (risks.length === 0) risks.push("✅ Tidak ada risiko signifikan yang terdeteksi");
    risks.forEach(r => { report += `- ${r}\n`; });
    report += "\n";

    report += `## 💡 Rekomendasi\n\n`;
    const recs = [];
    if (thisIncome < lastIncome && lastIncome > 0) recs.push("Evaluasi sumber pemasukan dan rencanakan kampanye donasi atau kegiatan fundraising");
    if (pendingDonations.length > 0) recs.push(`Segera konfirmasi ${pendingDonations.length} donasi yang masih pending`);
    if (upcomingActs.length < 3) recs.push("Tambahkan program kegiatan masjid yang lebih beragam");
    recs.push("Pastikan laporan keuangan bulanan dipublikasikan ke jamaah");
    recs.push("Aktifkan fitur donasi online untuk memudahkan jamaah berdonasi");
    recs.push("Gunakan fitur Pengumuman untuk transparansi keuangan");
    recs.slice(0, 6).forEach((r, i) => { report += `${i + 1}. ${r}\n`; });

    res.json({ report });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


/* ==================
   TELEGRAM INTEGRATION ENDPOINTS
================== */

// GET - Ambil pengaturan Telegram masjid
app.get("/api/telegram/settings", authenticateToken, async (req, res) => {
  try {
    const mosqueId = req.query.mosque_id;
    if (!mosqueId) return res.status(400).json({ error: "mosque_id wajib diisi" });

    let settings = await prisma.telegramSettings.findUnique({ where: { mosque_id: mosqueId } });
    if (!settings) {
      // Buat default settings jika belum ada
      settings = await prisma.telegramSettings.create({
        data: { mosque_id: mosqueId }
      });
    }
    // Sembunyikan bot_token untuk keamanan
    const safeSettings = { ...settings, bot_token: settings.bot_token ? "****" + settings.bot_token.slice(-4) : null };
    res.json(safeSettings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST - Simpan / update pengaturan Telegram masjid
app.post("/api/telegram/settings", authenticateToken, async (req, res) => {
  try {
    const { mosque_id, bot_token, chat_id, notify_transactions, notify_activities, 
            notify_announcements, notify_donations, bot_enabled, gemini_api_key } = req.body;
    
    if (!mosque_id) return res.status(400).json({ error: "mosque_id wajib diisi" });

    const existing = await prisma.telegramSettings.findUnique({ where: { mosque_id } });
    
    // Jika bot_token berisi **** (masked), jangan update token
    const isTokenMasked = bot_token && bot_token.includes("****");
    
    const data = {
      chat_id: chat_id || null,
      notify_transactions: notify_transactions ?? true,
      notify_activities: notify_activities ?? true,
      notify_announcements: notify_announcements ?? true,
      notify_donations: notify_donations ?? true,
      bot_enabled: bot_enabled ?? false,
      gemini_api_key: gemini_api_key || null,
    };

    if (!isTokenMasked && bot_token) {
      data.bot_token = bot_token;
    }

    let settings;
    if (existing) {
      settings = await prisma.telegramSettings.update({ where: { mosque_id }, data });
    } else {
      settings = await prisma.telegramSettings.create({ data: { mosque_id, ...data } });
    }

    // Reload bot jika aktif
    const currentSettings = await prisma.telegramSettings.findUnique({ where: { mosque_id } });
    if (currentSettings?.bot_enabled && currentSettings?.bot_token) {
      const appSettings = await prisma.appSettings.findFirst();
      const globalGeminiKey = appSettings?.gemini_api_key || process.env.GEMINI_API_KEY;
      const geminiKey = currentSettings.gemini_api_key || globalGeminiKey;
      const serverUrl = process.env.SERVER_BASE_URL || `http://localhost:${PORT}`;
      telegramService.initTelegramBot(mosque_id, currentSettings.bot_token, prisma, geminiKey, serverUrl);
    } else if (!currentSettings?.bot_enabled) {
      telegramService.stopTelegramBot(mosque_id);
    }

    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST - Test koneksi bot Telegram
app.post("/api/telegram/test-bot", authenticateToken, async (req, res) => {
  try {
    const { bot_token, mosque_id } = req.body;
    
    // Jika token masked, ambil dari database
    let token = bot_token;
    if (!token || token.includes("****")) {
      const settings = await prisma.telegramSettings.findUnique({ where: { mosque_id } });
      token = settings?.bot_token;
    }
    
    if (!token) return res.status(400).json({ error: "Bot token belum dikonfigurasi" });
    
    const result = await telegramService.testBotConnection(token);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST - Test kirim notifikasi ke chat
app.post("/api/telegram/test-send", authenticateToken, async (req, res) => {
  try {
    const { mosque_id, chat_id } = req.body;
    
    const settings = await prisma.telegramSettings.findUnique({ where: { mosque_id } });
    if (!settings?.bot_token) return res.status(400).json({ error: "Bot token belum dikonfigurasi" });
    if (!chat_id && !settings?.chat_id) return res.status(400).json({ error: "Chat ID belum dikonfigurasi" });
    
    const targetChatId = chat_id || settings.chat_id;
    const result = await telegramService.testSendNotification(settings.bot_token, targetChatId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST - Kirim notifikasi manual ke Telegram
app.post("/api/telegram/send-notification", authenticateToken, async (req, res) => {
  try {
    const { mosque_id, message } = req.body;
    if (!mosque_id || !message) return res.status(400).json({ error: "mosque_id dan message wajib diisi" });
    
    const settings = await prisma.telegramSettings.findUnique({ where: { mosque_id } });
    if (!settings?.bot_token || !settings?.chat_id) {
      return res.status(400).json({ error: "Telegram belum dikonfigurasi untuk masjid ini" });
    }
    
    const result = await telegramService.sendTelegramNotification(settings.bot_token, settings.chat_id, message);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST - OCR analisis gambar struk (upload via web)
app.post("/api/telegram/analyze-receipt", authenticateToken, upload.single("receipt"), async (req, res) => {
  try {
    const mosqueId = req.body.mosque_id || req.query.mosque_id;
    
    // Ambil Gemini API key
    let geminiKey = null;
    if (mosqueId) {
      const telegramSettings = await prisma.telegramSettings.findUnique({ where: { mosque_id: mosqueId } });
      geminiKey = telegramSettings?.gemini_api_key;
    }
    if (!geminiKey) {
      const appSettings = await prisma.appSettings.findFirst();
      geminiKey = appSettings?.gemini_api_key || process.env.GEMINI_API_KEY;
    }
    
    if (!geminiKey) {
      return res.status(400).json({ error: "Gemini API Key belum dikonfigurasi. Tambahkan di pengaturan Telegram atau Pengaturan Aplikasi." });
    }
    
    let imagePath;
    if (req.file) {
      imagePath = req.file.path;
    } else if (req.body.image_url) {
      imagePath = req.body.image_url;
    } else {
      return res.status(400).json({ error: "Upload gambar atau sertakan image_url" });
    }
    
    const result = await telegramService.analyzeReceiptWithAI(imagePath, geminiKey);
    
    // Generate URL file jika upload
    if (req.file) {
      const protocol = req.protocol;
      const host = req.get("host");
      result.receipt_url = `${protocol}://${host}/uploads/${req.file.filename}`;
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ==================
   OVERRIDE ENTITIES - Tambah notifikasi Telegram saat create
================== */

// Untuk Transaction - kirim notifikasi setelah create
app.post("/api/transactions/create", authenticateToken, async (req, res) => {
  try {
    const result = await prisma.transaction.create({ data: req.body });
    
    // Kirim notifikasi Telegram
    try {
      const mosqueId = req.body.mosque_id;
      const telegramSettings = await prisma.telegramSettings.findUnique({ where: { mosque_id: mosqueId } });
      if (telegramSettings?.bot_token && telegramSettings?.chat_id && telegramSettings?.notify_transactions && telegramSettings?.bot_enabled) {
        const mosque = await prisma.mosque.findUnique({ where: { id: mosqueId } });
        const message = telegramService.buildTransactionMessage(mosque, result);
        await telegramService.sendTelegramNotification(telegramSettings.bot_token, telegramSettings.chat_id, message);
      }
    } catch (notifErr) {
      console.error("[Telegram Notif Transaction]", notifErr.message);
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Untuk Activity - kirim notifikasi setelah create
app.post("/api/activities/create", authenticateToken, async (req, res) => {
  try {
    const result = await prisma.activity.create({ data: req.body });
    
    // Kirim notifikasi Telegram
    try {
      const mosqueId = req.body.mosque_id;
      const telegramSettings = await prisma.telegramSettings.findUnique({ where: { mosque_id: mosqueId } });
      if (telegramSettings?.bot_token && telegramSettings?.chat_id && telegramSettings?.notify_activities && telegramSettings?.bot_enabled) {
        const mosque = await prisma.mosque.findUnique({ where: { id: mosqueId } });
        const message = telegramService.buildActivityMessage(mosque, result, "baru");
        await telegramService.sendTelegramNotification(telegramSettings.bot_token, telegramSettings.chat_id, message);
      }
    } catch (notifErr) {
      console.error("[Telegram Notif Activity]", notifErr.message);
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Untuk Announcement - kirim notifikasi setelah create
app.post("/api/announcements/create", authenticateToken, async (req, res) => {
  try {
    const result = await prisma.announcement.create({ data: req.body });
    
    // Kirim notifikasi Telegram
    try {
      const mosqueId = req.body.mosque_id;
      const telegramSettings = await prisma.telegramSettings.findUnique({ where: { mosque_id: mosqueId } });
      if (telegramSettings?.bot_token && telegramSettings?.chat_id && telegramSettings?.notify_announcements && telegramSettings?.bot_enabled) {
        const mosque = await prisma.mosque.findUnique({ where: { id: mosqueId } });
        const message = telegramService.buildAnnouncementMessage(mosque, result);
        await telegramService.sendTelegramNotification(telegramSettings.bot_token, telegramSettings.chat_id, message);
      }
    } catch (notifErr) {
      console.error("[Telegram Notif Announcement]", notifErr.message);
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Untuk Donation - kirim notifikasi setelah create
app.post("/api/donations/create", authenticateToken, async (req, res) => {
  try {
    const result = await prisma.donation.create({ data: req.body });
    
    // Kirim notifikasi Telegram
    try {
      const mosqueId = req.body.mosque_id;
      const telegramSettings = await prisma.telegramSettings.findUnique({ where: { mosque_id: mosqueId } });
      if (telegramSettings?.bot_token && telegramSettings?.chat_id && telegramSettings?.notify_donations && telegramSettings?.bot_enabled) {
        const mosque = await prisma.mosque.findUnique({ where: { id: mosqueId } });
        const message = telegramService.buildDonationMessage(mosque, result);
        await telegramService.sendTelegramNotification(telegramSettings.bot_token, telegramSettings.chat_id, message);
      }
    } catch (notifErr) {
      console.error("[Telegram Notif Donation]", notifErr.message);
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ==================
   Frontend Serving
================== */
const frontendPath = path.join(__dirname, "../dist");
app.use(express.static(frontendPath));

app.use((req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

app.listen(PORT, async () => {
  console.log(`Self-Hosted Backend running on http://localhost:${PORT}`);
  // Auto-start semua Telegram bot yang aktif
  await initAllTelegramBots();
});
