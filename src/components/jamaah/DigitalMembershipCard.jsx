import React from 'react';
import { motion } from 'framer-motion';
import QRCode from 'react-qr-code';
import { ShieldCheck, Calendar, User, Building2, Sparkles } from 'lucide-react';

export default function DigitalMembershipCard({ member, mosque, isElite = false }) {
  if (!member) return null;

  const memberName = member.user_name || "Jamaah";
  const memberId = member.membership_id || `MJS-${member.id.substring(0, 5).toUpperCase()}`;
  const joinDate = member.join_date || new Date(member.createdAt).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="relative w-full max-w-md aspect-[1.586/1] rounded-[2.5rem] overflow-hidden shadow-2xl group cursor-pointer"
    >
      {/* Background Layer with Animated Gradient */}
      <div className={`absolute inset-0 transition-all duration-700 ${
        isElite 
          ? "bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900" 
          : "bg-gradient-to-br from-emerald-600 via-emerald-800 to-emerald-950"
      }`}>
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-repeat" />
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-300/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Content Layer */}
      <div className="relative h-full p-8 flex flex-col justify-between text-white border border-white/10 backdrop-blur-[2px]">
        {/* Card Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center p-1.5 overflow-hidden">
               <img src={mosque?.logo_url || "/favicon.png"} alt="logo" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-black tracking-tight leading-tight uppercase truncate">{mosque?.name || "MasjidKu Member"}</h4>
              <p className="text-[9px] text-emerald-300/80 font-bold uppercase tracking-widest leading-none mt-1">KARTU DIGITAL JAMAAH</p>
            </div>
          </div>
          {isElite && <Sparkles className="w-5 h-5 text-amber-400 animate-spin-slow" />}
          {!isElite && <ShieldCheck className="w-5 h-5 text-emerald-300 opacity-50" />}
        </div>

        {/* Card Body - Name and Info */}
        <div className="flex items-end justify-between gap-4">
          <div className="flex-1 space-y-4">
            <div>
              <p className="text-[8px] font-black uppercase tracking-[0.2em] text-emerald-300/60 mb-0.5">Nama Lengkap</p>
              <h3 className="text-xl font-black tracking-tight bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent truncate">
                {memberName}
              </h3>
            </div>
            <Building2 className="w-5 h-5 text-[#c5a059]" />
            
            <div className="flex gap-6">
              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-emerald-300/60 mb-0.5">ID Anggota</p>
                <p className="text-xs font-black tracking-tighter tabular-nums">{memberId}</p>
              </div>
              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-emerald-300/60 mb-0.5">Bergabung</p>
                <p className="text-xs font-black tracking-tighter tabular-nums">{joinDate}</p>
              </div>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="bg-white p-2 rounded-2xl shadow-xl ring-4 ring-black/10 group-hover:scale-105 transition-transform duration-500">
            <QRCode 
              value={memberId} 
              size={64} 
              fgColor={isElite ? "#064e3b" : "#065f46"} 
              bgColor="#ffffff" 
              level="H"
            />
          </div>
        </div>

        {/* Footer Accent */}
        <div className="absolute bottom-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent" />
      </div>

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </motion.div>
  );
}
