import React from 'react';
import { Droplets } from 'lucide-react';

const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0f172a]">
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary-500/10 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] animate-pulse delay-700" />
      
      <div className="relative flex flex-col items-center">
        {/* Animated Icon */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-primary-500/20 rounded-full blur-2xl animate-ping" />
          <div className="relative bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-2xl border border-white/50 dark:border-slate-700/50">
            <Droplets size={48} className="text-primary-600 dark:text-primary-400 animate-bounce" />
          </div>
        </div>

        {/* Loading Text */}
        <div className="text-center space-y-3">
          <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
            نظام تقارير المياه
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium animate-pulse">
            جاري تحضير البيانات...
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mt-8 w-48 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary-500 to-blue-500 rounded-full animate-progress-loading" />
        </div>
      </div>
      
      <style>{`
        @keyframes progress-loading {
          0% { width: 0%; transform: translateX(-100%); }
          50% { width: 50%; transform: translateX(0%); }
          100% { width: 100%; transform: translateX(100%); }
        }
        .animate-progress-loading {
          animation: progress-loading 2s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
