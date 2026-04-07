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
const prisma = new PrismaClient({
  log: ['error', 'warn'],
});
const app = express();

// GLOBAL ERROR HANDLERS (Prevent Crashes)
process.on('unhandledRejection', (reason, promise) => {
  console.error('\x1b[31m[FATAL] Unhandled Rejection at:\x1b[0m', promise, '\x1b[31mreason:\x1b[0m', reason);
  // Optional: Send to monitoring service
});

process.on('uncaughtException', (err) => {
  console.error('\x1b[31m[FATAL] Uncaught Exception:\x1b[0m', err.message);
  console.error(err.stack);
  // Give some time to log before exit
  setTimeout(() => process.exit(1), 1000);
});

// Database Connection Monitoring
prisma.$connect()
  .then(() => console.log("\x1b[32m[Database]\x1b[0m Connected successfully to remote MySQL server."))
  .catch((err) => {
    console.error("\x1b[31m[Database] Connection FAILED:\x1b[0m", err.message);
    console.error("Check your DATABASE_URL and network connectivity to 157.66.34.199");
  });

// MULTER CONFIGURATION FOR LOGO (Limited to 500KB)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ 
  storage,
  limits: { fileSize: 500 * 1024 } // Max 500KB
});

// DEBUG: Log available models
console.log("[Prisma] Rak Database Terdeteksi:", Object.keys(prisma).filter(k => !k.startsWith("_")));

