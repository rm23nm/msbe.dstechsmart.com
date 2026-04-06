require("dotenv").config();
const express = require("express");
const axios = require("axios");
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

// DEBUG: Log available models
console.log("[Prisma] Rak Database Terdeteksi:", Object.keys(prisma).filter(k => !k.startsWith("_")));

const PORT = process.env.PORT || 3000;
// PEMBERSIH KUNCI OTOMATIS: Pastikan tidak ada tanda kutip yang tersisa dari .env
const SECRET_KEY = (process.env.JWT_SECRET || "mesjidkusupersecret_091k2j3").replace(/['"]+/g, "");

// Basic Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Ensure uploads directory exists
if (!fs.existsSync(path.join(__dirname, "uploads"))) {
  fs.mkdirSync(path.join(__dirname, "uploads"));
}

// Serve Static Frontend (dist)
const distPath = path.join(__dirname, "../dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  console.log(`[Server] Serving frontend from ${distPath}`);
} else {
  console.warn(`[Server] Frontend build (dist) not found at ${distPath}`);
}

/* ==================
   MAIN SECURITY
   ================== */
const authenticateToken = (req, res, next) => {
  const url = req.originalUrl || req.url;
  
  // BYPASS: Izinkan pendaftaran mandiri & melihat paket produk publik
  const isPublic = (req.method === "POST" && (
    url.includes("/entities/Mosque") || 
    url.includes("/entities/License") || 
    url.includes("/entities/Transaction") ||
    url.includes("/vouchers/validate") ||
    url.includes("/auth/login") ||
    url.includes("/auth/register")
  )) || (req.method === "GET" && (
    url.includes("/entities/PlanFeatures") ||
    url.includes("/public/") ||
    url.includes("/attendance/fast-checkin")
  ));

  if (isPublic) {
    return next();
  }

  const authHeader = req.headers["authorization"] || req.headers["Authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    console.warn(`[AUTH] Unauthorized Access Attempt: ${req.method} ${url}`);
    return res.status(401).json({ error: "Unauthorized access" });
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      console.error(`[AUTH] Invalid Token on ${url}:`, err.message);
      return res.status(403).json({ error: "Invalid token" });
    }
    req.user = user;
    next();
  });
};

// HELPER: Log Activity Smart Switch
const logActivity = async (userId, userName, mosqueId, action, entity, entityId, description) => {
  if (!userId || !mosqueId) return; // Skip if no user context
  try {
    await prisma.auditLog.create({
      data: {
        user_id: userId,
        user_name: userName || "System",
        mosque_id: mosqueId,
        action,
        entity,
        entityId: String(entityId),
        description
      }
    });
    console.log(`[Audit] ${action} on ${entity} by ${userName}`);
  } catch (err) {
    console.error("[AuditLog Error]", err.message);
  }
};

/* ==================
   API ENDPOINTS
   ================== */

app.get("/api/test", (req, res) => res.json({ status: "online" }));

// Resolve Master ID untuk pendaftaran mandiri
app.get("/api/public/master", async (req, res) => {
  try {
    const mosque = await prisma.mosque.findFirst({
      where: { OR: [ { name: { contains: "Pusat" } }, { name: { contains: "DSTech" } } ] }
    });
    res.json({ id: mosque?.id || null });
  } catch (e) { res.json({ id: null }); }
});

// Mosque by Domain OR Slug (Public)
app.get("/api/public/mosque-by-domain", async (req, res) => {
  const { domain } = req.query;
  if (!domain) return res.status(400).json({ error: "Domain parameter required" });

  try {
    const mosque = await prisma.mosque.findFirst({
      where: {
        OR: [
          { custom_domain: domain },
          { slug: domain }
        ]
      }
    });

    if (!mosque) return res.status(404).json({ error: "Mosque matching domain not found" });

    // Attach Plan Features so frontend can immediately gate
    const plan = await prisma.planFeatures.findUnique({ 
      where: { plan: mosque.subscription_plan || "trial" } 
    });
    
    let activeFeatures = [];
    if (plan?.features) {
      try { 
        activeFeatures = typeof plan.features === 'string' ? JSON.parse(plan.features) : (plan.features || []); 
      } catch(e) { activeFeatures = []; }
    }

    res.json({ ...mosque, plan_features: activeFeatures });
  } catch (e) {
    res.status(500).json({ error: "Database error resolving domain" });
  }
});

