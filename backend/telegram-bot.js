/**
 * MasjidKu Smart - Telegram Bot Integration
 * Fitur:
 * 1. Notifikasi otomatis ke Telegram Channel/Group masjid
 * 2. Upload struk/bukti via Telegram Bot → AI OCR → auto-catat transaksi
 */

const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");

// Store active bot instances per mosque
const activeBots = new Map();
// Store pending state per chat (untuk konfirmasi transaksi dari struk)
const pendingConfirmations = new Map();

// ============================
// FORMAT HELPERS
// ============================
function formatCurrency(amount) {
  return "Rp " + parseFloat(amount || 0).toLocaleString("id-ID");
}

function formatDate(dateStr) {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function escapeMarkdown(text) {
  if (!text) return "";
  return String(text).replace(/[_*[\]()~`>#+=|{}.!-]/g, "\\$&");
}

// ============================
// TELEGRAM NOTIFICATION SENDER
// ============================

/**
 * Kirim notifikasi ke Telegram channel/group masjid
 */
async function sendTelegramNotification(botToken, chatId, message, options = {}) {
  if (!botToken || !chatId) return { success: false, error: "Bot token atau Chat ID tidak dikonfigurasi" };

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const payload = {
      chat_id: chatId,
      text: message,
      parse_mode: "HTML",
      disable_web_page_preview: true,
      ...options,
    };

    const response = await axios.post(url, payload, { timeout: 10000 });
    return { success: true, data: response.data };
  } catch (error) {
    const errMsg = error.response?.data?.description || error.message;
    console.error("[Telegram] Gagal kirim notifikasi:", errMsg);
    return { success: false, error: errMsg };
  }
}

/**
 * Kirim foto ke Telegram dengan caption
 */
async function sendTelegramPhoto(botToken, chatId, photoPath, caption) {
  if (!botToken || !chatId || !photoPath) return { success: false, error: "Parameter tidak lengkap" };

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendPhoto`;
    const form = new FormData();
    form.append("chat_id", chatId);
    form.append("caption", caption || "");
    form.append("parse_mode", "HTML");

    if (photoPath.startsWith("http")) {
      // Kirim via URL
      const photoForm = new FormData();
      photoForm.append("chat_id", chatId);
      photoForm.append("photo", photoPath);
      photoForm.append("caption", caption || "");
      photoForm.append("parse_mode", "HTML");
      const response = await axios.post(url, photoForm, {
        headers: photoForm.getHeaders(),
        timeout: 15000,
      });
      return { success: true, data: response.data };
    } else {
      // Kirim via file lokal
      form.append("photo", fs.createReadStream(photoPath));
      const response = await axios.post(url, form, {
        headers: form.getHeaders(),
        timeout: 30000,
      });
      return { success: true, data: response.data };
    }
  } catch (error) {
    const errMsg = error.response?.data?.description || error.message;
    console.error("[Telegram] Gagal kirim foto:", errMsg);
    return { success: false, error: errMsg };
  }
}

// ============================
// NOTIFICATION TEMPLATES
// ============================

function buildTransactionMessage(mosque, transaction) {
  const emoji = transaction.type === "income" ? "💰" : "💸";
  const typeLabel = transaction.type === "income" ? "PEMASUKAN" : "PENGELUARAN";
  const amountFmt = formatCurrency(transaction.amount);
  const dateFmt = formatDate(transaction.date);

  return (
    `${emoji} <b>Transaksi Keuangan Baru</b>\n` +
    `🏛️ <b>${mosque.name}</b>\n\n` +
    `📋 Jenis: <b>${typeLabel}</b>\n` +
    `💵 Jumlah: <b>${amountFmt}</b>\n` +
    (transaction.category ? `📂 Kategori: ${transaction.category}\n` : "") +
    (transaction.description ? `📝 Keterangan: ${transaction.description}\n` : "") +
    `📅 Tanggal: ${dateFmt}\n\n` +
    (transaction.receipt_url ? `🧾 <a href="${transaction.receipt_url}">Lihat Bukti Struk</a>\n\n` : "") +
    `<i>🕐 ${new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}</i>`
  );
}

function buildActivityMessage(mosque, activity, action = "baru") {
  const emoji = action === "baru" ? "📅" : action === "update" ? "✏️" : "✅";
  const statusEmojis = {
    upcoming: "🔜",
    completed: "✅",
    cancelled: "❌",
  };

  return (
    `${emoji} <b>Kegiatan ${action === "baru" ? "Baru" : action === "update" ? "Diperbarui" : "Selesai"}</b>\n` +
    `🏛️ <b>${mosque.name}</b>\n\n` +
    `📌 <b>${activity.title}</b>\n` +
    `${statusEmojis[activity.status] || ""} Status: ${activity.status}\n` +
    (activity.date ? `📅 Tanggal: ${formatDate(activity.date)}\n` : "") +
    (activity.time ? `⏰ Waktu: ${activity.time}\n` : "") +
    (activity.location ? `📍 Lokasi: ${activity.location}\n` : "") +
    (activity.speaker ? `🎤 Pemateri: ${activity.speaker}\n` : "") +
    (activity.description ? `\n📝 ${activity.description}\n` : "") +
    `\n<i>🕐 ${new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}</i>`
  );
}

function buildAnnouncementMessage(mosque, announcement) {
  return (
    `📢 <b>Pengumuman Penting</b>\n` +
    `🏛️ <b>${mosque.name}</b>\n\n` +
    `📌 <b>${announcement.title}</b>\n\n` +
    (announcement.content ? `${announcement.content}\n\n` : "") +
    `<i>🕐 ${new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}</i>`
  );
}

function buildDonationMessage(mosque, donation) {
  const statusEmojis = { pending: "⏳", completed: "✅", confirmed: "✅", rejected: "❌" };
  const statusLabels = {
    pending: "Menunggu Konfirmasi",
    completed: "Dikonfirmasi",
    confirmed: "Dikonfirmasi",
    rejected: "Ditolak",
  };

  return (
    `🤝 <b>Donasi Masuk</b>\n` +
    `🏛️ <b>${mosque.name}</b>\n\n` +
    (donation.donor_name ? `👤 Donatur: <b>${donation.donor_name}</b>\n` : `👤 Donatur: <i>Anonim</i>\n`) +
    `💵 Jumlah: <b>${formatCurrency(donation.amount)}</b>\n` +
    `${statusEmojis[donation.status] || "⏳"} Status: ${statusLabels[donation.status] || donation.status}\n` +
    (donation.payment_method ? `💳 Metode: ${donation.payment_method}\n` : "") +
    `\n<i>🕐 ${new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}</i>`
  );
}

// ============================
// AI OCR - BACA STRUK/BUKTI
// ============================

/**
 * Gunakan Gemini Vision API untuk membaca struk/nota pembayaran
 */
async function analyzeReceiptWithAI(imagePath, geminiApiKey) {
  if (!geminiApiKey) {
    return { success: false, error: "Gemini API Key belum dikonfigurasi di Pengaturan" };
  }

  try {
    // Baca file gambar dan konversi ke base64
    let imageBase64;
    let mimeType = "image/jpeg";

    if (imagePath.startsWith("http")) {
      // Download gambar dari URL
      const response = await axios.get(imagePath, { responseType: "arraybuffer", timeout: 30000 });
      imageBase64 = Buffer.from(response.data).toString("base64");
      const contentType = response.headers["content-type"];
      if (contentType) mimeType = contentType.split(";")[0];
    } else {
      const fileBuffer = fs.readFileSync(imagePath);
      imageBase64 = fileBuffer.toString("base64");
      const ext = path.extname(imagePath).toLowerCase();
      if (ext === ".png") mimeType = "image/png";
      else if (ext === ".webp") mimeType = "image/webp";
      else if (ext === ".heic") mimeType = "image/heic";
    }

    const prompt = `Anda adalah asisten pembaca struk/nota belanja yang handal. 
Analisis gambar struk/nota/kwitansi berikut dan ekstrak informasi dengan format JSON yang tepat.

Ekstrak informasi berikut:
- tanggal: tanggal transaksi (format YYYY-MM-DD, gunakan tanggal hari ini jika tidak ada)
- waktu: jam transaksi jika ada (format HH:MM)
- nama_toko: nama toko/merchant/vendor
- deskripsi: deskripsi singkat pembelian (maks 100 karakter)
- total: total pembayaran dalam angka (angka saja tanpa Rp atau koma/titik ribuan)
- kategori: kategori pengeluaran (pilih salah satu: Operasional, Konsumsi, Kebersihan, Listrik & Air, Gaji & Honor, Perlengkapan, Pemeliharaan, Kegiatan, Donasi, Lainnya)
- item_pembelian: array string berisi item-item yang dibeli (maks 5 item penting)
- mata_uang: mata uang yang digunakan (IDR, USD, dll)

Jika tidak bisa membaca informasi tertentu, gunakan nilai null.
Pastikan format output adalah JSON valid saja tanpa teks tambahan.

Contoh output:
{
  "tanggal": "2024-01-15",
  "waktu": "14:30",
  "nama_toko": "Toko Bangunan Maju",
  "deskripsi": "Pembelian alat kebersihan masjid",
  "total": 250000,
  "kategori": "Kebersihan",
  "item_pembelian": ["Sapu lidi 3 pcs", "Kain pel", "Sabun lantai"],
  "mata_uang": "IDR"
}`;

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;
    
    const payload = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: mimeType,
                data: imageBase64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 1024,
      },
    };

    const response = await axios.post(apiUrl, payload, {
      headers: { "Content-Type": "application/json" },
      timeout: 30000,
    });

    const responseText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    // Parse JSON dari response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        success: false,
        error: "AI tidak berhasil membaca struk. Coba foto lebih jelas dan terang.",
        rawResponse: responseText,
      };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      success: true,
      data: {
        date: parsed.tanggal || new Date().toISOString().slice(0, 10),
        time: parsed.waktu || null,
        store_name: parsed.nama_toko || null,
        description: parsed.deskripsi || "Pengeluaran dari struk",
        amount: parseFloat(parsed.total) || 0,
        category: parsed.kategori || "Lainnya",
        items: parsed.item_pembelian || [],
        currency: parsed.mata_uang || "IDR",
      },
    };
  } catch (error) {
    console.error("[AI OCR] Error:", error.response?.data || error.message);
    
    if (error.response?.status === 400) {
      return { success: false, error: "API Key Gemini tidak valid atau gambar tidak bisa diproses" };
    }
    if (error.response?.status === 429) {
      return { success: false, error: "Batas penggunaan AI tercapai, coba lagi nanti" };
    }
    
    return { success: false, error: "Gagal menganalisis struk: " + error.message };
  }
}

