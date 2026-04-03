-- ============================================================
-- MasjidKu Smart - MySQL Database Schema & Seed Data
-- Generated: 2026-04-03
-- Compatible: MySQL 5.7+ / MySQL 8.x / MariaDB 10.x
--
-- CARA IMPORT:
--   1. Buka phpMyAdmin di aaPanel
--   2. Pilih database "masjidkusmart" di sidebar kiri
--   3. Klik tab Import
--   4. Pilih file ini, klik Go
-- ============================================================

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
SET time_zone = '+07:00';
SET foreign_key_checks = 0;
SET sql_mode = 'NO_AUTO_VALUE_ON_ZERO';

-- Gunakan database yang sudah dibuat oleh aaPanel
USE `masjidkusmart`;


-- ============================================================
-- Drop tables (urutan terbalik dari dependency)
-- ============================================================
DROP TABLE IF EXISTS `Attendance`;
DROP TABLE IF EXISTS `PlanFeatures`;
DROP TABLE IF EXISTS `TelegramSettings`;
DROP TABLE IF EXISTS `AppSettings`;
DROP TABLE IF EXISTS `JumatOfficer`;
DROP TABLE IF EXISTS `PrayerTime`;
DROP TABLE IF EXISTS `Donation`;
DROP TABLE IF EXISTS `Announcement`;
DROP TABLE IF EXISTS `Activity`;
DROP TABLE IF EXISTS `Transaction`;
DROP TABLE IF EXISTS `MosqueMember`;
DROP TABLE IF EXISTS `Mosque`;
DROP TABLE IF EXISTS `User`;
DROP TABLE IF EXISTS `_prisma_migrations`;

