import React from 'react';
import { X, AlertTriangle, Info, CheckCircle, Trash2, ShieldAlert, Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ConfirmDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  type = 'warning', // warning, danger, info, success
  confirmText = 'تأكيد',
  cancelText = 'إلغاء' 
}) => {
  const getIcon = () => {
    switch (type) {
      case 'danger': return <Trash2 className="text-rose-500" size={32} />;
      case 'warning': return <AlertTriangle className="text-amber-500" size={32} />;
      case 'success': return <CheckCircle className="text-emerald-500" size={32} />;
      default: return <Info className="text-primary-500" size={32} />;
    }
  };

  const getThemeStyles = () => {
    switch (type) {
      case 'danger': return 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20';
      case 'warning': return 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20';
      case 'success': return 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20';
      default: return 'bg-slate-900 dark:bg-primary-600 hover:bg-slate-800 dark:hover:bg-primary-700 shadow-slate-900/20';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          {/* High-fidelity Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" 
            onClick={onClose}
          ></motion.div>

          {/* Premium Dialog Card */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[48px] shadow-[0_32px_64px_rgba(0,0,0,0.4)] overflow-hidden border border-white/20 dark:border-white/5"
          >
            {/* Visual Header Decor */}
            <div className={`h-2 w-full ${
              type === 'danger' ? 'bg-rose-500' : 
              type === 'warning' ? 'bg-amber-500' : 
              type === 'success' ? 'bg-emerald-500' : 'bg-primary-500'
            }`}></div>

            <div className="p-12 text-center">
              <div className="mx-auto w-24 h-24 bg-slate-50 dark:bg-white/[0.03] rounded-[32px] flex items-center justify-center mb-8 shadow-inner relative group">
                <div className="absolute inset-0 bg-current opacity-10 rounded-[32px] group-hover:scale-110 transition-transform"></div>
                {getIcon()}
                <motion.div 
                   animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                   transition={{ duration: 4, repeat: Infinity }}
                   className="absolute -top-2 -right-2 w-8 h-8 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-lg border border-slate-100 dark:border-white/5"
                >
                   <ShieldAlert size={14} className="text-slate-400" />
                </motion.div>
              </div>
              
              <h3 className="text-3xl font-display font-black text-slate-900 dark:text-white mb-4 tracking-tight leading-tight">
                {title}
              </h3>
              
              <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-sm mx-auto">
                {message}
              </p>
            </div>

            <div className="p-10 bg-slate-50/50 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/5 flex gap-6">
              <button
                onClick={onClose}
                className="flex-1 h-16 px-8 bg-white dark:bg-white/5 text-slate-500 dark:text-slate-400 font-black rounded-3xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-all active:scale-95 text-lg uppercase tracking-tight"
              >
                {cancelText}
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`flex-1 h-16 px-8 ${getThemeStyles()} text-white font-black rounded-3xl shadow-2xl transition-all hover:scale-[1.03] active:scale-95 text-lg uppercase tracking-tight flex items-center justify-center gap-2 group`}
              >
                <span>{confirmText}</span>
                <Sparkles size={20} className="group-hover:rotate-12 transition-transform" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmDialog;
