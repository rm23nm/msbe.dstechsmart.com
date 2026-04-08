import React from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Home, RefreshCcw } from "lucide-react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Critical Runtime Error Catch by Boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 flex flex-col items-center justify-center p-6 bg-slate-950 text-white z-[99999]">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-8 border border-red-500/50 animate-pulse">
            <AlertTriangle className="h-10 w-10 text-red-500" />
          </div>
          
          <h1 className="text-3xl font-black italic tracking-tighter uppercase mb-4 text-center">Terjadi Kesalahan Fatal</h1>
          
          <div className="max-w-md bg-white/5 border border-white/10 p-6 rounded-3xl mb-10 w-full backdrop-blur-xl">
             <p className="text-[10px] uppercase font-black tracking-widest text-slate-500 mb-3">Detail Kesalahan:</p>
             <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20 text-xs font-mono text-red-300 break-all leading-relaxed">
                {this.state.error?.message || "Unknown Application Crash"}
                <br />
                <span className="text-slate-500 italic mt-2 block">Cek browser console (F12) untuk detail stack trace.</span>
             </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
            <Button 
              onClick={() => window.location.reload()} 
              className="flex-1 bg-white text-slate-950 font-black h-12 rounded-2xl gap-2 hover:bg-slate-200"
            >
              <RefreshCcw className="h-4 w-4" /> REFRESH APPS
            </Button>
            <Button 
              onClick={() => window.location.href = '/'} 
              variant="outline"
              className="flex-1 border-white/20 text-white font-black h-12 rounded-2xl gap-2 hover:bg-white/10"
            >
              <Home className="h-4 w-4" /> BERANDA
            </Button>
          </div>
          
          <p className="mt-12 text-[9px] font-black uppercase text-slate-600 tracking-[0.4em]">Administrator MasjidKu Smart Indonesia</p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