-- ============================================================
-- Table: User
-- ============================================================
CREATE TABLE `User` (
  `id`                     VARCHAR(36) NOT NULL,
  `email`                  VARCHAR(191) NOT NULL,
  `password`               VARCHAR(255) NOT NULL,
  `full_name`              VARCHAR(191) DEFAULT NULL,
  `phone`                  VARCHAR(50) DEFAULT NULL,
  `role`                   VARCHAR(50) NOT NULL DEFAULT 'user',
  `current_mosque_id`      VARCHAR(36) DEFAULT NULL,
  `reset_password_token`   VARCHAR(191) DEFAULT NULL,
  `reset_password_expires` DATETIME(3) DEFAULT NULL,
  `two_factor_secret`      VARCHAR(255) DEFAULT NULL,
  `two_factor_enabled`     TINYINT(1) NOT NULL DEFAULT 0,
  `two_factor_method`      VARCHAR(20) DEFAULT 'totp',
  `otp_code`               VARCHAR(10) DEFAULT NULL,
  `otp_expires`            DATETIME(3) DEFAULT NULL,
  `created_at`             DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `User_email_key` (`email`),
  KEY `User_role_idx` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Table: Mosque
-- ============================================================
CREATE TABLE `Mosque` (
  `id`                          VARCHAR(36) NOT NULL,
  `name`                        VARCHAR(191) NOT NULL,
  `slug`                        VARCHAR(191) DEFAULT NULL,
  `address`                     VARCHAR(500) DEFAULT NULL,
  `description`                 TEXT DEFAULT NULL,
  `logo_url`                    VARCHAR(500) DEFAULT NULL,
  `bank_name`                   VARCHAR(191) DEFAULT NULL,
  `bank_account`                VARCHAR(191) DEFAULT NULL,
  `bank_account_name`           VARCHAR(191) DEFAULT NULL,
  `show_financial`              TINYINT(1) NOT NULL DEFAULT 1,
  `status`                      VARCHAR(20) NOT NULL DEFAULT 'active',
  `email`                       VARCHAR(191) DEFAULT NULL,
  `phone`                       VARCHAR(50) DEFAULT NULL,
  `city`                        VARCHAR(191) DEFAULT NULL,
  `province`                    VARCHAR(191) DEFAULT NULL,
  `about`                       TEXT DEFAULT NULL,
  `established_year`            VARCHAR(10) DEFAULT NULL,
  `cover_image_url`             VARCHAR(500) DEFAULT NULL,
  `custom_domain`               VARCHAR(191) DEFAULT NULL,
  `instagram`                   VARCHAR(191) DEFAULT NULL,
  `facebook`                    VARCHAR(191) DEFAULT NULL,
  `youtube`                     VARCHAR(191) DEFAULT NULL,
  `primary_color`               VARCHAR(20) DEFAULT NULL,
  `timezone`                    VARCHAR(50) DEFAULT 'Asia/Jakarta',
  `midtrans_server_key`         VARCHAR(255) DEFAULT NULL,
  `midtrans_client_key`         VARCHAR(255) DEFAULT NULL,
  `midtrans_environment`        VARCHAR(20) DEFAULT 'sandbox',
  `tv_show_finance`             TINYINT(1) NOT NULL DEFAULT 1,
  `tv_show_jumat`               TINYINT(1) NOT NULL DEFAULT 1,
  `tv_show_activities`          TINYINT(1) NOT NULL DEFAULT 1,
  `tv_show_announcements`       TINYINT(1) NOT NULL DEFAULT 1,
  `tv_show_qrcode`              TINYINT(1) NOT NULL DEFAULT 1,
  `tv_slideshow_urls`           TEXT DEFAULT NULL,
  `tv_video_url`                VARCHAR(500) DEFAULT NULL,
  `tv_prayer_overlay_text`      VARCHAR(500) DEFAULT 'Mohon matikan handphone. Luruskan dan rapatkan shaf.',
  `tv_prayer_overlay_duration`  INT NOT NULL DEFAULT 15,
  `tv_background_url`           VARCHAR(500) DEFAULT NULL,
  `subscription_plan`           VARCHAR(20) DEFAULT 'trial',
  `subscription_status`         VARCHAR(20) DEFAULT 'trial',
  `subscription_start`          DATETIME(3) DEFAULT NULL,
  `subscription_end`            DATETIME(3) DEFAULT NULL,
  `created_at`                  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Mosque_slug_key` (`slug`),
  KEY `Mosque_status_idx` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Table: MosqueMember
-- ============================================================
CREATE TABLE `MosqueMember` (
  `id`          VARCHAR(36) NOT NULL,
  `user_email`  VARCHAR(191) NOT NULL,
  `user_name`   VARCHAR(191) DEFAULT NULL,
  `user_phone`  VARCHAR(50) DEFAULT NULL,
  `mosque_id`   VARCHAR(36) NOT NULL,
  `role`        VARCHAR(50) NOT NULL,
  `status`      VARCHAR(20) NOT NULL DEFAULT 'active',
  `join_date`   VARCHAR(30) DEFAULT NULL,
  `createdAt`   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `MosqueMember_mosque_id_idx` (`mosque_id`),
  KEY `MosqueMember_user_email_idx` (`user_email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Table: Transaction
-- ============================================================
CREATE TABLE `Transaction` (
  `id`          VARCHAR(36) NOT NULL,
  `mosque_id`   VARCHAR(36) NOT NULL,
  `type`        VARCHAR(20) NOT NULL,
  `amount`      DECIMAL(15,2) NOT NULL,
  `category`    VARCHAR(191) DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  `date`        VARCHAR(30) NOT NULL,
  `receipt_url` VARCHAR(500) DEFAULT NULL,
  `source`      VARCHAR(50) DEFAULT NULL,
  `createdAt`   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `Transaction_mosque_id_idx` (`mosque_id`),
  KEY `Transaction_type_idx` (`type`),
  KEY `Transaction_date_idx` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Table: Activity
-- ============================================================
CREATE TABLE `Activity` (
  `id`          VARCHAR(36) NOT NULL,
  `mosque_id`   VARCHAR(36) NOT NULL,
  `title`       VARCHAR(191) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `date`        VARCHAR(30) NOT NULL,
  `time`        VARCHAR(50) DEFAULT NULL,
  `location`    VARCHAR(191) DEFAULT NULL,
  `speaker`     VARCHAR(191) DEFAULT NULL,
  `status`      VARCHAR(20) NOT NULL DEFAULT 'upcoming',
  `createdAt`   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `Activity_mosque_id_idx` (`mosque_id`),
  KEY `Activity_status_idx` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Table: Announcement
-- ============================================================
CREATE TABLE `Announcement` (
  `id`           VARCHAR(36) NOT NULL,
  `mosque_id`    VARCHAR(36) NOT NULL,
  `title`        VARCHAR(191) NOT NULL,
  `content`      TEXT DEFAULT NULL,
  `status`       VARCHAR(20) NOT NULL DEFAULT 'published',
  `created_date` VARCHAR(30) NOT NULL,
  `createdAt`    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `Announcement_mosque_id_idx` (`mosque_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Table: Donation
-- ============================================================
CREATE TABLE `Donation` (
  `id`             VARCHAR(36) NOT NULL,
  `mosque_id`      VARCHAR(36) NOT NULL,
  `amount`         DECIMAL(15,2) NOT NULL,
  `status`         VARCHAR(20) NOT NULL DEFAULT 'pending',
  `donor_name`     VARCHAR(191) DEFAULT NULL,
  `donor_email`    VARCHAR(191) DEFAULT NULL,
  `donor_phone`    VARCHAR(50) DEFAULT NULL,
  `payment_method` VARCHAR(50) DEFAULT NULL,
  `payment_proof`  VARCHAR(500) DEFAULT NULL,
  `created_date`   VARCHAR(30) NOT NULL,
  `createdAt`      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `Donation_mosque_id_idx` (`mosque_id`),
  KEY `Donation_status_idx` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Table: PrayerTime
-- ============================================================
CREATE TABLE `PrayerTime` (
  `id`           VARCHAR(36) NOT NULL,
  `mosque_id`    VARCHAR(36) NOT NULL,
  `subuh`        VARCHAR(10) DEFAULT NULL,
  `dzuhur`       VARCHAR(10) DEFAULT NULL,
  `ashar`        VARCHAR(10) DEFAULT NULL,
  `maghrib`      VARCHAR(10) DEFAULT NULL,
  `isya`         VARCHAR(10) DEFAULT NULL,
  `created_date` VARCHAR(30) DEFAULT NULL,
  `createdAt`    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `PrayerTime_mosque_id_idx` (`mosque_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Table: JumatOfficer
-- ============================================================
CREATE TABLE `JumatOfficer` (
  `id`          VARCHAR(36) NOT NULL,
  `mosque_id`   VARCHAR(36) NOT NULL,
  `khatib`      VARCHAR(191) DEFAULT NULL,
  `imam`        VARCHAR(191) DEFAULT NULL,
  `muadzin`     VARCHAR(191) DEFAULT NULL,
  `bilal`       VARCHAR(191) DEFAULT NULL,
  `jumat_date`  VARCHAR(30) DEFAULT NULL,
  `createdAt`   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `JumatOfficer_mosque_id_idx` (`mosque_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Table: AppSettings
-- ============================================================
CREATE TABLE `AppSettings` (
  `id`                   VARCHAR(36) NOT NULL,
  `logo`                 VARCHAR(500) DEFAULT NULL,
  `name`                 VARCHAR(191) DEFAULT NULL,
  `theme`                VARCHAR(50) DEFAULT NULL,
  `app_name`             VARCHAR(191) DEFAULT 'MasjidKu Smart',
  `app_tagline`          VARCHAR(500) DEFAULT NULL,
  `logo_url`             VARCHAR(500) DEFAULT NULL,
  `primary_color`        VARCHAR(20) DEFAULT NULL,
  `hero_image_url`       VARCHAR(500) DEFAULT NULL,
  `contact_email`        VARCHAR(191) DEFAULT NULL,
  `contact_phone`        VARCHAR(50) DEFAULT NULL,
  `whatsapp_number`      VARCHAR(50) DEFAULT NULL,
  `midtrans_server_key`  VARCHAR(255) DEFAULT NULL,
  `midtrans_client_key`  VARCHAR(255) DEFAULT NULL,
  `midtrans_environment` VARCHAR(20) DEFAULT 'sandbox',
  `gemini_api_key`       VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Table: TelegramSettings
-- ============================================================
CREATE TABLE `TelegramSettings` (
  `id`                  VARCHAR(36) NOT NULL,
  `mosque_id`           VARCHAR(36) NOT NULL,
  `bot_token`           VARCHAR(255) DEFAULT NULL,
  `chat_id`             VARCHAR(100) DEFAULT NULL,
  `notify_transactions` TINYINT(1) NOT NULL DEFAULT 1,
  `notify_activities`   TINYINT(1) NOT NULL DEFAULT 1,
  `notify_announcements`TINYINT(1) NOT NULL DEFAULT 1,
  `notify_donations`    TINYINT(1) NOT NULL DEFAULT 1,
  `bot_enabled`         TINYINT(1) NOT NULL DEFAULT 0,
  `gemini_api_key`      VARCHAR(255) DEFAULT NULL,
  `createdAt`           DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`           DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `TelegramSettings_mosque_id_key` (`mosque_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Table: PlanFeatures
-- ============================================================
CREATE TABLE `PlanFeatures` (
  `id`          VARCHAR(36) NOT NULL,
  `name`        VARCHAR(191) DEFAULT NULL,
  `plan`        VARCHAR(50) NOT NULL,
  `price`       DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `description` TEXT DEFAULT NULL,
  `features`    TEXT NOT NULL DEFAULT '[]',
  `is_popular`  TINYINT(1) NOT NULL DEFAULT 0,
  `max_mosques` INT NOT NULL DEFAULT -1,
  `storage_gb`  INT NOT NULL DEFAULT -1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `PlanFeatures_plan_key` (`plan`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Table: Attendance
-- ============================================================
CREATE TABLE `Attendance` (
  `id`            VARCHAR(36) NOT NULL,
  `activity_id`   VARCHAR(36) NOT NULL,
  `mosque_id`     VARCHAR(36) NOT NULL,
  `member_name`   VARCHAR(191) NOT NULL,
  `member_email`  VARCHAR(191) DEFAULT NULL,
  `member_phone`  VARCHAR(50) DEFAULT NULL,
  `checked_in_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `createdAt`     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `Attendance_activity_id_idx` (`activity_id`),
  KEY `Attendance_mosque_id_idx` (`mosque_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Table: _prisma_migrations (dibutuhkan oleh Prisma)
-- ============================================================
CREATE TABLE `_prisma_migrations` (
  `id`                    VARCHAR(36) NOT NULL,
  `checksum`              VARCHAR(64) NOT NULL,
  `finished_at`           DATETIME(3) DEFAULT NULL,
  `migration_name`        VARCHAR(255) NOT NULL,
  `logs`                  TEXT DEFAULT NULL,
  `rolled_back_at`        DATETIME(3) DEFAULT NULL,
  `started_at`            DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `applied_steps_count`   INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SEED DATA: Superadmin
-- Password: M4m4cantik@ (bcrypt hash, cost=10)
-- ============================================================
INSERT IGNORE INTO `User` (`id`, `email`, `password`, `full_name`, `role`, `created_at`)
VALUES (
  UUID(),
  'rm23n@ymail.com',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'Superadmin',
  'admin',
  NOW()
);

-- ============================================================
-- SEED DATA: AppSettings default
-- ============================================================
INSERT IGNORE INTO `AppSettings` (`id`, `app_name`, `app_tagline`, `primary_color`, `midtrans_environment`)
VALUES (
  UUID(),
  'MasjidKu Smart',
  'Platform Digital Manajemen Masjid Modern',
  '#1a7a4a',
  'sandbox'
);

-- ============================================================
-- SEED DATA: PlanFeatures (Paket Langganan)
-- ============================================================
INSERT IGNORE INTO `PlanFeatures` (`id`, `name`, `plan`, `price`, `description`, `features`, `is_popular`, `max_mosques`, `storage_gb`)
VALUES
(
  UUID(),
  'Paket Trial',
  'trial',
  0.00,
  'Coba fitur dasar secara gratis',
  '["Manajemen 1 Masjid","Keuangan & Transaksi","Jadwal Kegiatan","Pengumuman","Laporan Keuangan","Tampilan TV Masjid"]',
  0,
  1,
  1
),
(
  UUID(),
  'Paket Basic',
  'monthly',
  149000.00,
  'Ideal untuk masjid dengan kebutuhan standar',
  '["Semua fitur Trial","Donasi Online (Midtrans)","2FA & Keamanan","Integrasi Telegram Bot","Absensi Digital QR","Upload Foto & Berkas","Support Email"]',
  0,
  3,
  5
),
(
  UUID(),
  'Paket Pro',
  'yearly',
  999000.00,
  'Solusi lengkap untuk masjid aktif & berkembang',
  '["Semua fitur Basic","Masjid Tak Terbatas","AI OCR Scan Struk","Domain Kustom","Analitik Lanjutan","Prioritas Support","Backup Otomatis","Storage 50 GB"]',
  1,
  -1,
  50
);

-- ============================================================
-- Re-enable foreign key checks
-- ============================================================
SET foreign_key_checks = 1;

-- ============================================================
-- SELESAI! Database siap digunakan.
--
-- Setelah import, jalankan di terminal backend:
--   npx prisma generate
-- (TANPA migrate — sudah pakai SQL langsung)
--
-- Kemudian update .env dengan:
--   DATABASE_URL="mysql://USER:PASSWORD@HOST:3306/masjidku_db"
-- ============================================================