const PORT = process.env.PORT || 3000;
// PEMBERSIH KUNCI OTOMATIS: Pastikan tidak ada tanda kutip yang tersisa dari .env
const SECRET_KEY = (process.env.JWT_SECRET || "mesjidkusupersecret_091k2j3").replace(/['"]+/g, "");

// Basic Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// REQUEST LOGGER (Terminal Visibility)
app.use((req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`\x1b[36m[API-WRITE]\x1b[0m ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    });
  }
  next();
});

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
    url.includes("/entities/Mosque") || 
    url.includes("/entities/PlanFeatures") ||
    url.includes("/entities/AppSettings") ||
    url.includes("/public/") ||
    url.includes("/attendance/fast-checkin")
  ));

  if (isPublic) {
    return next();
  }

  const authHeader = req.headers["authorization"] || req.headers["Authorization"];
  const token = (authHeader && authHeader.split(" ")[1]) || req.query.token;
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
  // Always log to terminal for transparency
  const timestamp = new Date().toLocaleString('id-ID');
  const terminalPrefix = mosqueId ? `\x1b[33m[AUDIT - MS:${mosqueId}]\x1b[0m` : `\x1b[35m[AUDIT - SYSTEM]\x1b[0m`;
  console.log(`${terminalPrefix} ${action} on ${entity} by ${userName || 'System'}: ${description}`);

  if (!userId) return; // Skip DB if no user context
  try {
    await prisma.auditLog.create({
      data: {
        user_id: userId,
        user_name: userName || "System",
        mosque_id: mosqueId || null,
        action,
        entity,
        entity_id: String(entityId),
        description
      }
    });
  } catch (err) {
    console.error("\x1b[31m[AuditLog Error]\x1b[0m", err.message);
  }
};

/* ==================
   INTEGRATIONS: UPLOAD (FOR LOGO ONLY)
   ================== */
app.post("/api/integrations/core/uploadfile", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Sertakan file untuk diunggah" });
  try {
    const protocol = req.protocol;
    const host = req.get("host");
    const file_url = `${protocol}://${host}/uploads/${req.file.filename}`;
    console.log(`[UPLOAD] Logo received: ${req.file.filename} -> ${file_url}`);
    res.json({ file_url });
  } catch (err) {
    console.error("[UPLOAD ERROR]", err.message);
    res.status(500).json({ error: "Gagal memproses logo. Pastikan ukuran di bawah 500KB." });
  }
});

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
    const startDB = Date.now();
    const user = await prisma.user.findUnique({ 
        where: { email: identifier?.toLowerCase().trim() },
        // Add a slight timeout for DB operations to detect network lag
    });
    const dbDuration = Date.now() - startDB;
    if (dbDuration > 1000) console.warn(`\x1b[33m[PERF]\x1b[0m Slow DB query on login: ${dbDuration}ms`);

    if (!user) {
      console.warn(`[AUTH] Login failed: User not found (${identifier})`);
      return res.status(401).json({ error: "Email atau Password salah" });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.warn(`[AUTH] Login failed: Password mismatch for ${identifier}`);
      return res.status(401).json({ error: "Email atau Password salah" });
    }
    
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, current_mosque_id: user.current_mosque_id }, 
      SECRET_KEY, 
      { expiresIn: "30d" }
    );

    console.log(`\x1b[32m[AUTH] Login SUCCESS:\x1b[0m ${user.email} (DB: ${dbDuration}ms)`);
    res.json({ token, user });
  } catch (e) { 
    console.error(`\x1b[31m[AUTH ERROR]\x1b[0m Login crash for ${identifier}:`, e.message);
    res.status(500).json({ error: "Terjadi gangguan jaringan atau server (DB Request Timeout)" }); 
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

    // CATAT AKTIVITAS: Registrasi Mandiri
    await logActivity(user.id, user.full_name || user.email, user.current_mosque_id, "REGISTER", "User", user.id, `Pendaftaran mandiri masjid: ${name}`);

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

    if (model.toLowerCase() === "mosque" && admin_password) {
      const hash = await bcrypt.hash(admin_password, 10);
      const adminEmail = data.email.toLowerCase().trim();
      
      // Upsert the admin user associated with this mosque
      const adminUser = await prisma.user.upsert({
        where: { email: adminEmail },
        update: { role: "admin_masjid", current_mosque_id: result.id, password: hash },
        create: { 
          email: adminEmail, 
          password: hash, 
          full_name: `Admin ${data.name}`, 
          role: "admin_masjid", 
          current_mosque_id: result.id 
        }
      });

      // Ensure they are also in MosqueMember table
      await prisma.mosqueMember.upsert({
        where: { membership_id: `ADM-${result.id}` }, // Deterministic ID for admin
        update: { user_email: adminEmail, user_name: `Admin ${data.name}`, role: "pengurus", status: "active" },
        create: { 
          user_email: adminEmail, 
          user_name: `Admin ${data.name}`, 
          mosque_id: result.id, 
          role: "pengurus", 
          status: "active",
          membership_id: `ADM-${result.id}`
        }
      });
      
      console.log(`[AUTH] Admin user created/updated for new Mosque: ${result.id} (${adminEmail})`);
      await logActivity(req.user.id, req.user.full_name || req.user.email, null, "SYSTEM_ADD", "Mosque", result.id, `Mendaftarkan Masjid: ${data.name}`);
    }
    
    // LOG SCOPE: Superadmin actions on system entities should be mosque_id: null
    const logMosqueId = (req.user.role === 'superadmin' && ['mosque', 'planfeatures', 'appsettings', 'license', 'voucher', 'user'].includes(model.toLowerCase())) 
      ? null 
      : req.user.current_mosque_id;

    // CATAT AKTIVITAS
    await logActivity(req.user.id, req.user.full_name || req.user.email, logMosqueId, "ADD", model, result.id, `Menambahkan data baru di ${model}`);
    
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
    let filters = req.query.filter ? JSON.parse(req.query.filter) : {};
    
    // SECURITY: Enforce mosque_id filtering for Non-Superadmin on sensitive models
    if (model.toLowerCase() === "auditlog" && req.user.role !== "superadmin") {
      const mid = req.user.current_mosque_id || "MISSING";
      filters.mosque_id = mid;
    }
    let sort = req.query.sort || "-created_at"; // Default sort
    const limit = parseInt(req.query.limit) || 100;
    const include = req.query.include ? JSON.parse(req.query.include) : undefined;

    // SMART SYNC: Proactively detect correct timestamp column based on schema
    const SNAKE_MODELS = ["user", "mosque", "license", "voucher", "rolepermission", "planfeatures"];
    const isSnake = SNAKE_MODELS.includes(model.toLowerCase());
    
    // Safety check for models that definitely DON'T have common dates
    const NO_DATE_MODELS = ["appsettings", "telegramsettings"];
    const hasNoDate = NO_DATE_MODELS.includes(model.toLowerCase());

    const orderConfig = {};
    if (sort) {
      const isDesc = sort.startsWith("-");
      const field = isDesc ? sort.substring(1) : sort;
      
      let targetField = field;
      if (field.toLowerCase() === "createdat" || field.toLowerCase() === "created_at" || field.toLowerCase() === "created_date") {
        targetField = hasNoDate ? "id" : (isSnake ? "created_at" : "createdAt");
        
        // Final override for specific known problematic models
        if (model.toLowerCase() === "planfeatures") targetField = "created_at";
        if (model.toLowerCase() === "donation" && !isSnake) targetField = "createdAt";
      }
      orderConfig[targetField] = isDesc ? "desc" : "asc";
    }

    try {
      const data = await prisma[prismaModel].findMany({
        where: filters,
        take: limit,
        orderBy: orderConfig,
        include: include
      });

      // SECURITY: Scrub sensitive keys from AppSettings if called publicly
      if (model.toLowerCase() === "appsettings" && !req.headers["authorization"]) {
        return res.json(data.map(s => {
          const { midtrans_server_key, midtrans_client_key, gemini_api_key, ...safe } = s;
          return safe;
        }));
      }

      return res.json(data);
    } catch (dbErr) {
      console.warn(`[Server] Falling back to ID sort for ${model}:`, dbErr.message);
      try {
        const fallbackData = await prisma[prismaModel].findMany({
          where: filters,
          take: limit,
          orderBy: { id: "desc" },
          include: include
        });
        return res.json(fallbackData);
      } catch (fallbackErr) {
        // Absolute last resort: No sorting
        const rawData = await prisma[prismaModel].findMany({
          where: filters,
          take: limit,
          include: include
        });
        return res.json(rawData);
      }
    }
  } catch (e) {
    console.error(`[FATAL] 500 Error on Model: ${model}. Message:`, e.message);
    if (e.code) console.error(`[Prisma Error Code]`, e.code);
    res.status(500).json({ error: e.message });
  }
});

