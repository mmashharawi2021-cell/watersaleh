import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { 
  Fuel, Search, Trash2, Edit, Printer, Plus, 
  Clock, Package, Sparkles, MapPin
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { printFuelReceipt } from '../utils/printUtils';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { logAction } from '../utils/logger';
import ConfirmDialog from '../components/ConfirmDialog';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';

const FuelArchive = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, entry: null });
  const { userData } = useAuth();
  const navigate = useNavigate();

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const fuelRef = collection(db, 'fuelEntries');
      const q = query(fuelRef, orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => {
        if (a.date === b.date && a.time && b.time) return b.time.localeCompare(a.time);
        return 0;
      });
      setEntries(data);
    } catch (error) {
      console.error(error);
      toast.error('فشل في تحميل السجل');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const handleDelete = async (entry) => {
    try {
      await deleteDoc(doc(db, 'fuelEntries', entry.id));
      await logAction('حذف وقود', `حذف سجل وقود بقيمة ${entry.quantityLiters} لتر من جهة ${entry.supplier}`, userData);
      toast.success('تم الحذف بنجاح');
      setConfirmDelete({ isOpen: false, entry: null });
      fetchEntries();
    } catch (error) {
      toast.error('خطأ في الحذف');
    }
  };

  const filteredEntries = entries.filter(e => 
    e.supplier?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.date?.includes(searchTerm)
  );

  const totalFuelReceived = filteredEntries.reduce((sum, e) => sum + Number(e.quantityLiters || 0), 0);

  return (
    <div className="max-w-7xl mx-auto pb-20 space-y-10 animate-in fade-in duration-700">
      
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="relative">
           <div className="flex items-center gap-2 mb-3">
              <div className="px-3 py-1 bg-amber-500/10 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400 rounded-full border border-amber-600/20 flex items-center gap-2">
                 <Sparkles size={14} className="animate-pulse" />
                 <span className="text-[10px] font-black uppercase tracking-widest">إدارة الطاقة والمخزون</span>
              </div>
           </div>
           <h1 className="text-4xl md:text-5xl font-display font-black tracking-tight text-slate-900 dark:text-white">
             سجل التوريدات <span className="text-amber-600 dark:text-amber-500">النفطية</span>
           </h1>
           <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium max-w-xl">الأرشيف التاريخي لتوريدات الديزل، كميات الاستلام، وبيانات الجهات الموردة للمحطة.</p>
        </div>
        
        <div className="flex items-center gap-4">
           <Link 
             to="/add-fuel" 
             className="flex items-center gap-3 px-8 py-4 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl font-black shadow-2xl shadow-amber-600/20 transition-all hover:scale-[1.03] active:scale-95 group"
           >
             <Plus size={22} className="group-hover:rotate-90 transition-transform duration-300" /> تسجيل توريد جديد
           </Link>
        </div>
      </div>

      {/* Stats Quick Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="p-8 bg-slate-900 text-white rounded-[40px] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500 blur-[80px] opacity-20 -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">إجمالي التوريد (الفترة الحالية)</p>
            <div className="flex items-baseline gap-2">
               <h3 className="text-5xl font-display font-black text-amber-500">{totalFuelReceived.toLocaleString()}</h3>
               <span className="text-lg font-bold opacity-30">لتر</span>
            </div>
         </div>
         <div className="p-8 glass-card border-white/40 dark:border-white/5 flex flex-col justify-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">متوسط التوريد الشهري</p>
            <p className="text-2xl font-black">{(totalFuelReceived / Math.max(1, entries.length)).toFixed(0)} <span className="text-xs font-bold opacity-30">L/Entry</span></p>
         </div>
         <div className="p-8 glass-card border-white/40 dark:border-white/5 flex flex-col justify-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">آخر توريد مسجل</p>
            <p className="text-2xl font-black text-emerald-600">{entries[0]?.date || '---'}</p>
         </div>
      </div>

      {/* Search Bar */}
      <div className="glass-card p-6 border-white/40 dark:border-white/5 shadow-2xl shadow-slate-200/50 dark:shadow-none">
         <div className="relative group">
            <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors" size={24} />
            <input 
              type="text" 
              placeholder="ابحث بالجهة الموردة، رقم الإيصال، أو التاريخ (YYYY-MM-DD)..." 
              className="w-full h-16 bg-slate-50 dark:bg-white/5 border-none focus:ring-2 focus:ring-amber-500/20 pr-14 rounded-[28px] text-base font-bold placeholder:text-slate-400 dark:placeholder:text-slate-600"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
         </div>
      </div>

      {/* Entries Display */}
      {loading ? (
        <div className="space-y-6">
          {[1,2,3,4].map(i => <div key={i} className="h-32 glass-card animate-pulse border-white/40 dark:border-white/5 opacity-50"></div>)}
        </div>
      ) : filteredEntries.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredEntries.map((entry, idx) => (
              <motion.div 
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                key={entry.id} 
                className="glass-card group p-8 flex flex-col lg:flex-row items-center justify-between gap-8 border-white/40 dark:border-white/10 hover:shadow-2xl hover:shadow-amber-500/5 transition-all duration-500 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div className="flex items-center gap-8 w-full lg:w-auto">
                  <div className="w-20 h-20 rounded-[28px] bg-slate-900 dark:bg-white/[0.05] text-white flex flex-col items-center justify-center font-display font-black group-hover:bg-amber-600 transition-all duration-500 shadow-xl">
                    <span className="text-[10px] uppercase tracking-tighter opacity-40 leading-none mb-1">{format(new Date(entry.date || 0), 'MMM', { locale: arSA })}</span>
                    <span className="text-3xl leading-none">{format(new Date(entry.date || 0), 'dd')}</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                       <h3 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-amber-600 transition-colors leading-tight">{entry.supplier || 'المكتب الرئيسي / توريد عام'}</h3>
                       <div className="px-2 py-0.5 bg-slate-100 dark:bg-white/10 rounded-lg text-[9px] font-black uppercase text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/5">Receipt #{entry.id.slice(-6).toUpperCase()}</div>
                    </div>
                    <div className="flex flex-wrap items-center gap-6">
                       <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                          <Clock size={16} className="text-amber-500" /> <span dir="ltr">{entry.time || '--:--'}</span>
                       </div>
                       <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                          <Package size={16} className="text-amber-500" /> <span>{entry.fillingMethod || 'تعبئة صهريج'}</span>
                       </div>
                       {entry.deliveredBy && (
                         <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                            <MapPin size={16} className="text-amber-500" /> <span>المسؤول: {entry.deliveredBy}</span>
                         </div>
                       )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between w-full lg:w-auto gap-12 bg-slate-50 dark:bg-white/[0.03] p-6 rounded-[32px] border border-slate-100 dark:border-white/5 shadow-inner">
                  <div className="text-right px-6 border-r border-slate-200 dark:border-white/10">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">الكمية المسجلة</p>
                    <div className="flex items-baseline gap-2">
                       <p className="text-3xl font-display font-black text-amber-600 leading-none">
                         {Number(entry.quantityLiters || 0).toLocaleString()}
                       </p>
                       <span className="text-xs font-bold opacity-30 text-slate-500 uppercase tracking-widest">Liters</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => printFuelReceipt(entry)}
                      className="w-12 h-12 bg-white dark:bg-white/10 text-emerald-600 rounded-[18px] shadow-sm hover:scale-110 active:scale-95 transition-all flex items-center justify-center border border-slate-100 dark:border-white/5 hover:bg-emerald-500 hover:text-white"
                      title="طباعة إيصال الاستلام"
                    >
                      <Printer size={20} />
                    </button>
                    <button 
                      onClick={() => navigate(`/edit-fuel/${entry.id}`)}
                      className="w-12 h-12 bg-white dark:bg-white/10 text-primary-600 rounded-[18px] shadow-sm hover:scale-110 active:scale-95 transition-all flex items-center justify-center border border-slate-100 dark:border-white/5 hover:bg-primary-600 hover:text-white"
                      title="تعديل السجل"
                    >
                      <Edit size={20} />
                    </button>
                    <button 
                      onClick={() => setConfirmDelete({ isOpen: true, entry: entry })}
                      className="w-12 h-12 bg-white dark:bg-white/10 text-rose-600 rounded-[18px] shadow-sm hover:scale-110 active:scale-95 transition-all flex items-center justify-center border border-slate-100 dark:border-white/5 hover:bg-rose-600 hover:text-white"
                      title="حذف"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-32 flex flex-col items-center justify-center text-center border-white/40 dark:border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 blur-[120px] -mr-48 -mt-48 pointer-events-none"></div>
          <div className="w-28 h-28 bg-slate-50 dark:bg-white/5 rounded-[48px] flex items-center justify-center mb-8 shadow-inner">
            <Fuel size={56} className="text-slate-300 dark:text-slate-700 opacity-50" />
          </div>
          <h3 className="text-3xl font-display font-black text-slate-900 dark:text-white tracking-tight">أرشيف الوقود بانتظار بياناتك</h3>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-3 max-w-sm leading-relaxed">لم يتم العثور على أي توريدات مسجلة حالياً في النظام الرقمي. ابدأ بتوثيق أول توريد لضبط حسابات الطاقة.</p>
          <Link to="/add-fuel" className="mt-10 px-10 py-4 bg-amber-600 text-white rounded-[24px] font-black shadow-2xl shadow-amber-600/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
             <Plus size={24} /> تسجيل أول توريد ديزل
          </Link>
        </motion.div>
      )}

      <ConfirmDialog
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, entry: null })}
        onConfirm={() => handleDelete(confirmDelete.entry)}
        title="تأكيد حذف التوريد"
        message={`تحذير: أنت على وشك حذف سجل وقود بقيمة ${confirmDelete.entry?.quantityLiters} لتر. سيؤدي هذا إلى اختلاف في الأرصدة التراكمية المسجلة. هل أنت متأكد؟`}
        type="danger"
        confirmText="نعم، احذف نهائياً"
        cancelText="إلغاء الأمر"
      />
    </div>
  );
};

export default FuelArchive;
