const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function seed() {
  const m = await prisma.mosque.create({
    data: {
      name: 'Masjid Raya Al-Bina',
      slug: 'al-bina',
      address: 'Jl. Pemuda No. 12',
      city: 'Jakarta Pusat',
      tv_show_finance: true,
      tv_show_jumat: true,
      tv_show_activities: true,
      tv_show_announcements: true,
      tv_show_qrcode: true,
      status: 'active',
      tv_prayer_overlay_duration: 15,
      tv_slideshow_urls: 'https://images.unsplash.com/photo-1591500366657-6be094e410b0?q=80&w=1200&auto=format&fit=crop, https://images.unsplash.com/photo-1564683214964-b31b90d85310?q=80&w=1200&auto=format&fit=crop'
    }
  });

  await prisma.prayerTime.create({
    data: {
      mosque_id: m.id,
      subuh: '04:30', dzuhur: '12:00', ashar: '15:15', maghrib: '18:05', isya: '19:15',
      created_date: new Date().toISOString()
    }
  });

  await prisma.jumatOfficer.create({
    data: {
      mosque_id: m.id,
      khatib: 'Ust. Abdul Somad, Lc. MA',
      imam: 'Ust. Hanan Attaki, Lc.',
      muadzin: 'Sdr. Bilal',
      jumat_date: new Date().toISOString()
    }
  });

  await prisma.activity.create({
    data: {
      mosque_id: m.id,
      title: 'Kajian Rutin Malam Ahad',
      description: 'Membahas kitab Tafsir Ibnu Katsir.',
      date: new Date().toISOString(),
      time: 'Bada Maghrib',
      status: 'upcoming'
    }
  });

  await prisma.transaction.create({
    data: { mosque_id: m.id, type: 'income', amount: 5000000, date: new Date().toISOString() }
  });
  await prisma.transaction.create({
    data: { mosque_id: m.id, type: 'expense', amount: 1500000, date: new Date().toISOString() }
  });

  await prisma.announcement.create({
    data: {
      mosque_id: m.id,
      title: 'Penerimaan Zakat Fitrah',
      content: 'Panitia masjid menerima pembayaran zakat fitrah sebesar Rp 45.000.',
      created_date: new Date().toISOString()
    }
  });
  console.log("Seeded mosque");
}
seed().catch(e => console.error(e)).finally(() => prisma.$disconnect());