app.patch("/api/entities/:model/:id", authenticateToken, async (req, res) => {
  const { model, id } = req.params;
  const prismaModel = Object.keys(prisma).find(k => k.toLowerCase() === model.toLowerCase());
  if (!prismaModel || !prisma[prismaModel]) return res.status(404).json({ error: "Tabel tidak ditemukan" });

  try {
    const { admin_password, id: bodyId, ...data } = req.body;
    
    console.log(`[CRUD-UPDATE] Target Model: ${prismaModel}, ID: ${id}`);
    console.log(`[CRUD-UPDATE] Sanity Check - Body ID: ${bodyId}, URL ID: ${id}`);
    console.log(`[CRUD-UPDATE] Payload:`, JSON.stringify(data));

    // Ensure we don't try to update fields that are not in the record or are immutable
    const result = await prisma[prismaModel].update({
      where: { id },
      data,
    });
    console.log(`[CRUD-UPDATE] SUCCESS: ${id}`);

    // Update Admin Password if provided (specifically for Mosque edits)
    if (model.toLowerCase() === "mosque" && admin_password) {
      const hash = await bcrypt.hash(admin_password, 10);
      const adminEmail = (data.email || result.email)?.toLowerCase().trim();
      
      if (adminEmail) {
        // 1. Update the User record directly (more reliable than updateMany by role)
        await prisma.user.update({
          where: { email: adminEmail },
          data: { password: hash }
        }).catch(err => console.warn(`[AUTH] Failed to update user password for ${adminEmail}:`, err.message));

        console.log(`[AUTH] Admin password reset for Mosque: ${id} (${adminEmail})`);
      }
    }

    // AUTO-SYNC PRAYER TIMES IF COORDINATES UPDATED (Backgrounded to avoid hang)
    if (model.toLowerCase() === "mosque" && (data.latitude || data.longitude)) {
      (async () => {
        try {
          const lat = data.latitude || result.latitude;
          const lng = data.longitude || result.longitude;
          if (lat && lng) {
            const today = new Date().toISOString().split('T')[0];
            const url = `http://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lng}&method=20`; 
            const axios = require('axios');
            const pRes = await axios.get(url, { timeout: 3000 });
            if (pRes.data && pRes.data.data) {
                const t = pRes.data.data.timings;
                const mosqueData = {
                  subuh: t.Fajr,
                  dzuhur: t.Dhuhr,
                  ashar: t.Asr,
                  maghrib: t.Maghrib,
                  isya: t.Isha,
                  created_date: today
                };
                await prisma.prayerTime.upsert({
                    where: { id: `AUTO-${result.id}-${today}` },
                    update: mosqueData,
                    create: { id: `AUTO-${result.id}-${today}`, mosque_id: result.id, ...mosqueData }
                });
                console.log(`[SYNC] Prayer times updated for ${result.name}`);
            }
          }
        } catch (e) {
          console.warn("[SYNC ERROR] Failed to fetch prayer times:", e.message);
        }
      })();
    }

    // LOG SCOPE: Superadmin actions on system entities should be mosque_id: null
    const logMosqueId = (req.user.role === 'superadmin' && ['mosque', 'planfeatures', 'appsettings', 'license', 'voucher', 'user'].includes(model.toLowerCase())) 
      ? null 
      : req.user.current_mosque_id;

    // CATAT AKTIVITAS
    await logActivity(req.user.id, req.user.full_name || req.user.email, logMosqueId, "EDIT", model, id, `Mengubah data di ${model}`);

    res.json(result);
  } catch (e) {
    console.error(`[FATAL PATCH ERROR] Model: ${model}, ID: ${id}. Message:`, e);
    if (e.code) console.error(`[Prisma Error Code]`, e.code);
    res.status(500).json({ error: e.message });
  }
});