// ============================
// TELEGRAM BOT - UNTUK MASJID
// ============================

/**
 * Initialize Telegram Bot untuk satu masjid
 * Bot akan listen foto/gambar dari authorized users dan proses struk
 */
function initTelegramBot(mosqueId, botToken, prisma, geminiApiKey, serverBaseUrl) {
  if (!botToken) return null;
  if (activeBots.has(mosqueId)) {
    try {
      activeBots.get(mosqueId).stopPolling();
    } catch (e) {}
    activeBots.delete(mosqueId);
  }

  try {
    const bot = new TelegramBot(botToken, { polling: true });
    activeBots.set(mosqueId, bot);

    console.log(`[Telegram Bot] Aktif untuk masjid: ${mosqueId}`);

    // ===========================
    // COMMAND: /start
    // ===========================
    bot.onText(/\/start/, async (msg) => {
      const chatId = msg.chat.id;
      const user = msg.from;

      try {
        const mosque = await prisma.mosque.findUnique({ where: { id: mosqueId } });
        if (!mosque) return;

        const welcomeMsg =
          `🕌 <b>Selamat datang di Bot ${mosque.name}!</b>\n\n` +
          `Saya adalah asisten digital masjid yang membantu:\n\n` +
          `📸 <b>Upload Struk</b> — Kirim foto struk/nota pengeluaran, AI akan otomatis membaca dan mencatat ke laporan keuangan\n\n` +
          `📋 <b>Perintah tersedia:</b>\n` +
          `/start — Menu utama\n` +
          `/saldo — Cek saldo keuangan\n` +
          `/transaksi — 5 transaksi terakhir\n` +
          `/kegiatan — Kegiatan mendatang\n` +
          `/pengumuman — Pengumuman terbaru\n\n` +
          `💡 <b>Cara upload struk:</b>\n` +
          `Cukup kirim foto struk/nota ke bot ini. AI akan otomatis membaca dan minta konfirmasi sebelum dicatat.\n\n` +
          `<i>Powered by MasjidKu Smart 🤖</i>`;

        bot.sendMessage(chatId, welcomeMsg, { parse_mode: "HTML" });
      } catch (e) {
        console.error("[Bot /start]", e.message);
      }
    });

    // ===========================
    // COMMAND: /saldo
    // ===========================
    bot.onText(/\/saldo/, async (msg) => {
      const chatId = msg.chat.id;
      try {
        const mosque = await prisma.mosque.findUnique({ where: { id: mosqueId } });
        if (!mosque) return;

        const now = new Date();
        const thisMonthStr = now.toISOString().slice(0, 7);
        const transactions = await prisma.transaction.findMany({ where: { mosque_id: mosqueId } });
        const thisMonth = transactions.filter((t) => t.date && t.date.startsWith(thisMonthStr));

        const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + (t.amount || 0), 0);
        const totalExpense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + (t.amount || 0), 0);
        const thisIncome = thisMonth.filter((t) => t.type === "income").reduce((s, t) => s + (t.amount || 0), 0);
        const thisExpense = thisMonth.filter((t) => t.type === "expense").reduce((s, t) => s + (t.amount || 0), 0);

        const saldoMsg =
          `💰 <b>Saldo Keuangan ${mosque.name}</b>\n\n` +
          `📊 <b>Keseluruhan:</b>\n` +
          `✅ Total Pemasukan: ${formatCurrency(totalIncome)}\n` +
          `❌ Total Pengeluaran: ${formatCurrency(totalExpense)}\n` +
          `💳 <b>Saldo: ${formatCurrency(totalIncome - totalExpense)}</b>\n\n` +
          `📅 <b>Bulan Ini (${now.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}):</b>\n` +
          `✅ Pemasukan: ${formatCurrency(thisIncome)}\n` +
          `❌ Pengeluaran: ${formatCurrency(thisExpense)}\n` +
          `💳 Saldo Bulan Ini: ${formatCurrency(thisIncome - thisExpense)}\n\n` +
          `<i>🕐 ${now.toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}</i>`;

        bot.sendMessage(chatId, saldoMsg, { parse_mode: "HTML" });
      } catch (e) {
        bot.sendMessage(chatId, "❌ Gagal mengambil data saldo: " + e.message);
      }
    });

    // ===========================
    // COMMAND: /transaksi
    // ===========================
    bot.onText(/\/transaksi/, async (msg) => {
      const chatId = msg.chat.id;
      try {
        const mosque = await prisma.mosque.findUnique({ where: { id: mosqueId } });
        if (!mosque) return;

        const transactions = await prisma.transaction.findMany({
          where: { mosque_id: mosqueId },
          orderBy: { createdAt: "desc" },
          take: 5,
        });

        if (transactions.length === 0) {
          bot.sendMessage(chatId, "📭 Belum ada transaksi yang dicatat.");
          return;
        }

        let msg2 = `📋 <b>5 Transaksi Terakhir - ${mosque.name}</b>\n\n`;
        transactions.forEach((t, i) => {
          const emoji = t.type === "income" ? "💰" : "💸";
          msg2 += `${i + 1}. ${emoji} <b>${formatCurrency(t.amount)}</b>\n`;
          msg2 += `   📂 ${t.category || "Lainnya"} | 📅 ${formatDate(t.date)}\n`;
          if (t.description) msg2 += `   📝 ${t.description}\n`;
          msg2 += "\n";
        });

        bot.sendMessage(chatId, msg2, { parse_mode: "HTML" });
      } catch (e) {
        bot.sendMessage(chatId, "❌ Gagal mengambil data transaksi: " + e.message);
      }
    });

    // ===========================
    // COMMAND: /kegiatan
    // ===========================
    bot.onText(/\/kegiatan/, async (msg) => {
      const chatId = msg.chat.id;
      try {
        const mosque = await prisma.mosque.findUnique({ where: { id: mosqueId } });
        if (!mosque) return;

        const activities = await prisma.activity.findMany({
          where: { mosque_id: mosqueId, status: "upcoming" },
          orderBy: { date: "asc" },
          take: 5,
        });

        if (activities.length === 0) {
          bot.sendMessage(chatId, "📭 Tidak ada kegiatan mendatang yang terjadwal.");
          return;
        }

        let msg2 = `📅 <b>Kegiatan Mendatang - ${mosque.name}</b>\n\n`;
        activities.forEach((a, i) => {
          msg2 += `${i + 1}. 📌 <b>${a.title}</b>\n`;
          if (a.date) msg2 += `   📅 ${formatDate(a.date)}`;
          if (a.time) msg2 += ` ⏰ ${a.time}`;
          msg2 += "\n";
          if (a.location) msg2 += `   📍 ${a.location}\n`;
          if (a.speaker) msg2 += `   🎤 ${a.speaker}\n`;
          msg2 += "\n";
        });

        bot.sendMessage(chatId, msg2, { parse_mode: "HTML" });
      } catch (e) {
        bot.sendMessage(chatId, "❌ Gagal mengambil data kegiatan: " + e.message);
      }
    });

    // ===========================
    // COMMAND: /pengumuman
    // ===========================
    bot.onText(/\/pengumuman/, async (msg) => {
      const chatId = msg.chat.id;
      try {
        const mosque = await prisma.mosque.findUnique({ where: { id: mosqueId } });
        if (!mosque) return;

        const announcements = await prisma.announcement.findMany({
          where: { mosque_id: mosqueId, status: "published" },
          orderBy: { createdAt: "desc" },
          take: 3,
        });

        if (announcements.length === 0) {
          bot.sendMessage(chatId, "📭 Tidak ada pengumuman terbaru.");
          return;
        }

        let msg2 = `📢 <b>Pengumuman Terbaru - ${mosque.name}</b>\n\n`;
        announcements.forEach((a, i) => {
          msg2 += `${i + 1}. 📌 <b>${a.title}</b>\n`;
          if (a.content) msg2 += `   ${a.content.slice(0, 200)}${a.content.length > 200 ? "..." : ""}\n`;
          msg2 += "\n";
        });

        bot.sendMessage(chatId, msg2, { parse_mode: "HTML" });
      } catch (e) {
        bot.sendMessage(chatId, "❌ Gagal mengambil data pengumuman: " + e.message);
      }
    });

    // ===========================
    // HANDLE FOTO/GAMBAR - OCR Struk
    // ===========================
    bot.on("message", async (msg) => {
      const chatId = msg.chat.id;

      // Cek apakah ada foto
      if (!msg.photo && !msg.document?.mime_type?.startsWith("image/")) return;

      try {
        // Kirim pesan "sedang memproses"
        const processingMsg = await bot.sendMessage(
          chatId,
          "🤖 Memproses gambar struk... Mohon tunggu sebentar.",
          { parse_mode: "HTML" }
        );

        // Dapatkan file dari Telegram
        let fileId;
        if (msg.photo) {
          fileId = msg.photo[msg.photo.length - 1].file_id; // Ambil resolusi tertinggi
        } else {
          fileId = msg.document.file_id;
        }

        // Download file dari Telegram
        const fileInfo = await bot.getFile(fileId);
        const filePath = fileInfo.file_path;
        const fileUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;

        // Analisis dengan AI
        const aiResult = await analyzeReceiptWithAI(fileUrl, geminiApiKey);

        if (!aiResult.success) {
          await bot.editMessageText(
            `❌ <b>Gagal membaca struk</b>\n\n${aiResult.error}\n\n💡 Tips: Pastikan foto terang, tidak buram, dan struk terlihat jelas.`,
            { chat_id: chatId, message_id: processingMsg.message_id, parse_mode: "HTML" }
          );
          return;
        }

        const d = aiResult.data;
        const confirmKey = `${chatId}_${Date.now()}`;

        // Simpan ke pending untuk konfirmasi
        pendingConfirmations.set(chatId.toString(), {
          mosqueId,
          data: d,
          fileUrl,
          confirmKey,
          timestamp: Date.now(),
        });

        // Tampilkan hasil AI dan minta konfirmasi
        let confirmMsg =
          `✅ <b>Struk berhasil dibaca!</b>\n\n` +
          `📋 <b>Detail yang terdeteksi:</b>\n` +
          `📅 Tanggal: <b>${formatDate(d.date)}</b>${d.time ? ` ⏰ ${d.time}` : ""}\n` +
          `🏪 Toko/Vendor: <b>${d.store_name || "-"}</b>\n` +
          `💵 Total: <b>${formatCurrency(d.amount)}</b>\n` +
          `📂 Kategori: <b>${d.category}</b>\n` +
          `📝 Keterangan: ${d.description}\n`;

        if (d.items && d.items.length > 0) {
          confirmMsg += `\n🛒 <b>Item Pembelian:</b>\n`;
          d.items.forEach((item) => {
            confirmMsg += `  • ${item}\n`;
          });
        }

        confirmMsg +=
          `\n❓ <b>Apakah data ini benar?</b>\n` +
          `Pencatatan akan disimpan sebagai <b>PENGELUARAN</b> otomatis.\n\n` +
          `✅ Balas <code>/konfirmasi</code> untuk simpan\n` +
          `❌ Balas <code>/batal</code> untuk batalkan`;

        await bot.editMessageText(confirmMsg, {
          chat_id: chatId,
          message_id: processingMsg.message_id,
          parse_mode: "HTML",
        });
      } catch (error) {
        console.error("[Bot OCR] Error:", error);
        bot.sendMessage(chatId, "❌ Terjadi kesalahan saat memproses gambar: " + error.message);
      }
    });

    // ===========================
    // COMMAND: /konfirmasi — simpan transaksi dari struk
    // ===========================
    bot.onText(/\/konfirmasi/, async (msg) => {
      const chatId = msg.chat.id;
      const chatKey = chatId.toString();

      const pending = pendingConfirmations.get(chatKey);
      if (!pending) {
        bot.sendMessage(chatId, "❌ Tidak ada struk yang menunggu konfirmasi. Kirim foto struk terlebih dahulu.");
        return;
      }

      // Hapus pending setelah 5 menit
      if (Date.now() - pending.timestamp > 5 * 60 * 1000) {
        pendingConfirmations.delete(chatKey);
        bot.sendMessage(chatId, "⏰ Sesi konfirmasi sudah kedaluwarsa. Kirim foto struk lagi.");
        return;
      }

      try {
        const d = pending.data;
        const mosque = await prisma.mosque.findUnique({ where: { id: pending.mosqueId } });

        // Simpan ke database sebagai transaksi pengeluaran
        const transaction = await prisma.transaction.create({
          data: {
            mosque_id: pending.mosqueId,
            type: "expense",
            amount: d.amount,
            category: d.category,
            description: `${d.description}${d.store_name ? ` (${d.store_name})` : ""}${d.time ? ` - ${d.time}` : ""}`,
            date: d.date,
            receipt_url: pending.fileUrl,
            source: "telegram_bot",
          },
        });

        pendingConfirmations.delete(chatKey);

        const successMsg =
          `🎉 <b>Transaksi berhasil dicatat!</b>\n\n` +
          `💸 <b>Pengeluaran: ${formatCurrency(d.amount)}</b>\n` +
          `📂 Kategori: ${d.category}\n` +
          `📝 ${d.description}\n` +
          `📅 ${formatDate(d.date)}\n` +
          `🧾 Bukti struk tersimpan\n\n` +
          `<i>Data sudah masuk ke laporan keuangan ${mosque?.name}.</i>`;

        bot.sendMessage(chatId, successMsg, { parse_mode: "HTML" });
      } catch (error) {
        console.error("[Bot Konfirmasi]", error);
        bot.sendMessage(chatId, "❌ Gagal menyimpan transaksi: " + error.message);
      }
    });

    // ===========================
    // COMMAND: /batal — batalkan konfirmasi
    // ===========================
    bot.onText(/\/batal/, (msg) => {
      const chatId = msg.chat.id;
      pendingConfirmations.delete(chatId.toString());
      bot.sendMessage(chatId, "✅ Pembatalan berhasil. Data struk tidak jadi dicatat.");
    });

    // Handle errors
    bot.on("polling_error", (error) => {
      if (error.code === "ETELEGRAM") {
        console.error(`[Telegram Bot][${mosqueId}] Polling error:`, error.message);
      }
    });

    return bot;
  } catch (error) {
    console.error(`[Telegram Bot] Gagal inisialisasi untuk masjid ${mosqueId}:`, error.message);
    return null;
  }
}

