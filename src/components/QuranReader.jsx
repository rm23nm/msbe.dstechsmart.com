import React, { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import { 
  BookOpen, Search, Play, Pause, ChevronRight, ChevronLeft, 
  Volume2, Book, Loader2, Music, List, Info, Type, X, Layout, Maximize2, Headphones
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter 
} from "@/components/ui/dialog";
import { toast } from "sonner";

const API_BASE = "https://equran.id/api/v2";
const MUSHAF_API = "https://api.alquran.cloud/v1";

const QARIS = [
  { id: 'ar.alafasy', equranId: '05', name: 'Misyari Rasyid Al-Afasi' },
  { id: 'ar.abdullahmatroud', equranId: '03', name: 'Abdullah Matroud' },
  { id: 'ar.assudais', equranId: '03', name: 'Abdurrahman as-Sudais' },
  { id: 'ar.abdullahaljuhany', equranId: '01', name: 'Abdullah Al-Juhany' },
  { id: 'ar.abdulmuhinalqasim', equranId: '02', name: 'Abdul-Muhsin Al-Qasim' },
  { id: 'ar.ibrahimaldossari', equranId: '04', name: 'Ibrahim Al-Dossari' },
];


export default function QuranReader({ isPublic = false }) {
  const [surahs, setSurahs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedSurah, setSelectedSurah] = useState(null);
  const [surahDetail, setSurahDetail] = useState(null);
  const [tafsirData, setTafsirData] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingTafsir, setLoadingTafsir] = useState(false);
  const [activeTab, setActiveTab] = useState("surah");
  const [viewMode, setViewMode] = useState("list"); // 'list' or 'mushaf'
  const [selectedQari, setSelectedQari] = useState(QARIS[0]); // Default to Misyari
  
  // Mushaf State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageData, setPageData] = useState(null);
  const [loadingPage, setLoadingPage] = useState(false);
  const [playingSurah, setPlayingSurah] = useState(null); // Track which surah is playing

  
  // Ayah Detail State (for Mushaf mode clicks)
  const [selectedAyahDetail, setSelectedAyahDetail] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [showAyahDialog, setShowAyahDialog] = useState(false);

  // Audio state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [currentAyahIndex, setCurrentAyahIndex] = useState(-1);
  const audioRef = useRef(new Audio());
  
  // Customization State
  const [fontSize, setFontSize] = useState(parseInt(localStorage.getItem('quran_font_size')) || 32);
  const [showTranslation, setShowTranslation] = useState(localStorage.getItem('quran_show_translation') !== 'false');
  const [showTafsirInline, setShowTafsirInline] = useState(false);
  const [bookmarks, setBookmarks] = useState(JSON.parse(localStorage.getItem('quran_bookmarks')) || []);
  const [lastRead, setLastRead] = useState(JSON.parse(localStorage.getItem('quran_last_read')) || null);
  const [showTajweed, setShowTajweed] = useState(localStorage.getItem('quran_show_tajweed') === 'true');
  const [frameTheme, setFrameTheme] = useState('light'); // 'light' or 'dark'

  useEffect(() => {
    localStorage.setItem('quran_font_size', fontSize);
    localStorage.setItem('quran_show_translation', showTranslation);
    localStorage.setItem('quran_show_tajweed', showTajweed);
    localStorage.setItem('quran_bookmarks', JSON.stringify(bookmarks));
  }, [fontSize, showTranslation, bookmarks, showTajweed]);



  useEffect(() => {
    fetchSurahs();
    return () => {
      audioRef.current.pause();
    };
  }, []);

  useEffect(() => {
    if (viewMode === 'mushaf') {
      fetchPageData(currentPage);
    }
  }, [viewMode, currentPage]);

  const fetchSurahs = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/surat`);
      setSurahs(data.data || []);
    } catch (error) {
      toast.error("Gagal mengambil daftar surah");
    } finally {
      setLoading(false);
    }
  };

  const fetchPageData = async (page) => {
    setLoadingPage(true);
    try {
      const edition = showTajweed ? 'quran-tajweed' : 'quran-uthmani';
      const { data } = await axios.get(`${MUSHAF_API}/page/${page}/${edition}`);
      setPageData(data.data);
    } catch (error) {
      toast.error("Gagal mengambil data halaman Al-Quran");
    } finally {
      setLoadingPage(false);
    }
  };

  const parseTajweed = (text) => {
    if (!text) return "";
    let output = "";
    let stack = [];
    for (let i = 0; i < text.length; i++) {
      // Check for tag start like [x[ or [x:num[
      if (text[i] === '[' && i + 2 < text.length) {
        const remaining = text.substring(i);
        const match = remaining.match(/^\[([a-z]):?\d*\[/);
        if (match) {
          output += `<span class="tajweed-c-${match[1]}">`;
          stack.push('span');
          i += match[0].length - 1;
          continue;
        }
      }
      
      // Check for tag end
      if (text[i] === ']') {
        if (stack.length > 0) {
          output += '</span>';
          stack.pop();
          continue;
        }
      }
      
      output += text[i];
    }
    return output;
  };



  const fetchSurahDetail = async (nomor) => {
    setLoadingDetail(true);
    setSurahDetail(null);
    try {
      const { data } = await axios.get(`${API_BASE}/surat/${nomor}`);
      setSurahDetail(data.data);
      if (viewMode === 'mushaf') {
        const surahPage = data.data.ayat[0].halaman || 1;
        setCurrentPage(surahPage);
      }
      stopAudio();
    } catch (error) {
      toast.error("Gagal mengambil detail surah");
    } finally {
      setLoadingDetail(false);
    }
  };

  const fetchTafsir = async (nomor) => {
    setLoadingTafsir(true);
    try {
      const { data } = await axios.get(`${API_BASE}/tafsir/${nomor}`);
      setTafsirData(data.data);
    } catch (error) {
      toast.error("Gagal mengambil tafsir");
    } finally {
      setLoadingTafsir(false);
    }
  };

  const handleSurahClick = (surah, skipStopAudio = false) => {
    setSelectedSurah(surah);
    fetchSurahDetail(surah.nomor);
    fetchTafsir(surah.nomor);
    
    // Save as last read
    const progress = {
      nomor: surah.nomor,
      nama: surah.namaLatin,
      time: new Date().toISOString()
    };
    setLastRead(progress);
    localStorage.setItem('quran_last_read', JSON.stringify(progress));

    if (!skipStopAudio) stopAudio();

    if (window.innerWidth < 1024) {
      setTimeout(() => {
        document.getElementById('surah-detail-view')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };


  const toggleBookmark = (surah, ayah) => {
    const bId = `${surah.nomor}:${ayah.nomorAyat}`;
    if (bookmarks.find(b => b.id === bId)) {
      setBookmarks(prev => prev.filter(b => b.id !== bId));
      toast.success("Bookmark dihapus");
    } else {
      const newBM = {
        id: bId,
        surahNomor: surah.nomor,
        surahNama: surah.namaLatin,
        ayahNomor: ayah.nomorAyat,
        text: ayah.teksArab,
        timestamp: new Date().toISOString()
      };
      setBookmarks(prev => [newBM, ...prev]);
      toast.success("Ayat ditambahkan ke bookmark");
    }
  };


  const handleAyahClick = async (ayah) => {
    // Get Surah number from ayah.surah.number
    const surahNum = ayah.surah.number;
    const ayahNum = ayah.numberInSurah;
    
    setSelectedAyahDetail(null);
    setIsDetailLoading(true);
    setShowAyahDialog(true);
    
    try {
      // Fetch translation and tafsir from equran.id
      const { data } = await axios.get(`${API_BASE}/surat/${surahNum}`);
      const specificAyah = data.data.ayat.find(a => a.nomorAyat === ayahNum);
      const tafsirRes = await axios.get(`${API_BASE}/tafsir/${surahNum}`);
      const specificTafsir = tafsirRes.data.data.tafsir.find(t => t.ayat === ayahNum);
      
      setSelectedAyahDetail({
        ...specificAyah,
        tafsir: specificTafsir?.teks || "Tafsir tidak tersedia",
        surahName: ayah.surah.englishName,
        surahNum: surahNum
      });
    } catch (error) {
      toast.error("Gagal mengambil detail ayat");
      setShowAyahDialog(false);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const playNextAyah = () => {
    // Only auto-play if we are in Ayah-by-Ayah mode (index >= 0)
    setCurrentAyahIndex((prevIndex) => {
      if (prevIndex >= 0 && surahDetail && prevIndex < surahDetail.ayat.length - 1) {
        const nextIndex = prevIndex + 1;
        const nextAyah = surahDetail.ayat[nextIndex];
        
        // Resolve audio URL for the next ayah using Islamic Network CDN
        const audioUrl = `https://cdn.islamic.network/quran/audio/128/${selectedQari.id}/${nextAyah.nomorAyatGlobal || (surahDetail.nomor === 1 ? nextIndex + 1 : nextAyah.nomorAyat)}.mp3`;
        
        // We use a small timeout to let the state update
        setTimeout(() => {
          audioRef.current.src = audioUrl;
          audioRef.current.play();
          setIsPlaying(true);
        }, 100);
        
        return nextIndex;
      }

      setIsPlaying(false);
      return -1;
    });
  };

  const toggleAudio = (audioUrl, index, currentSurah = null) => {
    if (currentAyahIndex === index && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      stopAudio();
      
      let finalUrl = audioUrl;
      const targetSurah = currentSurah || selectedSurah;

      audioRef.current.src = finalUrl;
      audioRef.current.play();
      setCurrentAudio(finalUrl);
      setCurrentAyahIndex(index);
      setIsPlaying(true);
      
      audioRef.current.onended = () => {
        if (index === -2) {
          // Playlist Mode: Transition to next surah
          const currentPlayingNum = targetSurah?.nomor;
          const nextNum = (currentPlayingNum || 1) + 1;
          
          if (nextNum <= 114) {
            const nextSurah = surahs.find(s => s.nomor === nextNum);
            if (nextSurah) {
              handleSurahClick(nextSurah, true); 
              toast.info(`Berlanjut ke: Surat ${nextSurah.namaLatin}...`);
              
              setTimeout(() => {
                 const nextAudioUrl = nextSurah.audioFull[selectedQari.equranId];
                 toggleAudio(nextAudioUrl, -2, nextSurah);
              }, 2000);
            }
          } else {
            setPlayingSurah(null);
            setIsPlaying(false);
            setCurrentAyahIndex(-1);
            toast.success("Khatam Al-Quran! Seluruh surat telah diputar.");
          }
        } else {
           playNextAyah();
        }
      };
      
      if (index === -2 || index >= 0) {
         setPlayingSurah(targetSurah);
      }
    }
  };


  const stopAudio = () => {
    audioRef.current.pause();
    setIsPlaying(false);
    setCurrentAyahIndex(-1);
    setPlayingSurah(null);
  };




  const filteredSurahs = surahs.filter(s => 
    s.namaLatin.toLowerCase().includes(search.toLowerCase()) || 
    s.arti.toLowerCase().includes(search.toLowerCase()) ||
    s.nomor.toString().includes(search)
  );

  const MushafView = () => {
    if (loadingPage) {
      return (
        <div className="flex flex-col items-center justify-center py-40 gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium">Membuka lembaran Mushaf...</p>
        </div>
      );
    }

    if (!pageData) return null;

    return (
      <div className="animate-in fade-in zoom-in-95 duration-500 quran-mushaf-layout py-10">
        {/* Mushaf Decorative Frame wrapper */}
        <div className={`quran-frame-container ${frameTheme === 'dark' ? 'dark' : ''} shadow-2xl mx-auto max-w-[850px] relative overflow-hidden mb-20`}>
          {/* Corner Elements */}
          <div className="frame-corner corner-tl" />
          <div className="frame-corner corner-tr" />
          <div className="frame-corner corner-bl" />
          <div className="frame-corner corner-br" />

          {/* Border Elements */}
          <div className="frame-border-h border-top" />
          <div className="frame-border-h border-bottom" />
          <div className="frame-border-v-new border-left-new" />
          <div className="frame-border-v-new border-right-new" />


          {/* Mushaf Header Information */}
          <div className="flex items-center justify-between py-8 mb-16 relative z-20 px-4 lg:px-14 border-b border-[#c5a059]/30">
            <div className="flex flex-col items-start min-w-[120px]">
               <div className="bg-[#c5a059]/15 backdrop-blur-md px-5 py-2.5 rounded-2xl border-2 border-[#c5a059]/40 shadow-md">
                  <span className="text-[13px] font-black text-[#c5a059] uppercase tracking-wide">Juz {pageData.ayahs[0].juz}</span>
               </div>
            </div>

            <div className="relative group">
              <div className="w-20 h-20 rounded-full border-[6px] border-[#c5a059]/50 flex items-center justify-center text-3xl font-black shadow-2xl bg-white flex-shrink-0 -mt-16 transition-transform hover:scale-110 duration-500 ring-10 ring-white/30">
                 <span className="text-[#c5a059] drop-shadow-md">{currentPage}</span>
              </div>
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#c5a059] text-white text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest whitespace-nowrap shadow-sm">Halaman</div>
            </div>

            <div className="flex flex-col items-end min-w-[120px]">
               <div className="bg-[#c5a059]/15 backdrop-blur-md px-5 py-2.5 rounded-2xl border-2 border-[#c5a059]/40 shadow-md">
                  <span className="text-[13px] font-black text-[#c5a059] uppercase tracking-wide">Manzil {pageData.ayahs[0].manzil}</span>
               </div>
            </div>
          </div>




          {/* Ayahs Display */}
          <div 
            dir="rtl" 
            className="text-right leading-[2.8] md:leading-[3.2] tracking-normal mb-8 px-4 md:px-14 mt-12 relative z-20 text-justify"
            style={{ textAlignLast: 'center' }}
          >

            {pageData.ayahs.map((ayah, i) => (
              <React.Fragment key={i}>
                {ayah.numberInSurah === 1 && (
                  <div className="w-full text-center mt-2 mb-6 flex flex-col items-center gap-2" dir="ltr">
                     <div className="surah-header-frame animate-in fade-in slide-in-from-top-4 duration-1000 mb-0 opacity-90">
                        <span className="surah-header-title text-xl font-arabic drop-shadow-sm brightness-110">
                          {ayah.surah.name}
                        </span>
                     </div>
                     {ayah.surah.number !== 1 && ayah.surah.number !== 9 && (
                        <p className="font-arabic text-3xl md:text-4xl text-foreground mt-0 mb-4 drop-shadow-sm opacity-90">بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ</p>
                     )}
                  </div>
                )}
                <span 
                  onClick={() => handleAyahClick(ayah)}
                  className="font-arabic text-foreground transition-all hover:text-primary hover:bg-primary/5 rounded px-1 cursor-pointer select-none inline"
                  style={{ fontSize: `${Math.min(fontSize, 30)}px` }}
                  dangerouslySetInnerHTML={{ 
                    __html: `${showTajweed ? parseTajweed(ayah.text) : ayah.text}` 
                  }}
                />
                <span className="inline-flex items-center justify-center w-8 h-8 md:w-9 md:h-9 mx-1 rounded-full border-2 border-[#c5a059]/60 text-[10px] md:text-[10px] font-black text-[#c5a059] bg-[#c5a059]/5 scale-90 translate-y-1 select-none shadow-sm ring-1 ring-[#c5a059]/10">
                  {ayah.numberInSurah}
                </span>

              </React.Fragment>
            ))}
          </div>




          {/* Mushaf Footer Ornament */}
          <div className="flex justify-center pt-6 opacity-30">
            <div className="w-32 h-1 bg-gradient-to-r from-transparent via-[#c5a059] to-transparent rounded-full" />
          </div>
        </div>

        {/* Mushaf Navigation Control Panel */}
        <div className="flex items-center justify-center gap-4 fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-white/95 backdrop-blur-md shadow-2xl border border-primary/20 p-3 rounded-3xl px-8 ring-4 ring-primary/5">
           <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-xl h-12 w-12 hover:bg-primary/10 text-primary border border-transparent hover:border-primary/20"
            disabled={currentPage === 604} 
            onClick={() => setCurrentPage(p => p + 1)}
           >
             <ChevronLeft className="h-6 w-6" />
           </Button>
           <div className="flex flex-col items-center px-4 min-w-[120px] border-x border-primary/10">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">Halaman</span>
              <input 
                type="number" 
                min="1" max="604" 
                value={currentPage} 
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (val >= 1 && val <= 604) setCurrentPage(val);
                }}
                className="text-2xl font-black text-primary bg-transparent text-center focus:outline-none w-16"
              />
           </div>
           <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-xl h-12 w-12 hover:bg-primary/10 text-primary border border-transparent hover:border-primary/20"
            disabled={currentPage === 1} 
            onClick={() => setCurrentPage(p => p - 1)}
           >
             <ChevronRight className="h-6 w-6" />
           </Button>
           
           <div className="ml-4 flex items-center gap-2 border-l border-primary/10 pl-4">
              <Button 
                variant={frameTheme === 'light' ? 'default' : 'outline'} 
                size="sm" 
                className="rounded-full h-8 w-8 p-0"
                onClick={() => setFrameTheme('light')}
              >
                <div className="w-4 h-4 bg-white border border-border rounded-full" />
              </Button>
              <Button 
                variant={frameTheme === 'dark' ? 'default' : 'outline'} 
                size="sm" 
                className="rounded-full h-8 w-8 p-0"
                onClick={() => setFrameTheme('dark')}
              >
                <div className="w-4 h-4 bg-slate-800 border border-border rounded-full" />
              </Button>
           </div>
        </div>
      </div>
    );
  };



  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse font-medium">Menyiapkan Al-Quran...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-card p-4 rounded-3xl border border-border/60 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-2xl">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-lg leading-tight">Al-Quranul Karim</h2>
            <p className="text-xs text-muted-foreground">MasjidKu Smart Digital Reader</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Qari Selector */}
          <div className="hidden sm:flex items-center gap-2 mr-4 bg-muted px-3 py-1.5 rounded-full border border-border/50">
             <Volume2 className="h-4 w-4 text-primary" />
             <select 
              className="bg-transparent text-xs font-bold focus:outline-none cursor-pointer"
              value={selectedQari.id}
              onChange={(e) => {
                 const qari = QARIS.find(q => q.id === e.target.value);
                 setSelectedQari(qari);
                 stopAudio();
                 toast.success(`Qori diganti ke: ${qari.name}`);
              }}
             >
                {QARIS.map(q => (
                  <option key={q.id} value={q.id}>{q.name}</option>
                ))}
             </select>
          </div>

          <div className="hidden lg:flex items-center gap-1 bg-card border shadow-sm p-1 rounded-full mr-2">
            <Button 
              variant={showTranslation ? 'default' : 'ghost'} 
              size="sm" 
              className="rounded-full h-8 px-3 text-[10px] font-bold"
              onClick={() => setShowTranslation(!showTranslation)}
            >
              Terjemah
            </Button>
            <Button 
              variant={showTajweed ? 'default' : 'ghost'} 
              size="sm" 
              className="rounded-full h-8 px-3 text-[10px] font-bold ml-1"
              onClick={() => {
                setShowTajweed(!showTajweed);
                if(viewMode === 'mushaf') fetchPageData(currentPage);
                toast.success(showTajweed ? "Tajwid Dinonaktifkan" : "Tajwid Diaktifkan");
              }}
            >
              Tajwid
            </Button>
          </div>



          <div className="hidden lg:flex items-center gap-1 bg-muted p-1 rounded-full mr-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setFontSize(s => Math.max(20, s - 4))}><Type className="h-4 w-4 scale-75" /></Button>
            <span className="text-[10px] font-bold px-2">{fontSize}px</span>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setFontSize(s => Math.min(64, s + 4))}><Type className="h-4 w-4" /></Button>
          </div>

          <Button 
            variant={viewMode === 'list' ? 'default' : 'outline'} 
            onClick={() => setViewMode('list')}
            className="rounded-full gap-2 px-6"
          >
            <List className="h-4 w-4" /> Mode List
          </Button>
          <Button 
            variant={viewMode === 'mushaf' ? 'default' : 'outline'} 
            onClick={() => setViewMode('mushaf')}
            className="rounded-full gap-2 px-6"
          >
            <Maximize2 className="h-4 w-4" /> Mode Mushaf
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
        {/* Left Surah Navigator (Always available in List mode, hidden in Mushaf if selected) */}
        {(viewMode === 'list' || !selectedSurah) && (
          <div className={`lg:col-span-4 space-y-4 ${selectedSurah && window.innerWidth < 1024 ? 'hidden' : 'block'}`}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Cari surah (Al-Fatihah)..." 
                className="pl-9 h-11 border-primary/20 rounded-xl bg-white"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {lastRead && (
               <button 
                onClick={() => handleSurahClick(surahs.find(s => s.nomor === lastRead.nomor))}
                className="w-full p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-between hover:bg-primary/10 transition-colors"
               >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-bold text-primary uppercase">Terakhir Dibaca</p>
                      <p className="text-sm font-bold">{lastRead.nama}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-primary" />
               </button>
            )}

            <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
              {filteredSurahs.map((surah) => (
                <button
                  key={surah.nomor}
                  onClick={() => handleSurahClick(surah)}
                  className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between group h-20 ${
                    playingSurah?.nomor === surah.nomor && isPlaying
                      ? 'border-primary ring-4 ring-primary/20 bg-primary/10 shadow-xl scale-[1.03] -translate-y-1 relative before:absolute before:left-0 before:top-1/4 before:bottom-1/4 before:w-1.5 before:bg-primary before:rounded-r-full before:animate-pulse'
                      : selectedSurah?.nomor === surah.nomor
                        ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20' 
                        : 'bg-card border-border/60 hover:border-primary/50 hover:bg-primary/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs ${
                      playingSurah?.nomor === surah.nomor && isPlaying 
                        ? 'bg-primary text-white animate-pulse'
                        : selectedSurah?.nomor === surah.nomor && !(playingSurah?.nomor === surah.nomor && isPlaying) 
                          ? 'bg-white/20' 
                          : 'bg-primary/10 text-primary'
                    }`}>
                      {surah.nomor}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className={`font-bold text-sm tracking-tight ${playingSurah?.nomor === surah.nomor && isPlaying ? 'text-primary' : ''}`}>{surah.namaLatin}</h4>
                        {playingSurah?.nomor === surah.nomor && isPlaying && (
                          <div className="flex items-center gap-0.5">
                            <div className="w-1 h-3 bg-primary animate-bounce-slow rounded-full" />
                            <div className="w-1 h-4 bg-primary animate-bounce rounded-full" />
                            <div className="w-1 h-2 bg-primary animate-bounce-fast rounded-full" />
                          </div>
                        )}
                      </div>

                      <p className={`text-[10px] uppercase font-semibold tracking-wider mt-0.5 ${selectedSurah?.nomor === surah.nomor && !(playingSurah?.nomor === surah.nomor && isPlaying) ? 'text-white/70' : 'text-muted-foreground'}`}>
                        {surah.arti} • {surah.jumlahAyat} Ayat
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <h3 className={`font-arabic text-lg ${selectedSurah?.nomor === surah.nomor && !(playingSurah?.nomor === surah.nomor && isPlaying) ? 'text-white' : 'text-primary'}`}>
                      {surah.nama}
                    </h3>
                  </div>
                </button>

              ))}
            </div>
          </div>
        )}

        {/* Right Area: List View OR Mushaf View */}
        <div className={`${(viewMode === 'list' || !selectedSurah) ? 'lg:col-span-8' : 'lg:col-span-12'}`} id="surah-detail-view">
          {viewMode === 'mushaf' ? (
            <MushafView />
          ) : (
            <>
              {!selectedSurah ? (
                <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-8 md:p-12 bg-card border rounded-3xl text-center space-y-6">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center animate-bounce duration-1000">
                    <BookOpen className="h-10 w-10 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold">Mushaf Al-Quran Digital</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto text-sm">
                      Silakan pilih surah untuk mulai membaca dengan navigasi yang mudah dan murottal lengkap.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Surah Header Card */}
                  <div className="rounded-3xl border border-primary/20 overflow-hidden bg-gradient-to-br from-primary/5 to-transparent p-6 md:p-8 relative">
                    <div className="absolute top-4 left-4 lg:hidden">
                        <Button variant="ghost" size="icon" onClick={() => setSelectedSurah(null)} className="rounded-full h-8 w-8 hover:bg-black/5">
                          <X className="h-5 w-5" />
                        </Button>
                    </div>
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-white/50 border-primary/20">{selectedSurah.tempatTurun}</Badge>
                        <Badge variant="outline" className="bg-white/50 border-primary/20">{selectedSurah.jumlahAyat} Ayat</Badge>
                      </div>
                      <div className="space-y-1">
                        <h2 className="text-4xl md:text-5xl font-arabic text-primary drop-shadow-sm">{selectedSurah.nama}</h2>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{selectedSurah.namaLatin}</h1>
                        <div className="flex items-center justify-center gap-3 mt-4">
                         <Button 
                          variant="default" 
                          size="lg" 
                          className="rounded-full gap-2 px-8 h-14 text-lg font-bold shadow-xl shadow-primary/30"
                          onClick={() => toggleAudio(selectedSurah.audioFull[selectedQari.equranId], -2, selectedSurah)}
                        >
                          {currentAudio === selectedSurah.audioFull[selectedQari.equranId] && isPlaying ? (
                            <>
                              <Pause className="h-6 w-6" /> Jeda Murottal
                            </>
                          ) : (
                            <>
                              <Play className="h-6 w-6" /> Putar Full Surah
                            </>
                          )}
                        </Button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8">
                      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <div className="flex justify-center mb-8">
                          <TabsList className="bg-white/50 border rounded-full h-11 p-1">
                            <TabsTrigger value="surah" className="rounded-full gap-2 px-6">
                              <Type className="h-4 w-4" /> Baca
                            </TabsTrigger>
                            <TabsTrigger value="tafsir" className="rounded-full gap-2 px-6">
                              <Book className="h-4 w-4" /> Tafsir
                            </TabsTrigger>
                            <TabsTrigger value="bookmarks" className="rounded-full gap-2 px-6">
                              <BookOpen className="h-4 w-4" /> Bookmark
                            </TabsTrigger>
                          </TabsList>
                        </div>
                        
                        <div>
                          {/* Bismillah */}
                          {activeTab === 'surah' && selectedSurah.nomor !== 1 && selectedSurah.nomor !== 9 && (
                            <div className="text-center mb-12">
                              <p className="font-arabic text-4xl text-foreground/90">بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ</p>
                            </div>
                          )}

                          <TabsContent value="surah" className="mt-0">
                            {loadingDetail ? (
                              <div className="flex flex-col items-center justify-center py-20 gap-3">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <p className="text-sm text-muted-foreground font-medium">Memuat ayat...</p>
                              </div>
                            ) : (
                              <div className="space-y-12">
                                {surahDetail?.ayat?.map((ayah, idx) => (
                                  <div 
                                    id={`ayah-${ayah.nomorAyat}`}
                                    key={idx} 
                                    className={`group animate-in fade-in slide-in-from-bottom-4 duration-500 p-4 rounded-3xl transition-all ${currentAyahIndex === idx ? 'bg-primary/5 ring-1 ring-primary/20' : ''}`}
                                  >
                                    <div className="flex flex-col md:flex-row-reverse items-start justify-between gap-6 mb-6">
                                      <div className="flex items-start md:flex-col items-center gap-3 w-full md:w-auto">
                                        <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-[10px] font-bold transition-colors ${currentAyahIndex === idx ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'border-primary/20 text-primary bg-primary/5'}`}>
                                          {ayah.nomorAyat}
                                        </div>
                                        <Button 
                                          size="icon" 
                                          variant={currentAyahIndex === idx && isPlaying ? 'default' : 'outline'} 
                                          className={`h-9 w-9 rounded-full shadow-sm hover:scale-110 transition-transform ${currentAyahIndex === idx && isPlaying ? 'bg-primary' : 'border-primary/20 text-primary'}`}
                                          onClick={() => toggleAudio(ayah.audio[selectedQari.equranId] || ayah.audio['05'], idx)}
                                        >
                                          {currentAyahIndex === idx && isPlaying ? (
                                            <Pause className="h-4 w-4" />
                                          ) : (
                                            <Play className="h-4 w-4 fill-current" />
                                          )}
                                        </Button>
                                        <Button 
                                          size="icon" 
                                          variant="outline" 
                                          className={`h-9 w-9 rounded-full border-primary/20 text-primary hover:bg-primary/10 ${bookmarks.find(b => b.id === `${selectedSurah.nomor}:${ayah.nomorAyat}`) ? 'bg-primary text-white border-primary' : ''}`}
                                          onClick={() => toggleBookmark(selectedSurah, ayah)}
                                        >
                                          <BookOpen className="h-4 w-4" />
                                        </Button>
                                      </div>

                                      <div className="flex-1 text-right w-full">
                                        <p 
                                          style={{ fontSize: `${fontSize}px` }}
                                          className={`font-arabic leading-[1.8] md:leading-[2.2] tracking-wide transition-all ${currentAyahIndex === idx ? 'text-primary' : 'text-foreground/90'}`}
                                        >
                                          {ayah.teksArab}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="md:pr-20 space-y-2.5 px-2">
                                      <p className="text-primary font-bold italic text-sm leading-relaxed">{ayah.teksLatin}</p>
                                      {showTranslation && (
                                        <p className="text-sm text-muted-foreground leading-relaxed">{ayah.teksIndonesia}</p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </TabsContent>

                          <TabsContent value="tafsir" className="mt-0">
                            {loadingTafsir ? (
                              <div className="flex flex-col items-center justify-center py-20 gap-3">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <p className="text-sm text-muted-foreground font-medium">Memuat Tafsir...</p>
                              </div>
                            ) : (
                              <div className="space-y-10">
                                 <div className="bg-primary/5 rounded-3xl p-6 border border-primary/10 relative overflow-hidden">
                                    <h4 className="font-bold flex items-center gap-3 mb-4 text-lg">
                                      <Info className="h-5 w-5 text-primary" /> Info Surat
                                    </h4>
                                    <div className="text-sm leading-relaxed text-muted-foreground" 
                                      dangerouslySetInnerHTML={{ __html: selectedSurah.deskripsi }} />
                                 </div>

                                 <div className="space-y-8">
                                   {tafsirData?.tafsir?.map((t, idx) => (
                                     <div key={idx} className="space-y-4 p-6 rounded-3xl bg-card border-border/60 border shadow-sm">
                                        <Badge variant="secondary" className="bg-primary/10 text-primary border-0 rounded-lg font-bold px-3 py-1 mb-2">Ayat {t.ayat}</Badge>
                                        <p className="text-sm md:text-base leading-relaxed text-muted-foreground whitespace-pre-wrap">
                                          {t.teks}
                                        </p>
                                     </div>
                                   ))}
                                 </div>
                              </div>
                            )}
                          </TabsContent>
                           <TabsContent value="bookmarks" className="mt-0">
                              <div className="space-y-6">
                                {bookmarks.length === 0 ? (
                                  <div className="text-center py-20 bg-primary/5 rounded-3xl border border-dashed border-primary/20">
                                    <BookOpen className="h-12 w-12 text-primary/30 mx-auto mb-4" />
                                    <p className="text-muted-foreground font-medium">Belum ada ayat yang disimpan</p>
                                    <p className="text-xs text-muted-foreground mt-1">Klik ikon bookmark pada ayat untuk menyimpan</p>
                                  </div>
                                ) : (
                                  bookmarks.map((bm, i) => (
                                    <div key={i} className="p-6 rounded-3xl bg-card border shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                                       <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                          <BookOpen className="h-20 w-20 text-primary" />
                                       </div>
                                       <div className="flex items-center justify-between mb-4">
                                          <Badge className="bg-primary text-white font-bold">{bm.surahNama} : {bm.ayahNomor}</Badge>
                                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => toggleBookmark({nomor: bm.surahNomor}, {nomorAyat: bm.ayahNomor})}>
                                             <X className="h-4 w-4" />
                                          </Button>
                                       </div>
                                       <p className="font-arabic text-2xl text-right mb-4 leading-relaxed">{bm.text}</p>
                                       <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="rounded-full text-xs font-bold"
                                        onClick={() => {
                                          if (selectedSurah?.nomor !== bm.surahNomor) {
                                            const s = surahs.find(x => x.nomor === bm.surahNomor);
                                            handleSurahClick(s);
                                          }
                                          setActiveTab('surah');
                                          setTimeout(() => {
                                            const el = document.getElementById(`ayah-${bm.ayahNomor}`);
                                            el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                          }, 500);
                                        }}
                                       >
                                         Buka Ayat
                                       </Button>
                                    </div>
                                  ))
                                )}
                              </div>
                           </TabsContent>
                        </div>
                      </Tabs>

                    </div>
                  </div>

                  {/* Navigation controls */}
                  <div className="flex items-center justify-between bg-card border border-border/60 rounded-3xl p-5 shadow-sm sticky bottom-6 z-40 backdrop-blur-md bg-white/90">
                    <Button 
                      variant="ghost" 
                      disabled={selectedSurah.nomor === 1}
                      onClick={() => handleSurahClick(surahs[selectedSurah.nomor - 2])}
                      className="gap-2 rounded-full px-4"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="hidden sm:inline font-bold">Sebelumnya</span>
                    </Button>
                    <div className="flex items-center gap-3">
                       <div className="w-11 h-11 rounded-full bg-primary shadow-lg shadow-primary/20 flex items-center justify-center text-primary-foreground font-bold text-base">
                         {selectedSurah.nomor}
                       </div>
                       <div className="hidden sm:block">
                          <p className="font-bold leading-none">{selectedSurah.namaLatin}</p>
                       </div>
                    </div>
                    <Button 
                      variant="ghost"
                      disabled={selectedSurah.nomor === 114}
                      onClick={() => handleSurahClick(surahs[selectedSurah.nomor])}
                      className="gap-2 rounded-full px-4"
                    >
                      <span className="hidden sm:inline font-bold">Berikutnya</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Floating Audio Player (Fixed Mini) */}
      {currentAudio && isPlaying && (
        <div className="fixed bottom-6 right-6 z-[100] animate-in slide-in-from-right-10">
          <div className="bg-primary text-primary-foreground rounded-full px-6 py-3.5 shadow-2xl flex items-center gap-4 border-2 border-white/20">
            <Music className="h-4 w-4 animate-bounce" />
            <div className="flex flex-col">
              <span className="text-xs font-bold leading-none">
                {currentAyahIndex === -2 ? `Murottal Full Surah` : `${selectedSurah?.namaLatin} : ${currentAyahIndex + 1}`}
              </span>
              {currentAyahIndex === -2 && <span className="text-[10px] opacity-80 mt-1 font-semibold">{selectedSurah?.namaLatin}</span>}
            </div>
            <Button size="icon" variant="ghost" className="h-9 w-9 rounded-full text-white" onClick={stopAudio}>
               <Pause className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}
      {/* Ayah Detail Dialog */}
      <Dialog open={showAyahDialog} onOpenChange={setShowAyahDialog}>
        <DialogContent className="sm:max-w-[600px] border-[#c5a059]/30 rounded-3xl overflow-hidden p-0 max-h-[90vh] overflow-y-auto custom-scrollbar">
          {isDetailLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-muted-foreground font-medium">Menganalisis ayat...</p>
            </div>
          ) : selectedAyahDetail && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               {/* Header Background */}
               <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-6 border-b border-primary/10 relative">
                  <div className="flex items-center justify-between">
                     <div>
                        <Badge className="bg-primary/20 text-primary border-0 rounded-lg mb-2">Ayat {selectedAyahDetail.nomorAyat}</Badge>
                        <h2 className="text-xl font-bold tracking-tight">{selectedAyahDetail.surahName}</h2>
                     </div>
                     <div className="text-right">
                        <p className="font-arabic text-2xl text-primary">{selectedAyahDetail.surahName}</p>
                     </div>
                  </div>
               </div>

               <div className="p-6 space-y-8">
                  {/* Arabic Text Highlight */}
                  <div className="text-right p-6 bg-white rounded-3xl border border-primary/5 shadow-inner">
                     <p className="font-arabic text-4xl leading-[2] text-foreground/90">
                        {selectedAyahDetail.teksArab}
                     </p>
                  </div>

                  {/* Tabs: Terjemah & Tafsir */}
                  <Tabs defaultValue="terjemah" className="w-full">
                     <TabsList className="grid grid-cols-2 bg-muted rounded-full">
                        <TabsTrigger value="terjemah" className="rounded-full">Terjemahan</TabsTrigger>
                        <TabsTrigger value="tafsir" className="rounded-full">Tafsir</TabsTrigger>
                     </TabsList>
                     <div className="mt-6">
                        <TabsContent value="terjemah" className="space-y-4">
                           <p className="text-primary font-bold italic leading-relaxed">{selectedAyahDetail.teksLatin}</p>
                           <p className="text-muted-foreground leading-relaxed text-lg">{selectedAyahDetail.teksIndonesia}</p>
                        </TabsContent>
                        <TabsContent value="tafsir">
                           <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 italic text-muted-foreground leading-relaxed whitespace-pre-wrap">
                              {selectedAyahDetail.tafsir}
                           </div>
                        </TabsContent>
                     </div>
                  </Tabs>
               </div>

               <DialogFooter className="p-6 bg-slate-50 border-t flex flex-row items-center justify-between gap-4">
                  <Button variant="outline" size="lg" className="rounded-full flex-1 gap-2" onClick={() => toggleAudio(selectedAyahDetail.audio[selectedQari.equranId], 999)}>
                     {currentAudio === selectedAyahDetail.audio[selectedQari.equranId] && isPlaying ? <Pause className="h-5 w-5" /> : <Headphones className="h-5 w-5" />}
                     {currentAudio === selectedAyahDetail.audio[selectedQari.equranId] && isPlaying ? 'Jeda Audio' : 'Putar Audio Ayat'}
                  </Button>
                  <Button variant="ghost" onClick={() => setShowAyahDialog(false)} className="rounded-full px-8">Tutup</Button>
               </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
