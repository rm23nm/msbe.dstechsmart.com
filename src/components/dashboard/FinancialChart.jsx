import React, { useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-border shadow-2xl animate-in fade-in zoom-in duration-300">
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 italic border-b pb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-3 mb-1.5">
            <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: entry.color }} />
            <div className="flex-1">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{entry.name}</p>
              <p className="text-sm font-black text-slate-900">Rp {entry.value.toLocaleString('id-ID')}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function FinancialChart({ transactions = [], height = 300, isDark = false }) {
  const chartData = useMemo(() => {
    // Process last 7 months or specific range
    const months = {};
    const now = new Date();
    
    // Sort transactions by date
    const sorted = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    sorted.forEach(t => {
      const d = new Date(t.date);
      const mName = d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
      if (!months[mName]) months[mName] = { date: mName, income: 0, expense: 0 };
      
      if (t.type === 'income') months[mName].income += t.amount;
      else months[mName].expense += t.amount;
    });

    return Object.values(months).slice(-6); // Take last 6 entries
  }, [transactions]);

  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 opacity-20 italic">
        <p className="font-bold uppercase tracking-[0.2em] text-xs">TIADA DATA GRAFIK</p>
      </div>
    );
  }

  const textColor = isDark ? "#94a3b8" : "#64748b";

  return (
    <div style={{ width: '100%', height }} className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} />
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: textColor, fontSize: 10, fontWeight: 700 }}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: textColor, fontSize: 10, fontWeight: 700 }}
            tickFormatter={(v) => `Rp ${v >= 1000000 ? (v/1000000).toFixed(1) + 'jt' : (v/1000).toFixed(0) + 'rb'}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="top" 
            align="right" 
            iconType="circle"
            wrapperStyle={{ paddingBottom: 20, fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}
          />
          <Area 
            type="monotone" 
            dataKey="income" 
            name="Pemasukan"
            stroke="#10b981" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorIncome)" 
            animationDuration={2000}
          />
          <Area 
            type="monotone" 
            dataKey="expense" 
            name="Pengeluaran"
            stroke="#ef4444" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorExpense)" 
            animationDuration={2000}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
