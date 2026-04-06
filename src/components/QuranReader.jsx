import React, { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, Search, Play, Pause, ChevronRight, ChevronLeft, 
  Volume2, Book, Loader2, Music, List, Info, Type, X, Layout, Maximize2, Headphones,
  Bookmark, Share2, Sparkles, Settings2, Heart, VolumeX
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter 
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
  const [viewMode, setViewMode] = useState("list"); 
  const [selectedQari, setSelectedQari] = useState(QARIS[0]);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pageData, setPageData] = useState(null);
  const [loadingPage, setLoadingPage] = useState(false);
  const [playingSurah, setPlayingSurah] = useState(null);

  const [showAyahDialog, setShowAyahDialog] = useState(false);
  const [selectedAyahDetail, setSelectedAyahDetail] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [currentAyahIndex, setCurrentAyahIndex] = useState(-1);
  const [audioProgress, setAudioProgress] = useState(0);
  const audioRef = useRef(new Audio());
  
  const [fontSize, setFontSize] = useState(parseInt(localStorage.getItem('quran_font_size')) || 32);
  const [showTranslation, setShowTranslation] = useState(localStorage.getItem('quran_show_translation') !== 'false');
  const [bookmarks, setBookmarks] = useState(JSON.parse(localStorage.getItem('quran_bookmarks')) || []);
  const [lastRead, setLastRead] = useState(JSON.parse(localStorage.getItem('quran_last_read')) || null);
  const [showTajweed, setShowTajweed] = useState(localStorage.getItem('quran_show_tajweed') === 'true');

  useEffect(() => {
    localStorage.setItem('quran_font_size', fontSize);
    localStorage.setItem('quran_show_translation', showTranslation);
    localStorage.setItem('quran_show_tajweed', showTajweed);
    localStorage.setItem('quran_bookmarks', JSON.stringify(bookmarks));
  }, [fontSize, showTranslation, bookmarks, showTajweed]);

  useEffect(() => {
    fetchSurahs();
    const audio = audioRef.current;
    const updateProgress = () => {
      if (audio.duration) {
        setAudioProgress((audio.currentTime / audio.duration) * 100);
      }
    };
    audio.addEventListener('timeupdate', updateProgress);
    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', updateProgress);
    };
  }, []);

  useEffect(() => {
    if (viewMode === 'mushaf') fetchPageData(currentPage);
  }, [viewMode, currentPage]);

  const fetchSurahs = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/surat`);
      setSurahs(data.data || []);
    } catch (error) { toast.error("Gagal memuat Al-Quran"); }
    finally { setLoading(false); }
  };

  const fetchPageData = async (page) => {
    setLoadingPage(true);
    try {
      const edition = showTajweed ? 'quran-tajweed' : 'quran-uthmani';
      const { data } = await axios.get(`${MUSHAF_API}/page/${page}/${edition}`);
      setPageData(data.data);
    } catch (error) { toast.error("Gagal memuat mushaf"); }
    finally { setLoadingPage(false); }
  };

  const parseTajweed = (text) => {
    if (!text) return "";
    let output = "";
    let stack = [];
    for (let i = 0; i < text.length; i++) {
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
    try {
      const { data } = await axios.get(`${API_BASE}/surat/${nomor}`);
      setSurahDetail(data.data);
      if (viewMode === 'mushaf') setCurrentPage(data.data.ayat[0].halaman || 1);
      stopAudio();
    } catch (error) { toast.error("Gagal memuat detail surah"); }
    finally { setLoadingDetail(false); }
  };

  const handleSurahClick = (surah) => {
    setSelectedSurah(surah);
    fetchSurahDetail(surah.nomor);
    const progress = { nomor: surah.nomor, nama: surah.namaLatin, time: new Date().toISOString() };
    setLastRead(progress);
    localStorage.setItem('quran_last_read', JSON.stringify(progress));
    stopAudio();
  };

  const toggleAudio = (audioUrl, index, currentSurah = null) => {
    if (currentAyahIndex === index && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      stopAudio();
      audioRef.current.src = audioUrl;
      audioRef.current.play();
      setCurrentAudio(audioUrl);
      setCurrentAyahIndex(index);
      setIsPlaying(true);
      setPlayingSurah(currentSurah || selectedSurah);
      
      audioRef.current.onended = () => {
        if (index === -2) stopAudio();
        else {
          const nextIdx = index + 1;
          if (surahDetail && nextIdx < surahDetail.ayat.length) {
            const nextAyah = surahDetail.ayat[nextIdx];
            toggleAudio(nextAyah.audio[selectedQari.equranId], nextIdx);
          } else stopAudio();
        }
      };
    }
  };

  const stopAudio = () => {
    audioRef.current.pause();
    setIsPlaying(false);
    setCurrentAyahIndex(-1);
    setPlayingSurah(null);
    setCurrentAudio(null);
    setAudioProgress(0);
  };

  const filteredSurahs = surahs.filter(s => 
    s.namaLatin.toLowerCase().includes(search.toLowerCase()) || 
    s.nomor.toString().includes(search)
  );

  return (
    <div className="min-h-screen smart-islamic-bg -mt-6">
      {/* Premium Header Nav */}
      <div className="sticky top-0 z-[100] bg-white/80 backdrop-blur-xl border-b border-emerald-100 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 smart-gold-gradient rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-black italic tracking-tighter uppercase text-emerald-950">Al-Quran Smart</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Premium Digital Manuscript</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
           <div className="hidden lg:flex items-center gap-1 bg-emerald-50/50 p-1 rounded-2xl border border-emerald-100 mr-2">
              <Button variant="ghost" size="sm" className="rounded-xl h-8 px-4 text-[10px] font-black uppercase" onClick={() => setShowTajweed(!showTajweed)}>
                {showTajweed ? "Tajwid Aktif" : "Tajwid"}
              </Button>
              <Button variant="ghost" size="sm" className="rounded-xl h-8 px-4 text-[10px] font-black uppercase" onClick={() => setViewMode(viewMode === 'list' ? 'mushaf' : 'list')}>
                {viewMode === 'list' ? "Mushaf" : "List"}
              </Button>
           </div>
           {selectedSurah && (
             <Button variant="ghost" size="icon" onClick={() => setSelectedSurah(null)} className="rounded-full h-10 w-10 lg:hidden">
               <X className="h-5 w-5" />
             </Button>
           )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* List Surah - Side Navigator */}
          <AnimatePresence>
            {(viewMode === 'list' || !selectedSurah) && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={`lg:col-span-4 space-y-6 ${selectedSurah ? 'hidden lg:block' : 'block'}`}
              >
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-300 group-focus-within:text-emerald-600 transition-colors" />
                  <Input 
                    placeholder="Cari Surah Abadi..." 
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-12 h-14 rounded-[1.5rem] border-emerald-100 bg-white/70 focus:ring-emerald-500 shadow-sm"
                  />
                </div>

                {lastRead && (
                  <motion.div whileHover={{ scale: 1.02 }} className="p-4 rounded-[2rem] smart-gold-gradient text-white shadow-xl shadow-amber-200/50 relative overflow-hidden group cursor-pointer" onClick={() => handleSurahClick(surahs.find(s => s.nomor === lastRead.nomor))}>
                    <Sparkles className="absolute -right-4 -top-4 h-24 w-24 opacity-20 rotate-12 group-hover:scale-125 transition-transform" />
                    <div className="relative z-10">
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Terakhir Telusuri</p>
                      <h4 className="text-lg font-black italic tracking-tighter uppercase">{lastRead.nama}</h4>
                    </div>
                  </motion.div>
                )}

                <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                  {filteredSurahs.map((s) => (
                    <motion.button
                      key={s.nomor}
                      onClick={() => handleSurahClick(s)}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full smart-card-hover p-4 rounded-[2rem] border flex items-center justify-between group ${
                        selectedSurah?.nomor === s.nomor 
                          ? 'bg-emerald-950 border-emerald-800 text-white shadow-2xl scale-[1.02]' 
                          : 'bg-white border-emerald-50/50 hover:bg-emerald-50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black italic text-sm ${
                          selectedSurah?.nomor === s.nomor ? 'bg-amber-400 text-emerald-950' : 'bg-emerald-100 text-emerald-600'
                        }`}>
                          {s.nomor}
                        </div>
                        <div className="text-left">
                          <h4 className="font-black italic tracking-tighter uppercase text-sm">{s.namaLatin}</h4>
                          <p className={`text-[10px] font-bold uppercase tracking-wider ${selectedSurah?.nomor === s.nomor ? 'text-emerald-300' : 'text-slate-400'}`}>
                            {s.arti} • {s.jumlahAyat} Ayat
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <h3 className={`font-amiri text-xl ${selectedSurah?.nomor === s.nomor ? 'text-amber-400' : 'text-emerald-800'}`}>
                          {s.nama}
                        </h3>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Content Area */}
          <div className={`${(viewMode === 'list' || !selectedSurah) ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
            <AnimatePresence mode="wait">
              {!selectedSurah ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="h-full min-h-[500px] smart-glass rounded-[3rem] flex flex-col items-center justify-center p-12 text-center"
                >
                  <div className="w-24 h-24 rounded-[2.5rem] smart-gold-gradient shadow-2xl flex items-center justify-center mb-6 animate-pulse-gold">
                    <BookOpen className="h-10 w-10 text-white" />
                  </div>
                  <h2 className="text-3xl font-black italic tracking-tighter uppercase text-emerald-950 mb-2">Pilih Surah Abadi</h2>
                  <p className="text-slate-500 max-w-sm font-medium tracking-tight">Sentuh salah satu surah di daftar untuk memulai perjalanan spiritual Bapak dengan kemurnian visual Al-Quran Smart.</p>
                </motion.div>
              ) : (
                <motion.div 
                  key={selectedSurah.nomor}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                  {/* Surah Hero Card */}
                  <div className="relative rounded-[3rem] overflow-hidden p-8 md:p-12 text-center shadow-2xl border border-emerald-100">
                    <div className="absolute inset-0 smart-islamic-bg opacity-50" />
                    <div className="absolute top-0 left-0 w-full h-2 smart-gold-gradient" />
                    
                    <div className="relative z-10 flex flex-col items-center">
                       <div className="flex gap-2 mb-6">
                         <Badge className="bg-emerald-100 text-emerald-700 px-4 py-1 rounded-full uppercase font-black text-[10px] tracking-widest">{selectedSurah.tempatTurun}</Badge>
                         <Badge className="bg-amber-100 text-amber-700 px-4 py-1 rounded-full uppercase font-black text-[10px] tracking-widest">{selectedSurah.jumlahAyat} AYAT</Badge>
                       </div>
                       <h2 className="text-6xl md:text-7xl font-amiri text-emerald-900 mb-2 smart-glow-gold">{selectedSurah.nama}</h2>
                       <h1 className="text-3xl md:text-4xl font-black italic tracking-tighter uppercase text-emerald-950">{selectedSurah.namaLatin}</h1>
                       <div className="w-16 h-1 bg-amber-400 rounded-full my-6" />
                       
                       <Button 
                        size="lg" 
                        onClick={() => toggleAudio(selectedSurah.audioFull[selectedQari.equranId], -2)}
                        className="rounded-full gap-3 h-16 px-10 smart-gold-gradient text-white border-0 shadow-xl shadow-amber-200 font-black italic tracking-tighter text-xl uppercase hover:scale-105 active:scale-95 transition-all"
                       >
                         {currentAyahIndex === -2 && isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 fill-current" />}
                         Full Surah
                       </Button>
                    </div>
                  </div>

                  {/* Tabs Logic */}
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <div className="flex justify-center mb-10">
                      <TabsList className="smart-glass p-1.5 rounded-[2rem] h-14 border-emerald-100">
                        <TabsTrigger value="surah" className="rounded-full px-8 gap-2 font-black italic uppercase tracking-tighter text-sm">
                           Terjemah
                        </TabsTrigger>
                        <TabsTrigger value="mushaf" className="rounded-full px-8 gap-2 font-black italic uppercase tracking-tighter text-sm">
                           Mushaf
                        </TabsTrigger>
                        <TabsTrigger value="tafsir" className="rounded-full px-8 gap-2 font-black italic uppercase tracking-tighter text-sm">
                           Tafsir
                        </TabsTrigger>
                      </TabsList>
                    </div>

                    <TabsContent value="surah">
                      <div className="space-y-12 pb-32">
                        {selectedSurah.nomor !== 1 && selectedSurah.nomor !== 9 && (
                          <div className="text-center py-10 opacity-80">
                             <p className="font-amiri text-4xl text-emerald-900">بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ</p>
                          </div>
                        )}
                        
                        {loadingDetail ? (
                          <div className="py-20 text-center"><Loader2 className="h-10 w-10 animate-spin mx-auto text-emerald-600" /></div>
                        ) : (
                          surahDetail?.ayat?.map((a, i) => (
                            <motion.div 
                              key={a.nomorAyat}
                              initial={{ opacity: 0, y: 10 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              viewport={{ once: true }}
                              className={`group relative p-8 rounded-[2.5rem] border transition-all ${
                                currentAyahIndex === i ? 'bg-emerald-50/50 border-emerald-200 ring-2 ring-emerald-500/20' : 'bg-white border-slate-100'
                              }`}
                            >
                               <div className="flex flex-col md:flex-row-reverse gap-8 items-start">
                                  <div className="flex-1 text-right w-full">
                                     <p 
                                      style={{ fontSize: `${fontSize}px` }}
                                      className="font-amiri leading-[2.5] text-emerald-950 smart-glow-gold"
                                      dangerouslySetInnerHTML={{ __html: showTajweed ? parseTajweed(a.teksArab) : a.teksArab }}
                                     />
                                  </div>
                                  
                                  <div className="flex flex-col items-center gap-3 w-full md:w-16 pt-2">
                                     <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black italic text-sm ${
                                       currentAyahIndex === i ? 'bg-emerald-600 text-white shadow-lg' : 'bg-emerald-50 text-emerald-600'
                                     }`}>
                                        {a.nomorAyat}
                                     </div>
                                     <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      onClick={() => toggleAudio(a.audio[selectedQari.equranId], i)}
                                      className="h-10 w-10 rounded-2xl hover:bg-emerald-100 text-emerald-600"
                                     >
                                       {currentAyahIndex === i && isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                                     </Button>
                                     <Button variant="ghost" size="icon" className="h-10 w-10 rounded-2xl text-slate-300 hover:text-amber-400">
                                       <Bookmark className="h-5 w-5" />
                                     </Button>
                                  </div>
                               </div>

                               <div className="mt-8 md:pr-24 space-y-3">
                                  <p className="text-emerald-700 font-bold italic text-sm leading-relaxed tracking-tight">{a.teksLatin}</p>
                                  {showTranslation && (
                                    <p className="text-slate-500 text-base leading-loose font-medium">{a.teksIndonesia}</p>
                                  )}
                               </div>
                            </motion.div>
                          ))
                        )}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="tafsir">
                        {/* Tafsir content here, similar luxury styling */}
                        <div className="grid grid-cols-1 gap-6 pb-32">
                          <div className="p-8 smart-glass rounded-[3rem] border-emerald-100">
                             <h4 className="font-black italic tracking-tighter uppercase text-emerald-900 mb-4 flex items-center gap-2">
                               <Info className="h-5 w-5" /> Pengantar Surah
                             </h4>
                             <div className="text-slate-600 italic leading-loose text-sm" dangerouslySetInnerHTML={{ __html: selectedSurah.deskripsi }} />
                          </div>
                        </div>
                    </TabsContent>
                  </Tabs>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Floating Smart Audio Dock */}
      <AnimatePresence>
        {currentAudio && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] w-[95%] max-w-2xl"
          >
            <div className="smart-glass p-4 rounded-[2.5rem] shadow-[0_20px_50px_rgba(6,78,59,0.3)] border-2 border-emerald-100/30 flex items-center justify-between gap-6 relative overflow-hidden">
               {/* Progress Bar */}
               <div className="absolute top-0 left-0 h-1 smart-gold-gradient transition-all duration-300" style={{ width: `${audioProgress}%` }} />
               
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-950 rounded-2xl flex items-center justify-center text-amber-400 relative overflow-hidden">
                     {isPlaying && (
                        <div className="absolute inset-0 flex items-center justify-center gap-[2px] opacity-40 px-2">
                           {[1,2,3,4,5].map(i => (
                             <motion.div 
                               key={i}
                               animate={{ height: ["20%", "70%", "20%"] }}
                               transition={{ repeat: Infinity, duration: 0.5 + (i * 0.1), ease: "easeInOut" }}
                               className="w-1 bg-amber-400 rounded-full"
                             />
                           ))}
                        </div>
                     )}
                     <Music className="h-6 w-6 relative z-10" />
                  </div>
                  <div>
                    <h5 className="font-black italic tracking-tighter uppercase text-emerald-950 text-sm leading-none mb-1">
                      {currentAyahIndex === -2 ? selectedSurah?.namaLatin : `AYAT ${currentAyahIndex + 1}`}
                    </h5>
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 truncate max-w-[100px]">
                      {selectedQari.name}
                    </p>
                  </div>
               </div>

               <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" onClick={() => audioRef.current.currentTime -= 10} className="h-10 w-10 text-emerald-900 rounded-full">
                     <div className="relative"><ChevronLeft className="h-5 w-5" /><span className="text-[8px] absolute -bottom-1 left-1/2 -translate-x-1/2">10</span></div>
                  </Button>
                  
                  <Button 
                    onClick={() => {
                       if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
                       else { audioRef.current.play(); setIsPlaying(true); }
                    }}
                    className="w-14 h-14 rounded-full smart-gold-gradient shadow-lg shadow-amber-200 border-0 flex items-center justify-center p-0"
                  >
                    {isPlaying ? <Pause className="h-6 w-6 text-white" /> : <Play className="h-6 w-6 text-white fill-current" />}
                  </Button>

                  <Button variant="ghost" size="icon" onClick={() => audioRef.current.currentTime += 10} className="h-10 w-10 text-emerald-900 rounded-full">
                     <div className="relative"><ChevronRight className="h-5 w-5" /><span className="text-[8px] absolute -bottom-1 left-1/2 -translate-x-1/2">10</span></div>
                  </Button>
               </div>

               <Button variant="ghost" size="icon" onClick={stopAudio} className="h-10 w-10 text-slate-300 hover:text-red-500 rounded-full">
                  <X className="h-5 w-5" />
               </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