app.delete("/api/entities/:model/:id", authenticateToken, async (req, res) => {
  const { model, id } = req.params;
  const prismaModel = Object.keys(prisma).find(k => k.toLowerCase() === model.toLowerCase());
  if (!prismaModel || !prisma[prismaModel]) return res.status(404).json({ error: "Tabel tidak ditemukan" });

  try {
    const result = await prisma[prismaModel].delete({ where: { id } });
    
    // LOG SCOPE: Superadmin actions on system entities should be mosque_id: null
    const logMosqueId = (req.user.role === 'superadmin' && ['mosque', 'planfeatures', 'appsettings', 'license', 'voucher', 'user'].includes(model.toLowerCase())) 
      ? null 
      : req.user.current_mosque_id;

    // CATAT AKTIVITAS
    await logActivity(req.user.id, req.user.full_name || req.user.email, logMosqueId, "DELETE", model, id, `Menghapus data di ${model}`);
    
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
    
    // CATAT AKTIVITAS
    await logActivity(req.user.id, req.user.full_name || req.user.email, req.user.current_mosque_id, existing ? "EDIT" : "ADD", "Roles", result.id, `${existing ? 'Mengubah' : 'Menambah'} role ${role_name}`);
    
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
      
      // CATAT AKTIVITAS
      await logActivity(req.user.id, req.user.full_name || req.user.email, req.user.current_mosque_id, "DELETE", "Roles", target.id, `Menghapus role ${roleName}`);
    }
    
    res.json({ success: true });
  } catch (e) { 
    console.error("[ROLES DELETE ERROR]", e);
    res.status(500).json({ error: "Gagal hapus: " + e.message }); 
  }
});

// Admin User Actions

