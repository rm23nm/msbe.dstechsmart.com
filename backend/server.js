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

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET || "supersecretkey123";

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
   Auth Endpoints
================== */

app.post("/api/auth/login", async (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) return res.status(400).json({ error: "Email and password required" });

  try {
    const user = await prisma.user.findUnique({ where: { email: identifier } });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Invalid password" });

    if (user.two_factor_enabled) {
      return res.json({ requires_2fa: true, email: user.email });
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

    // SIMULASI PENGIRIMAN
    console.log(`\n=== PERMINTAAN RESET PASSWORD ===`);
    console.log(`Tujuan     : ${user.full_name || user.email}`);
    if (user.phone) console.log(`No. WA/SMS : ${user.phone}`);
    console.log(`Token Reset: ${resetToken}`);
    console.log(`Buka URL   : http://localhost:5173/reset-password?token=${resetToken}`);
    console.log(`=================================\n`);

    res.json({ message: "Instruksi reset password telah dikirimkan ke Email dan WA/SMS Anda. (Cek console log terminal untuk linknya saat ini)" });
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
   Dynamic Entity CRUD Endpoints (Replaces Base44)
================== */

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
    const result = await prisma[prismaModel].create({ data: req.body });
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
    const result = await prisma[prismaModel].update({ where: { id: req.params.id }, data: req.body });
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
   Frontend Serving
================== */
const frontendPath = path.join(__dirname, "../dist");
app.use(express.static(frontendPath));

app.use((req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Self-Hosted Backend running on http://localhost:${PORT}`);
});