// Validasi Voucher
app.post("/api/vouchers/validate", async (req, res) => {
  const { code } = req.body;
  try {
    const voucher = await prisma.voucher.findUnique({ where: { code: code.toUpperCase() } });
    if (!voucher || voucher.status !== "active") return res.status(404).json({ error: "Voucher tidak ditemukan" });
    res.json({ valid: true, discount_type: voucher.discount_type, discount_value: voucher.discount_value });
  } catch (e) { res.status(500).json({ error: "DB Error" }); }
});

// FAST ATTENDANCE CHECK-IN (Public)
app.post("/api/public/attendance/fast-checkin", async (req, res) => {
  const { membership_id, activity_id, mosque_id } = req.body;
  if (!membership_id || !activity_id || !mosque_id) return res.status(400).json({ error: "Missing parameters" });

  try {
    // 1. Find the member
    const member = await prisma.mosqueMember.findUnique({
      where: { membership_id }
    });

    if (!member || member.mosque_id !== mosque_id) {
       return res.status(404).json({ error: "Member tidak terdaftar di masjid ini" });
    }

    // 2. Find Activity
    const activity = await prisma.activity.findUnique({ where: { id: activity_id } });
    if (!activity) return res.status(404).json({ error: "Kegiatan tidak ditemukan" });

    // 3. Check if already checked-in
    const existing = await prisma.attendance.findFirst({
      where: { activity_id, member_phone: member.user_phone }
    });

    if (existing) {
      return res.json({ success: true, message: "Sudah terabsen sebelumnya", member_name: member.user_name });
    }

    // 4. Create Attendance Record
    const result = await prisma.$transaction(async (tx) => {
      const attendance = await tx.attendance.create({
        data: {
          activity_id,
          mosque_id,
          member_name: member.user_name,
          member_email: member.user_email,
          member_phone: member.user_phone,
          checked_in_at: new Date()
        }
      });

      // 5. Increment loyalty point
      await tx.mosqueMember.update({
        where: { id: member.id },
        data: { attendance_count: { increment: 1 } }
      });

      return attendance;
    });

    // 6. Optional: Send Telegram Notification
    try {
      const telegramId = member.user_phone; // Simple logic: using phone as proxy for testing, real bot uses chat_id
      const message = `🌟 *Alhamdulillah!* \n\nJazakallah khair, *${member.user_name}*! Bapak/Ibu telah tercatat hadir di kegiatan: \n\n📖 *${activity.title}*\n📍 ${mosque_id}\n\nSemoga berkah dan menjadi amal jariyah. Amin! 🙏`;
      
      // We check if bot settings exists for this mosque
      const settings = await prisma.telegramSettings.findUnique({ where: { mosque_id } });
      if (settings && settings.bot_enabled && settings.bot_token) {
        // Find chat_id if we have a mapping (for now simple broadcast if we have chat_id)
        if (settings.chat_id) {
           await axios.post(`https://api.telegram.org/bot${settings.bot_token}/sendMessage`, {
              chat_id: settings.chat_id,
              text: message,
              parse_mode: 'Markdown'
           }).catch(err => console.error("Telegram error:", err.message));
        }
      }
    } catch (err) { console.error("Telegram non-critical error:", err.message); }

    res.json({ success: true, member_name: member.user_name });
  } catch (e) {
    console.error("Fast Checkin Error:", e.message);
    res.status(500).json({ error: "Gagal memproses absensi: " + e.message });
  }
});

// GET ATTENDANCE LIST (With Filter)
app.get("/api/attendance", authenticateToken, async (req, res) => {
  const { activity_id, mosque_id } = req.query;
  try {
    const where = {};
    if (activity_id) where.activity_id = activity_id;
    if (mosque_id) where.mosque_id = mosque_id;

    const list = await prisma.attendance.findMany({
      where,
      orderBy: { checked_in_at: "desc" }
    });
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: "Gagal mengambil daftar hadir: " + e.message });
  }
});