/**
 * Stop Telegram Bot untuk masjid tertentu
 */
function stopTelegramBot(mosqueId) {
  if (activeBots.has(mosqueId)) {
    try {
      activeBots.get(mosqueId).stopPolling();
      activeBots.delete(mosqueId);
      console.log(`[Telegram Bot] Stopped untuk masjid: ${mosqueId}`);
    } catch (e) {
      console.error("[Telegram Bot] Error stopping bot:", e.message);
    }
  }
}

/**
 * Test koneksi bot Telegram
 */
async function testBotConnection(botToken) {
  try {
    const response = await axios.get(`https://api.telegram.org/bot${botToken}/getMe`, { timeout: 10000 });
    if (response.data.ok) {
      return { success: true, bot: response.data.result };
    }
    return { success: false, error: "Token tidak valid" };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.description || "Gagal terhubung ke Telegram",
    };
  }
}

/**
 * Validasi Chat ID dengan mengirim pesan test
 */
async function testSendNotification(botToken, chatId) {
  const result = await sendTelegramNotification(
    botToken,
    chatId,
    `✅ <b>Koneksi Berhasil!</b>\n\nBot MasjidKu Smart berhasil terhubung ke grup/channel ini.\nNotifikasi transaksi, kegiatan, dan pengumuman akan dikirim ke sini.\n\n<i>MasjidKu Smart 🕌</i>`
  );
  return result;
}

module.exports = {
  sendTelegramNotification,
  sendTelegramPhoto,
  buildTransactionMessage,
  buildActivityMessage,
  buildAnnouncementMessage,
  buildDonationMessage,
  analyzeReceiptWithAI,
  initTelegramBot,
  stopTelegramBot,
  testBotConnection,
  testSendNotification,
};
