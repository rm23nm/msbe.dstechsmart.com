import React, { useEffect, useState } from 'react';

const InstallPWA = () => {
  const [supportsPWA, setSupportsPWA] = useState(false);
  const [promptInstall, setPromptInstall] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    // Cek apakah user sudah menutup prompt ini sebelumnya
    if (localStorage.getItem("pwa_dismissed")) {
      return;
    }

    // Cek apakah aplikasi sudah terinstall (berjalan di mode aplikasi)
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      window.navigator.standalone === true
    ) {
      setIsInstalled(true);
      return;
    }

    // Deteksi apakah perangkat adalah iPhone/iPad (iOS)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    
    if (isIosDevice) {
      setIsIos(true);
      setSupportsPWA(true); // iOS selalu kita tampilkan prompt kustom
    }

    // Handler untuk Android & Desktop Chrome/Edge
    const handler = (e) => {
      e.preventDefault();
      setSupportsPWA(true);
      setPromptInstall(e);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setSupportsPWA(false);
    });

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleDismiss = () => {
    setSupportsPWA(false);
    // Simpan status ditutup agar tidak muncul lagi terus menerus
    localStorage.setItem("pwa_dismissed", "true");
  };

  const onClickAndroidDesktop = (evt) => {
    evt.preventDefault();
    if (!promptInstall) {
      return;
    }
    promptInstall.prompt();
    promptInstall.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
        setSupportsPWA(false);
      }
    });
  };

  if (!supportsPWA || isInstalled || localStorage.getItem("pwa_dismissed")) {
    return null;
  }

  // Tampilan Khusus Pengguna iOS (iPhone/iPad)
  if (isIos) {
    return (
      <div className="fixed bottom-0 left-0 w-full p-4 bg-white border-t rounded-t-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-[9999] sm:w-96 sm:bottom-4 sm:left-1/2 sm:-translate-x-1/2 sm:rounded-2xl sm:border">
        <div className="flex items-start gap-4">
          <img src="/favicon.png?v=2" alt="Logo" className="w-12 h-12 rounded-xl object-contain drop-shadow" />
          <div className="flex-1">
            <h4 className="font-bold text-gray-800 text-sm mb-1">Pasang di iPhone Anda</h4>
            <p className="text-xs text-gray-500 mb-2 leading-relaxed">
              Tekan ikon <b>Share</b> <span className="inline-block border border-gray-300 rounded px-1 -translate-y-0.5 mx-0.5">􀈂</span> di bawah browser Anda, lalu pilih <b>"Add to Home Screen"</b> untuk pasang aplikasi.
            </p>
            <button 
              onClick={handleDismiss} 
              className="w-full py-2 text-xs font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Saya Mengerti (Tutup)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Tampilan Untuk Android & Desktop
  return (
    <div className="fixed bottom-0 left-0 w-full p-4 bg-white border-t rounded-t-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-[9999] flex items-center justify-between sm:w-96 sm:bottom-4 sm:left-1/2 sm:-translate-x-1/2 sm:rounded-2xl sm:border">
      <div className="flex items-center gap-3">
        <img src="/favicon.png?v=2" alt="MasjidKu Smart" className="w-12 h-12 rounded-xl object-contain drop-shadow" />
        <div>
          <h4 className="font-bold text-gray-800 text-sm">Pasang MasjidKu Smart</h4>
          <p className="text-xs text-gray-500">Akses cepat di layar Anda</p>
        </div>
      </div>
      <div className="flex gap-2">
        <button 
          onClick={handleDismiss} 
          className="px-3 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Nanti
        </button>
        <button 
          onClick={onClickAndroidDesktop} 
          className="px-4 py-2 text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-lg shadow-green-500/30 transition-all active:scale-95"
        >
          Install
        </button>
      </div>
    </div>
  );
};

export default InstallPWA;