/* ==================
   CORE AUTH & PROFILE
   ================== */

// OPTIONS handler for Preflight robustness
app.options("/api/auth/me", cors());

// GET ME
app.get("/api/auth/me", authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: "User tidak ditemukan" });
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: "Server error: " + e.message });
  }
});

// UPDATE ME (Self Profile / Mosque Switch)
app.patch("/api/auth/me", (req, res, next) => {
  console.log(`[AUTH-DEBUG] PATCH /api/auth/me reached! Body:`, JSON.stringify(req.body));
  next();
}, authenticateToken, async (req, res) => {
  const targetMosqueId = req.body.current_mosque_id;
  console.log(`[PATCH ME] Smart Switch Attempt: User ${req.user?.email} -> Mosque ${targetMosqueId}`);
  try {
    const { current_mosque_id, pin, ...updates } = req.body;
    const updateData = { ...updates };
    if (current_mosque_id) updateData.current_mosque_id = current_mosque_id;
    if (pin) updateData.pin = pin; // Gembok Safeti

    const result = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData
    });

    // TERBITKAN TOKEN BARU DENGAN MOSQUE_ID TERBARU
    const newToken = jwt.sign(
      { id: result.id, email: result.email, role: result.role, current_mosque_id: result.current_mosque_id }, 
      SECRET_KEY, 
      { expiresIn: "30d" }
    );

    console.log(`[PATCH ME] SUCCESS for User: ${result.email}`);
    res.json({ user: result, token: newToken });
  } catch (e) {
    console.error("[PATCH ME ERROR]", e.message);
    res.status(500).json({ error: "Gagal memperbarui profil: " + e.message });
  }
});

// LOGIN
app.post("/api/auth/login", async (req, res) => {
  const { identifier, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email: identifier.toLowerCase().trim() } });
    if (!user) return res.status(401).json({ error: "Email atau Password salah" });
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Email atau Password salah" });
    
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, current_mosque_id: user.current_mosque_id }, 
      SECRET_KEY, 
      { expiresIn: "30d" }
    );
    res.json({ token, user });
  } catch (e) { 
    res.status(500).json({ error: e.message }); 
  }
});

// REGISTER (BARU - Mendukung Landing Page)
app.post("/api/auth/register", async (req, res) => {
  const { name, email, password, subscription_plan, voucher_code } = req.body;
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: "Email sudah terdaftar" });

    const hash = await bcrypt.hash(password, 10);
    
    const mosque = await prisma.mosque.create({
      data: {
        name,
        email,
        subscription_plan: subscription_plan || "monthly",
        subscription_status: "active",
        subscription_start: new Date()
      }
    });

    const user = await prisma.user.create({
      data: {
        email,
        password: hash,
        full_name: `Admin ${name}`,
        role: "admin_masjid",
        current_mosque_id: mosque.id
      }
    });

    await prisma.mosqueMember.create({
      data: {
        user_email: email,
        user_name: `Admin ${name}`,
        mosque_id: mosque.id,
        role: "pengurus",
        status: "active"
      }
    });

    if (voucher_code) {
      try {
        const v = await prisma.voucher.findUnique({ where: { code: voucher_code.toUpperCase() } });
        if (v && v.status === "active") {
          await prisma.voucher.update({
            where: { id: v.id },
            data: { current_usage: { increment: 1 } }
          });
        }
      } catch (err) {}
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, current_mosque_id: user.current_mosque_id }, 
      SECRET_KEY, 
      { expiresIn: "30d" }
    );

    res.json({ token, user });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DYNAMIC CRUD (GENERIC)