// Admin User Actions: Change Password
app.post("/api/auth/admin-change-password", authenticateToken, async (req, res) => {
  if (req.user.role !== 'superadmin' && req.user.role !== 'admin_masjid') {
    return res.status(403).json({ error: "Hanya Admin yang dapat mengubah password pengurus" });
  }

  const { userId, email, newPassword } = req.body;
  try {
    const hash = await bcrypt.hash(newPassword, 10);
    const where = userId ? { id: userId } : { email: email.toLowerCase().trim() };
    
    // Find target user first to check mosque access
    const target = await prisma.user.findUnique({ where });
    if (!target) return res.status(404).json({ error: "User tidak ditemukan" });

    // SECURITY: admin_masjid only can change users in their own mosque
    if (req.user.role === 'admin_masjid' && target.current_mosque_id !== req.user.current_mosque_id) {
       return res.status(403).json({ error: "Tidak memiliki akses ke user masjid lain" });
    }

    const result = await prisma.user.update({
      where,
      data: { password: hash }
    });

    // CATAT AKTIVITAS
    await logActivity(req.user.id, req.user.full_name || req.user.email, req.user.current_mosque_id, "EDIT", "UserPassword", target.id, `Reset password untuk ${target.email}`);

    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Admin User Actions: Invite
app.post("/api/users/invite", authenticateToken, async (req, res) => {
  if (req.user.role !== 'superadmin' && req.user.role !== 'admin_masjid') {
    return res.status(403).json({ error: "Unauthorized" });
  }

  const { email, role } = req.body;
  if (!email) return res.status(400).json({ error: "Email wajib diisi" });

  try {
    const cleanEmail = email.toLowerCase().trim();
    const tempPassword = Math.random().toString(36).substring(2, 10);
    const hash = await bcrypt.hash(tempPassword, 10);

    // Actually create the user so they appear in the list
    const user = await prisma.user.upsert({
      where: { email: cleanEmail },
      update: { role: role || "user" },
      create: {
        email: cleanEmail,
        password: hash,
        role: role || "user",
        full_name: cleanEmail.split('@')[0],
        current_mosque_id: req.user.current_mosque_id
      }
    });

    if (req.user.current_mosque_id) {
        await prisma.mosqueMember.upsert({
            where: { user_email: cleanEmail }, // Assuming one member per email for simplicity
            update: { role: role || "pengurus", status: "active" },
            create: {
                user_email: cleanEmail,
                user_name: cleanEmail.split('@')[0],
                mosque_id: req.user.current_mosque_id,
                role: role || "pengurus",
                status: "active"
            }
        });
    }
    
    // CATAT AKTIVITAS
    await logActivity(req.user.id, req.user.full_name || req.user.email, req.user.current_mosque_id, "INVITE", "User", user.id, `Mengundang user baru: ${email} sebagai ${role}`);

    res.json({ 
        success: true, 
        message: `Undangan berhasil dikirim ke ${email}. Password sementara: ${tempPassword}`,
        tempPassword 
    });
  } catch (e) { 
    console.error("[CRUD ERROR]", e);
    res.status(e.code === 'P2002' ? 409 : 500).json({ 
      error: e.message,
      detail: e.meta,
      code: e.code
    }); 
  }
});


// EXPORT DATA MASJID (UNTUK PINDAH HOSTING)
app.get("/api/admin/mosques/export/:id", authenticateToken, async (req, res) => {
  if (req.user.role !== "superadmin") {
    return res.status(403).json({ error: "Hanya Superadmin yang dapat mengekspor data entitas" });
  }

  const { id } = req.params;

  try {
    const mosque = await prisma.mosque.findUnique({ where: { id } });
    if (!mosque) return res.status(404).json({ error: "Masjid tidak ditemukan" });

    // VERIFIKASI LISENSI AKTIF (Proteksi Pemindahan Tanpa Izin)
    const activeLicense = await prisma.license.findFirst({
      where: { 
        mosque_id: id,
        status: "active"
      }
    });

    if (!activeLicense) {
      return res.status(403).json({ error: "Entitas ini tidak memiliki Lisensi aktif. Pemindahan/Ekspor ke hosting mandiri ditolak. Silakan daftarkan Lisensi terlebih dahulu." });
    }

    // Daftar Tabel yang perlu diekspor (filtered by mosque_id)
    const tables = [
      "mosqueMember", "transaction", "activity", "announcement", 
      "donation", "mustahik", "aidDistribution", "qurbanAnimal", 
      "qurbanParticipant", "asset", "assetMaintenance", "prayerTime", 
      "jumatOfficer", "telegramSettings", "attendance", "auditLog", "rolePermission"
    ];

    const exportData = {
      mosque: mosque,
      entities: {}
    };

    // Ambil data untuk setiap tabel
    for (const table of tables) {
      if (prisma[table]) {
        exportData.entities[table] = await prisma[table].findMany({
          where: { mosque_id: id }
        });
      }
    }

    // Ambil data User yang terlibat (via MosqueMember)
    const members = exportData.entities.mosqueMember || [];
    const userEmails = members.map(m => m.user_email);
    exportData.users = await prisma.user.findMany({
      where: { email: { in: userEmails } }
    });

    // Set Header untuk Download File
    res.setHeader('Content-disposition', `attachment; filename=export-smart-${mosque.slug || mosque.id}.json`);
    res.setHeader('Content-type', 'application/json');
    res.json(exportData);
  } catch (err) {
    console.error("[EXPORT ERROR]", err.message);
    res.status(500).json({ error: "Gagal memproses ekspor data: " + err.message });
  }
});

// Catch-all Frontend Routing
app.use((req, res, next) => {
  if (req.method === "GET" && !req.path.startsWith("/api/")) {
    const indexPath = path.join(__dirname, "../dist/index.html");
    if (fs.existsSync(indexPath)) return res.sendFile(indexPath);
  }
  next();
});

app.listen(PORT, () => console.log(`[Server] Live on ${PORT}`));
