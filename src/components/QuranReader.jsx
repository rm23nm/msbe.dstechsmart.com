import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { 
  BookOpen, Search, Play, Pause, ChevronRight, ChevronLeft, 
  Volume2, Book, Loader2, Music, List, Info, Type, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";

const API_BASE = "https://equran.id/api/v2";

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
  
  // Audio state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [currentAyahIndex, setCurrentAyahIndex] = useState(-1);
  const audioRef = useRef(new Audio());

  useEffect(() => {
    fetchSurahs();
    return () => {
      audioRef.current.pause();
    };
  }, []);

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

  const fetchSurahDetail = async (nomor) => {
    setLoadingDetail(true);
    setSurahDetail(null);
    try {
      const { data } = await axios.get(`${API_BASE}/surat/${nomor}`);
      setSurahDetail(data.data);
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

  const handeSurahClick = (surah) => {
    setSelectedSurah(surah);
    fetchSurahDetail(surah.nomor);
    fetchTafsir(surah.nomor);
    // Scroll specifically for detail view on mobile
    if (window.innerWidth < 1024) {
      setTimeout(() => {
        document.getElementById('surah-detail-view')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const toggleAudio = (audioUrl, index) => {
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
      
      audioRef.current.onended = () => {
        setIsPlaying(false);
        setCurrentAyahIndex(-1);
      };
    }
  };

  const stopAudio = () => {
    audioRef.current.pause();
    setIsPlaying(false);
    setCurrentAyahIndex(-1);
  };

  const filteredSurahs = surahs.filter(s => 
    s.namaLatin.toLowerCase().includes(search.toLowerCase()) || 
    s.arti.toLowerCase().includes(search.toLowerCase()) ||
    s.nomor.toString().includes(search)
  );

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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
        {/* Left: Surah List */}
        <div className={`lg:col-span-4 space-y-4 ${selectedSurah && window.innerWidth < 1024 ? 'hidden' : 'block'}`}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Cari surah (contoh: Al-Fatihah)..." 
              className="pl-9 h-11 border-primary/20 rounded-xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
            {filteredSurahs.map((surah) => (
              <button
                key={surah.nomor}
                onClick={() => handeSurahClick(surah)}
                className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between group ${
                  selectedSurah?.nomor === surah.nomor 
                    ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20' 
                    : 'bg-card border-border/60 hover:border-primary/50 hover:bg-primary/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs ${
                    selectedSurah?.nomor === surah.nomor ? 'bg-white/20' : 'bg-primary/10 text-primary'
                  }`}>
                    {surah.nomor}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm tracking-tight">{surah.namaLatin}</h4>
                    <p className={`text-[10px] uppercase font-semibold tracking-wider mt-0.5 ${selectedSurah?.nomor === surah.nomor ? 'text-white/70' : 'text-muted-foreground'}`}>
                      {surah.arti} • {surah.jumlahAyat} Ayat
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <h3 className={`font-arabic text-lg ${selectedSurah?.nomor === surah.nomor ? 'text-white' : 'text-primary'}`}>
                    {surah.nama}
                  </h3>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Surah Detail / Ayahs */}
        <div className="lg:col-span-8" id="surah-detail-view">
          {!selectedSurah ? (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-8 md:p-12 bg-card border rounded-3xl text-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center animate-bounce duration-1000">
                <BookOpen className="h-10 w-10 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Mushaf Al-Quran Online</h3>
                <p className="text-muted-foreground max-w-sm mx-auto text-sm">
                  Silakan pilih surah untuk membaca ayat demi ayat, mendengarkan lantunan murotal, dan mempelajari tafsir.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 max-w-lg">
                {[1, 18, 36, 67, 112].map(n => {
                  const s = surahs.find(x => x.nomor === n);
                  if (!s) return null;
                  return (
                    <Button key={n} variant="outline" size="sm" onClick={() => handeSurahClick(s)} className="rounded-full px-4 border-primary/20 hover:bg-primary/5">
                      {s.namaLatin}
                    </Button>
                  );
                })}
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
                    <p className="text-muted-foreground font-medium italic">"{selectedSurah.arti}"</p>
                  </div>
                </div>

                <div className="mt-8">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="flex justify-center mb-8">
                      <TabsList className="bg-white/50 border rounded-full h-11 p-1">
                        <TabsTrigger value="surah" className="rounded-full gap-2 px-6">
                          <Type className="h-4 w-4" /> Baca Quran
                        </TabsTrigger>
                        <TabsTrigger value="tafsir" className="rounded-full gap-2 px-6">
                          <Book className="h-4 w-4" /> Tafsir
                        </TabsTrigger>
                      </TabsList>
                    </div>
                    
                    <div>
                      {/* Bismillah */}
                      {activeTab === 'surah' && selectedSurah.nomor !== 1 && selectedSurah.nomor !== 9 && (
                        <div className="text-center mb-12">
                          <p className="font-arabic text-4xl text-foreground/90">بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ</p>
                          <p className="text-xs text-muted-foreground mt-3 font-medium uppercase tracking-widest">Dengan nama Allah Yang Maha Pengasih, Maha Penyayang</p>
                        </div>
                      )}

                      <TabsContent value="surah" className="mt-0">
                        {loadingDetail ? (
                          <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">Memuat ayat-ayat suci...</p>
                          </div>
                        ) : (
                          <div className="space-y-12">
                            {surahDetail?.ayat?.map((ayah, idx) => (
                              <div key={idx} className="group animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${idx * 50}ms` }}>
                                <div className="flex flex-col md:flex-row-reverse items-start justify-between gap-6 mb-6">
                                  <div className="flex items-start md:flex-col items-center gap-3 w-full md:w-auto">
                                    <div className="w-9 h-9 rounded-full border-2 border-primary/20 flex items-center justify-center text-[10px] font-bold text-primary bg-primary/5">
                                      {ayah.nomorAyat}
                                    </div>
                                    <Button 
                                      size="icon" 
                                      variant={currentAyahIndex === idx && isPlaying ? 'default' : 'outline'} 
                                      className={`h-9 w-9 rounded-full shadow-sm hover:scale-110 transition-transform ${currentAyahIndex === idx && isPlaying ? 'bg-primary' : 'border-primary/20 text-primary'}`}
                                      onClick={() => toggleAudio(ayah.audio['05'], idx)}
                                    >
                                      {currentAyahIndex === idx && isPlaying ? (
                                        <Pause className="h-4 w-4" />
                                      ) : (
                                        <Play className="h-4 w-4 fill-current" />
                                      )}
                                    </Button>
                                  </div>
                                  <div className="flex-1 text-right w-full">
                                    <p className="font-arabic text-3xl md:text-5xl leading-[1.8] md:leading-[1.8] tracking-wide text-foreground/90">
                                      {ayah.teksArab}
                                    </p>
                                  </div>
                                </div>
                                <div className="md:pr-20 space-y-2.5">
                                  <p className="text-primary font-bold italic text-sm md:text-base leading-relaxed">{ayah.teksLatin}</p>
                                  <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{ayah.teksIndonesia}</p>
                                </div>
                                <div className="mt-10 border-b border-primary/5 border-dashed" />
                              </div>
                            ))}
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="tafsir" className="mt-0">
                        {loadingTafsir ? (
                          <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground font-medium">Memuat Tafsir Surah...</p>
                          </div>
                        ) : (
                          <div className="space-y-10">
                             <div className="bg-primary/5 rounded-3xl p-6 md:p-8 border border-primary/10 relative overflow-hidden">
                                <div className="absolute -top-6 -right-6 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />
                                <h4 className="font-bold flex items-center gap-3 mb-4 text-lg">
                                  <div className="p-2 bg-primary/10 rounded-xl"><Info className="h-5 w-5 text-primary" /></div>
                                  Info Surat {selectedSurah.namaLatin}
                                </h4>
                                <div className="text-sm md:text-base text-muted-foreground leading-relaxed prose prose-emerald dark:prose-invert max-w-none prose-p:mb-3" 
                                  dangerouslySetInnerHTML={{ __html: selectedSurah.deskripsi }} />
                             </div>

                             <div className="space-y-8">
                               <div className="flex items-center gap-4">
                                 <h3 className="font-bold text-xl">Tafsir Ayat demi Ayat</h3>
                                 <div className="h-[2px] flex-1 bg-gradient-to-r from-primary/20 to-transparent" />
                               </div>
                               {tafsirData?.tafsir?.map((t, idx) => (
                                 <div key={idx} className="space-y-4 p-6 rounded-3xl bg-card border-border/60 border hover:border-primary/20 transition-all hover:shadow-lg hover:shadow-primary/5">
                                   <div className="flex items-center justify-between">
                                      <Badge variant="secondary" className="bg-primary/10 text-primary border-0 rounded-lg px-3 py-1 font-bold">Ayat {t.ayat}</Badge>
                                   </div>
                                   <p className="text-sm md:text-base leading-relaxed text-muted-foreground whitespace-pre-wrap">
                                     {t.teks}
                                   </p>
                                 </div>
                               ))}
                             </div>
                          </div>
                        )}
                      </TabsContent>
                    </div>
                  </Tabs>
                </div>
              </div>

              {/* Navigation controls for Surah */}
              <div className="flex items-center justify-between bg-card border border-border/60 rounded-3xl p-5 shadow-sm sticky bottom-6 z-40 backdrop-blur-md bg-white/90">
                <Button 
                  variant="ghost" 
                  disabled={selectedSurah.nomor === 1}
                  onClick={() => handeSurahClick(surahs[selectedSurah.nomor - 2])}
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
                      <p className="text-[10px] text-muted-foreground font-semibold mt-1 uppercase tracking-wider">{selectedSurah.jumlahAyat} Ayat</p>
                   </div>
                </div>
                <Button 
                  variant="ghost"
                  disabled={selectedSurah.nomor === 114}
                  onClick={() => handeSurahClick(surahs[selectedSurah.nomor])}
                  className="gap-2 rounded-full px-4"
                >
                  <span className="hidden sm:inline font-bold">Berikutnya</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Audio Player (Fixed Mini) */}
      {currentAudio && isPlaying && (
        <div className="fixed bottom-6 right-6 z-[100] animate-in slide-in-from-right-10">
          <div className="bg-primary text-primary-foreground rounded-full px-6 py-3.5 shadow-2xl flex items-center gap-4 border-2 border-white/20">
            <div className="animate-pulse flex items-center justify-center w-9 h-9 rounded-full bg-white/20">
              <Music className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold opacity-70 tracking-widest leading-none mb-1">Murotal Play:</span>
              <span className="text-sm font-bold leading-none">{selectedSurah?.namaLatin} : {currentAyahIndex + 1}</span>
            </div>
            <Button size="icon" variant="secondary" className="h-9 w-9 rounded-full ml-1 hover:scale-110 active:scale-95 transition-transform" onClick={stopAudio}>
               <Pause className="h-5 w-5 fill-primary" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