app.post("/api/entities/:model", authenticateToken, async (req, res) => {
  const { model } = req.params;
  const prismaModel = Object.keys(prisma).find(k => k.toLowerCase() === model.toLowerCase());
  if (!prismaModel || !prisma[prismaModel]) return res.status(404).json({ error: "Tabel tidak ditemukan" });

  try {
    const { admin_password, ...data } = req.body;
    const result = await prisma[prismaModel].create({ data });

    if (prismaModel === "mosque" && admin_password) {
      const hash = await bcrypt.hash(admin_password, 10);
      await prisma.user.upsert({
        where: { email: data.email },
        update: { role: "admin_masjid", current_mosque_id: result.id, password: hash },
        create: { email: data.email, password: hash, full_name: `Admin ${data.name}`, role: "admin_masjid", current_mosque_id: result.id }
      });
      await prisma.mosqueMember.create({
        data: { user_email: data.email, user_name: `Admin ${data.name}`, mosque_id: result.id, role: "pengurus", status: "active" }
      });
    }
    
    // CATAT AKTIVITAS
    await logActivity(req.user.id, req.user.full_name || req.user.email, req.user.current_mosque_id, "ADD", model, result.id, `Menambahkan data baru di ${model}`);
    
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/entities/:model", authenticateToken, async (req, res) => {
  const { model } = req.params;
  const prismaModel = Object.keys(prisma).find(k => k.toLowerCase() === model.toLowerCase());
  if (!prismaModel || !prisma[prismaModel]) return res.status(404).json({ error: "Tabel tidak ditemukan" });

  try {
    const filters = req.query.filter ? JSON.parse(req.query.filter) : {};
    let sort = req.query.sort || "createdAt";
    const limit = parseInt(req.query.limit) || 100;
    const include = req.query.include ? JSON.parse(req.query.include) : undefined;

    // SMART SYNC: Proactively detect correct timestamp column based on schema
    const SNAKE_MODELS = ["user", "mosque", "license", "voucher"];
    const isSnake = SNAKE_MODELS.includes(model.toLowerCase());
    
    // Safety check for models that definitely DON'T have common dates
    const NO_DATE_MODELS = ["planfeatures", "rolepermission"];
    const hasNoDate = NO_DATE_MODELS.includes(model.toLowerCase());

    const orderConfig = {};
    if (sort.startsWith("-")) {
      const field = sort.substring(1);
      const targetField = (field === "createdAt" || field === "created_at") 
        ? (hasNoDate ? "id" : (isSnake ? "created_at" : "createdAt")) 
        : field;
      orderConfig[targetField] = "desc";
    } else {
      const targetField = (sort === "createdAt" || sort === "created_at") 
        ? (hasNoDate ? "id" : (isSnake ? "created_at" : "createdAt")) 
        : sort;
      orderConfig[targetField] = "asc";
    }

    let result;
    try {
      result = await prisma[prismaModel].findMany({
        where: filters,
        orderBy: orderConfig,
        take: limit,
        include
      });
    } catch (err) {
      console.warn(`[Server] Sort fallback for ${model}:`, err.message);
      try {
        result = await prisma[prismaModel].findMany({
          where: filters,
          orderBy: { id: "desc" },
          take: limit,
          include
        });
      } catch (err2) {
        result = await prisma[prismaModel].findMany({
          where: filters,
          take: limit,
          include
        });
      }
    }
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.patch("/api/entities/:model/:id", authenticateToken, async (req, res) => {
  const { model, id } = req.params;
  const prismaModel = Object.keys(prisma).find(k => k.toLowerCase() === model.toLowerCase());
  if (!prismaModel || !prisma[prismaModel]) return res.status(404).json({ error: "Tabel tidak ditemukan" });

  try {
    const data = req.body;
    const result = await prisma[prismaModel].update({
      where: { id },
      data,
    });

    // CATAT AKTIVITAS
    await logActivity(req.user.id, req.user.full_name || req.user.email, req.user.current_mosque_id, "EDIT", model, id, `Mengubah data di ${model}`);

    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete("/api/entities/:model/:id", authenticateToken, async (req, res) => {
  const { model, id } = req.params;
  const prismaModel = Object.keys(prisma).find(k => k.toLowerCase() === model.toLowerCase());
  if (!prismaModel || !prisma[prismaModel]) return res.status(404).json({ error: "Tabel tidak ditemukan" });

  try {
    const result = await prisma[prismaModel].delete({ where: { id } });
    
    // CATAT AKTIVITAS
    await logActivity(req.user.id, req.user.full_name || req.user.email, req.user.current_mosque_id, "DELETE", model, id, `Menghapus data di ${model}`);
    
    res.json({ success: true, result });
  } catch (e) {
    res.status(500).json({ error: "Gagal hapus: " + e.message });
  }
});

// ROLES MANAGEMENT
app.get("/api/auth/roles", authenticateToken, async (req, res) => {
  try {
    const { current_mosque_id } = req.user;
    // Get Global Roles (mosque_id is null) + Local Roles for this mosque
    const roles = await prisma.rolePermission.findMany({
      where: {
        OR: [
          { mosque_id: null },
          current_mosque_id ? { mosque_id: current_mosque_id } : { mosque_id: "UNDEFINED_MATCH" }
        ]
      },
      orderBy: [
        { mosque_id: "asc" }, // Global first (nulls)
        { role_name: "asc" }
      ]
    });
    res.json(roles);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/auth/roles", authenticateToken, async (req, res) => {
  const { role_name, permissions, mosque_id } = req.body;
  const { current_mosque_id, role } = req.user;

  try {
    // Priority:
    // 1. If superadmin sends mosque_id, use it.
    // 2. If it's a local update request (is_local), use current_mosque_id.
    // 3. Otherwise, if superadmin, use null (Global).
    let mId = null;
    if (role === "superadmin") {
      mId = mosque_id !== undefined ? mosque_id : null;
    } else {
      mId = current_mosque_id;
    }

    console.log(`[ROLES] Saving Role: ${role_name} for Mosque: ${mId}`);

    // LOGIC: Manual Upsert (Null-Safe for mosque_id)
    const existing = await prisma.rolePermission.findFirst({
      where: {
        role_name: role_name,
        mosque_id: mId
      }
    });

    let result;
    const permissionsData = typeof permissions === "string" ? permissions : JSON.stringify(permissions || {});

    if (existing) {
      console.log(`[ROLES] Updating existing: ${existing.id}`);
      result = await prisma.rolePermission.update({
        where: { id: existing.id },
        data: { permissions: permissionsData }
      });
    } else {
      console.log(`[ROLES] Creating new entry for ${role_name}`);
      result = await prisma.rolePermission.create({
        data: {
          role_name,
          mosque_id: mId,
          permissions: permissionsData
        }
      });
    }
    
    console.log(`[ROLES] SUCCESS - ID: ${result.id}`);
    res.json(result);
  } catch (e) {
    console.error("[ROLES CRITICAL ERROR]", e);
    res.status(500).json({ error: "Gagal simpan role: " + e.message });
  }
});

app.delete("/api/auth/roles/:roleName", authenticateToken, async (req, res) => {
  const { roleName } = req.params;
  const { current_mosque_id, role } = req.user;

  try {
    const isGlobal = (role === "superadmin" && !req.query.is_local);
    const mId = isGlobal ? null : current_mosque_id;

    // FIND FIRST BY ID (Don't use composite key because of NULL issues)
    const target = await prisma.rolePermission.findFirst({
      where: {
        role_name: roleName,
        mosque_id: mId
      }
    });

    if (target) {
      await prisma.rolePermission.delete({
        where: { id: target.id }
      });
      console.log(`[ROLES] Deleted role ID: ${target.id}`);
    }
    
    res.json({ success: true });
  } catch (e) { 
    console.error("[ROLES DELETE ERROR]", e);
    res.status(500).json({ error: "Gagal hapus: " + e.message }); 
  }
});

// Admin User Actions

// Catch-all Frontend Routing
app.use((req, res, next) => {
  if (req.method === "GET" && !req.path.startsWith("/api/")) {
    const indexPath = path.join(__dirname, "../dist/index.html");
    if (fs.existsSync(indexPath)) return res.sendFile(indexPath);
  }
  next();
});

app.listen(PORT, () => console.log(`[Server] Live on ${PORT}`));
