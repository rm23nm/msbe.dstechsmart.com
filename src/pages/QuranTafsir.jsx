import React from "react";
import { BookOpen } from "lucide-react";
import PageHeader from "../components/PageHeader";
import QuranReader from "../components/QuranReader";

export default function QuranTafsir() {
  return (
    <div className="space-y-6 pb-20">
      <PageHeader 
        title="Al-Quran & Tafsir" 
        subtitle="Baca Al-Quran, dengarkan murotal, dan pelajari tafsir ayat lengkap"
        icon={BookOpen}
      />
      <QuranReader />
    </div>
  );
}
