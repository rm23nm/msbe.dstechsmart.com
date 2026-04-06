// seed-settings.js — Seed AppSettings dan PlanFeatures
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ALL_FEATURES = [
  "Jadwal Shalat & Jumat",
  "Manajemen Keuangan",
  "Kelola Data Jamaah",
  "Inventory Aset Masjid",
  "Halaman Publik Masjid",
  "Digital Signage (Public TV)",
  "Pengumuman & Notifikasi",
  "AI Analytics & Insights",
  "Manajemen Donasi & Zakat",
  "Laporan & Analytics",
  "Manajemen Kegiatan",
  "Absensi & Tracking Kehadiran",
];

async function seedSettings() {
  // 1. AppSettings
  const existingSettings = await prisma.appSettings.findFirst();
  if (!existingSettings) {
    await prisma.appSettings.create({
      data: {
        app_name: "MasjidKu Smart",
        app_tagline: "Platform Digital Terlengkap untuk Manajemen Masjid",
        whatsapp_number: "6281234567890",
        contact_email: "info@masjidkusmart.id",
        contact_phone: "+62 812-3456-7890",
        midtrans_environment: "sandbox",
      }
    });
    console.log("✅ AppSettings seeded");
  } else {
    console.log("ℹ️  AppSettings sudah ada, skip");
  }

  // 2. PlanFeatures
  const plans = [
    {
      plan: "trial",
      description: "Gratis 30 hari untuk masjid baru",
      price: 0,
      features: JSON.stringify(ALL_FEATURES.slice(0, 6)),
      is_popular: false,
      max_mosques: 1,
      storage_gb: 1,
    },
    {
      plan: "monthly",
      description: "Paket bulanan dengan akses penuh",
      price: 150000,
      features: JSON.stringify(ALL_FEATURES),
      is_popular: false,
      max_mosques: -1,
      storage_gb: 10,
    },
    {
      plan: "yearly",
      description: "Paket tahunan, hemat 30%! (Paling Populer)",
      price: 1260000,
      features: JSON.stringify(ALL_FEATURES),
      is_popular: true,
      max_mosques: -1,
      storage_gb: -1,
    },
  ];

  for (const plan of plans) {
    const existing = await prisma.planFeatures.findUnique({ where: { plan: plan.plan } });
    if (!existing) {
      await prisma.planFeatures.create({ data: plan });
      console.log(`✅ PlanFeatures [${plan.plan}] seeded`);
    } else {
      console.log(`ℹ️  PlanFeatures [${plan.plan}] sudah ada, skip`);
    }
  }

  console.log("\n🎉 Seeding selesai!");
}

seedSettings()
  .catch(e => console.error("❌ Error:", e))
  .finally(() => prisma.$disconnect());
