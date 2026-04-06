// midtransClient.js — Smart App Payment Integration
// Catatan: Midtrans belum dikonfigurasi sepenuhnya. Saat ini hanya loadMidtransSnap 
// yang berfungsi jika masjid sudah memasukkan Client Key di Pengaturan > Pembayaran.

/**
 * Load Midtrans Snap script secara dinamis
 * @param {string} environment - "sandbox" atau "production"
 */
export function loadMidtransSnap(environment = "sandbox") {
  return new Promise((resolve, reject) => {
    if (window.snap) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src =
      environment === "production"
        ? "https://app.midtrans.com/snap/snap.js"
        : "https://app.sandbox.midtrans.com/snap/snap.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Gagal memuat Midtrans Snap"));
    document.head.appendChild(script);
  });
}

/**
 * Trigger Midtrans Snap payment popup
 * Memerlukan snap_token dari backend (server-side call ke Midtrans API)
 * 
 * @param {Object} options
 * @param {string} options.snap_token - Token dari backend /api/midtrans/token
 * @param {Function} options.success - Callback saat berhasil
 * @param {Function} options.error - Callback saat gagal
 * @param {Function} options.pending - Callback saat pending
 */
export async function handleSnapPayment({ snap_token, success, error, pending }) {
  if (!snap_token) {
    throw new Error("snap_token wajib diisi. Generate dulu dari backend.");
  }

  await loadMidtransSnap();

  if (!window.snap) {
    throw new Error("Midtrans Snap gagal dimuat");
  }

  window.snap.pay(snap_token, {
    onSuccess: (result) => success && success(result),
    onPending: (result) => pending && pending(result),
    onError: (result) => error && error(result),
    onClose: () => console.log("Customer menutup popup pembayaran"),
  });
}
