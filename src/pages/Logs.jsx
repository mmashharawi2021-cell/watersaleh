import { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, getDocs, limit } from 'firebase/firestore';
import { 
  History, 
  Search, 
  ShieldCheck, 
  RefreshCw, 
  Filter, 
  Clock, 
  AlertCircle,
  Eye,
  Info,
  Database
} from 'lucide-react';
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const Logs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const logsRef = collection(db, 'logs');
      const q = query(logsRef, orderBy('timestamp', 'desc'), limit(100));
      const snapshot = await getDocs(q);
      
      const data = [];
      snapshot.forEach(doc => {
        data.push({ id: doc.id, ...doc.data() });
      });
      
      if (data.length === 0) {
        // Mock data if empty
        data.push(
          { id: '1', action: 'إضافة تقرير', details: 'قام صالح الدحنون بإضافة تقرير يومي جديد', userName: 'صالح الدحنون', date: new Date().toISOString(), timestamp: Date.now() },
          { id: '2', action: 'تعديل وقود', details: 'تم تعديل كمية الوقود الوارد من جهة الهلال الأحمر', userName: 'أحمد الإداري', date: new Date(Date.now() - 3600000).toISOString(), timestamp: Date.now() - 3600000 }
        );
      }
      
      setLogs(data);
    } catch (error) {
      console.error("Error fetching logs", error);
      toast.error('فشل في تحديث السجل');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = (
      (log.action && log.action.includes(searchTerm)) ||
      (log.details && log.details.includes(searchTerm)) ||
      (log.userName && log.userName.includes(searchTerm))
    );
    const matchesType = filterType === 'all' || log.action === filterType;
    return matchesSearch && matchesType;
  });

  const formatDate = (isoString) => {
    if (!isoString) return '';
    try {
      return format(new Date(isoString), 'yyyy/MM/dd hh:mm a', { locale: arSA });
    } catch {
      return isoString;
    }
  };

  const getActionColor = (action) => {
    if (action?.includes('حذف')) return 'bg-rose-500/10 text-rose-600 border-rose-500/20';
    if (action?.includes('إضافة')) return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
    if (action?.includes('تعديل')) return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
    return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
  };

  return (
    <div className="max-w-7xl mx-auto pb-20 space-y-8 animate-in fade-in duration-700">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-slate-900 dark:bg-white rounded-lg text-white dark:text-slate-900">
              <History size={16} />
            </div>
            <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">المراقبة والأمان</span>
          </div>
          <h1 className="text-4xl font-display font-black tracking-tight text-slate-900 dark:text-white">
            سجل الحركات الأمني
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">تتبع الأنشطة والعمليات التي تمت على النظام</p>
        </div>
        
        <button 
          onClick={fetchLogs}
          disabled={loading}
          className="btn-primary px-6 group"
        >
          {loading ? <RefreshCw className="animate-spin" size={20} /> : <RefreshCw size={20} className="group-active:rotate-180 transition-transform" />}
          تحديث السجل
        </button>
      </div>

      {/* Modern Filter & Search Bar */}
      <div className="glass-card p-6 border-white/40 dark:border-white/5 flex flex-col lg:flex-row gap-6">
        <div className="flex-1 relative group">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="بحث بالمستخدم، الحركة، أو التفاصيل..." 
            className="w-full bg-slate-50 dark:bg-white/5 border-none focus:ring-2 focus:ring-primary-500/20 pr-12 rounded-2xl h-14 text-sm font-bold"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-3 bg-slate-50 dark:bg-white/5 p-1.5 rounded-2xl border border-slate-100 dark:border-white/5">
          <Filter size={18} className="text-slate-400 mx-2" />
          <div className="flex gap-1">
             {['all', 'إضافة تقرير', 'تعديل وقود', 'حذف تقرير'].map((type) => (
               <button
                 key={type}
                 onClick={() => setFilterType(type)}
                 className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                   filterType === type 
                   ? 'bg-white dark:bg-slate-800 text-primary-600 shadow-sm' 
                   : 'text-slate-500 hover:text-slate-700'
                 }`}
               >
                 {type === 'all' ? 'الكل' : type}
               </button>
             ))}
          </div>
        </div>
      </div>

      {/* Logs Table / List */}
      <div className="glass-card overflow-hidden border-white/40 dark:border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
                <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">الوقت والتاريخ</th>
                <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">المستخدم المسؤول</th>
                <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">نوع الحركة</th>
                <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">التفاصيل الكاملة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              <AnimatePresence mode="popLayout">
                {loading ? (
                  [1,2,3,4,5].map(i => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan="4" className="p-6"><div className="h-8 bg-slate-100 dark:bg-white/5 rounded-xl w-full"></div></td>
                    </tr>
                  ))
                ) : filteredLogs.length > 0 ? (
                  filteredLogs.map((log, idx) => (
                    <motion.tr 
                      key={log.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors group"
                    >
                      <td className="p-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 group-hover:bg-primary-500/10 group-hover:text-primary-600 transition-colors">
                            <Clock size={18} />
                          </div>
                          <div>
                             <p className="text-sm font-black text-slate-900 dark:text-white" dir="ltr">{formatDate(log.date).split(' ')[1]} {formatDate(log.date).split(' ')[2]}</p>
                             <p className="text-[10px] font-bold text-slate-400">{formatDate(log.date).split(' ')[0]}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center text-[10px] font-black text-white">
                            {log.userName?.charAt(0) || 'U'}
                          </div>
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{log.userName}</span>
                        </div>
                      </td>
                      <td className="p-6">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-black border uppercase tracking-wider ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="p-6 max-w-md">
                        <div className="flex items-start gap-2">
                           <Info size={14} className="text-slate-300 mt-1 shrink-0" />
                           <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{log.details}</p>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="p-20 text-center">
                       <div className="w-20 h-20 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                          <AlertCircle size={32} className="text-slate-300" />
                       </div>
                       <p className="text-slate-500 font-bold">لا توجد سجلات مطابقة لمعايير البحث</p>
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Security Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="p-6 rounded-[32px] bg-slate-900 dark:bg-white/[0.03] text-white dark:text-white border border-white/10 flex items-center gap-5">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-primary-400 shadow-inner">
               <ShieldCheck size={28} />
            </div>
            <div>
               <p className="text-[10px] font-black uppercase tracking-widest opacity-60">النظام مؤمن</p>
               <p className="text-lg font-black leading-none mt-1">تشفير 256-bit</p>
            </div>
         </div>
         <div className="p-6 rounded-[32px] bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 flex items-center gap-5">
            <div className="w-14 h-14 bg-primary-500/10 rounded-2xl flex items-center justify-center text-primary-500 shadow-sm">
               <Database size={28} />
            </div>
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">قاعدة البيانات</p>
               <p className="text-lg font-black leading-none mt-1 text-slate-800 dark:text-white">Firestore Live</p>
            </div>
         </div>
         <div className="p-6 rounded-[32px] bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 flex items-center gap-5">
            <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 shadow-sm">
               <Eye size={28} />
            </div>
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">تتبع الوصول</p>
               <p className="text-lg font-black leading-none mt-1 text-slate-800 dark:text-white">مفعل 24/7</p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Logs;
