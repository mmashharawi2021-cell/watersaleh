import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, getDocs, doc, deleteDoc, orderBy } from 'firebase/firestore';
import { 
  FileText, Calendar, Search, AlertCircle, Eye, 
  MessageCircle, X, Trash2, Edit, Printer, Plus, 
  ArrowRight, FileDown, Zap, Beaker, Activity,
  ShieldCheck, Clock, Droplet, LayoutGrid, List, Sparkles,
  RefreshCw, MapPin, ChevronLeft, Fuel, Users
} from 'lucide-react';
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { logAction } from '../utils/logger';
import ConfirmDialog from '../components/ConfirmDialog';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingScreen from '../components/LoadingScreen';

import { generateWhatsAppMessage, exportToExcel } from '../utils/exportUtils';
import { printWaterReport } from '../utils/printUtils';

const Archive = () => {
  const { userData } = useAuth();
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, reportId: null });
  const [viewMode, setViewMode] = useState('grid');
  const [filterStation, setFilterStation] = useState('all');
  const [stations, setStations] = useState([]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      
      // Fetch stations
      const stationsSnap = await getDocs(query(collection(db, 'stations'), orderBy('name')));
      setStations(stationsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const reportsRef = collection(db, 'reports');
      const snapshot = await getDocs(query(reportsRef));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
      setReports(data);
    } catch (error) {
      console.error(error);
      toast.error('فشل في تحميل الأرشيف');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const report = reports.find(r => r.id === id);
      await deleteDoc(doc(db, 'reports', id));
      await logAction('حذف تقرير', `حذف تقرير بتاريخ ${report?.date}`, userData);
      setReports(reports.filter(r => r.id !== id));
      toast.success('تم الحذف بنجاح');
      setConfirmDelete({ isOpen: false, reportId: null });
      if (selectedReport?.id === id) setSelectedReport(null);
    } catch {
      toast.error('خطأ في الحذف');
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const filteredReports = reports.filter(r => {
    const searchStr = `${r.date} ${r.station} ${r.operatorName} ${r.notes}`.toLowerCase();
    const matchesSearch = searchStr.includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' 
      ? true 
      : filterStatus === 'alerts' 
        ? (r.alerts && r.alerts.length > 0) || r.status === 'تنبيهات'
        : r.status === filterStatus;
    let matchesDate = true;
    if (dateFrom && new Date(r.date) < new Date(dateFrom)) matchesDate = false;
    if (dateTo && new Date(r.date) > new Date(dateTo)) matchesDate = false;
    const matchesStation = filterStation === 'all' || r.station === filterStation;
    return matchesSearch && matchesStatus && matchesDate && matchesStation;
  });

  if (loading) return <LoadingScreen />;

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20 animate-in fade-in duration-700">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="relative">
           <div className="flex items-center gap-2 mb-3">
              <div className="px-3 py-1 bg-primary-600/10 dark:bg-primary-400/10 text-primary-600 dark:text-primary-400 rounded-full border border-primary-600/20 flex items-center gap-2">
                 <Sparkles size={14} className="animate-pulse" />
                 <span className="text-[10px] font-black uppercase tracking-widest">المستودع الرقمي</span>
              </div>
           </div>
           <h1 className="text-4xl md:text-5xl font-display font-black tracking-tight text-slate-900 dark:text-white">
             أرشيف التقارير <span className="text-primary-600 dark:text-primary-400">اليومية</span>
           </h1>
           <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium max-w-xl">الوصول الكامل إلى سجلات التشغيل، الفحوصات الفنية، وتوثيق التوزيع التاريخي للمحطة.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
           <button 
             onClick={() => exportToExcel(filteredReports)}
             className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-black text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/10 transition-all shadow-sm active:scale-95"
           >
             <FileDown size={20} className="text-emerald-500" /> تصدير Excel
           </button>
           <button 
             onClick={() => navigate('/add-report')} 
             className="flex items-center gap-3 px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black shadow-2xl transition-all hover:scale-[1.03] active:scale-95"
           >
             <Plus size={22} /> إضافة تقرير جديد
           </button>
        </div>
      </div>

      {/* Control Bar (Search & Filter) */}
      <div className="glass-card p-6 border-white/40 dark:border-white/5 shadow-2xl shadow-slate-200/50 dark:shadow-none flex flex-col xl:flex-row gap-6 items-center">
         <div className="flex-1 w-full relative group">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="ابحث في السجلات (تاريخ، مشغل، محطة)..." 
              className="w-full h-14 bg-slate-50 dark:bg-white/5 border-none focus:ring-2 focus:ring-primary-500/20 pr-12 rounded-[22px] text-sm font-bold placeholder:text-slate-400 dark:placeholder:text-slate-600"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
         </div>

         <div className="flex flex-wrap items-center gap-6 w-full xl:w-auto">
            <div className="flex items-center bg-slate-50 dark:bg-white/5 p-1.5 rounded-[22px] border border-slate-100 dark:border-white/10">
               <button onClick={() => setFilterStatus('all')} className={`px-6 py-2.5 rounded-[18px] text-[11px] font-black transition-all ${filterStatus === 'all' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xl shadow-slate-200/50' : 'text-slate-400 hover:text-slate-600'}`}>الكل</button>
               <button onClick={() => setFilterStatus('سليم')} className={`px-6 py-2.5 rounded-[18px] text-[11px] font-black transition-all ${filterStatus === 'سليم' ? 'bg-white dark:bg-slate-800 text-emerald-600 shadow-xl shadow-slate-200/50' : 'text-slate-400 hover:text-slate-600'}`}>سليم</button>
               <button onClick={() => setFilterStatus('alerts')} className={`px-6 py-2.5 rounded-[18px] text-[11px] font-black transition-all ${filterStatus === 'alerts' ? 'bg-white dark:bg-slate-800 text-rose-600 shadow-xl shadow-slate-200/50' : 'text-slate-400 hover:text-slate-600'}`}>تنبيهات</button>
            </div>

            <select 
              value={filterStation} 
              onChange={e => setFilterStation(e.target.value)}
              className="bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 px-6 py-2.5 rounded-[22px] text-[11px] font-black text-slate-600 dark:text-slate-400 outline-none focus:ring-2 focus:ring-primary-500/20 cursor-pointer"
            >
              <option value="all">جميع المحطات</option>
              {stations.map(s => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>

            <div className="flex items-center gap-3 bg-slate-50 dark:bg-white/5 px-4 py-2 rounded-[22px] border border-slate-100 dark:border-white/10">
               <Calendar size={18} className="text-slate-400" />
               <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="bg-transparent border-none focus:ring-0 text-[11px] font-bold p-0 text-slate-600 dark:text-slate-400" />
               <ArrowRight size={12} className="text-slate-300 mx-1" />
               <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="bg-transparent border-none focus:ring-0 text-[11px] font-bold p-0 text-slate-600 dark:text-slate-400" />
            </div>

            <div className="hidden sm:flex items-center gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-2xl">
               <button onClick={() => setViewMode('grid')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-800 text-primary-500 shadow-sm' : 'text-slate-400'}`}><LayoutGrid size={18} /></button>
               <button onClick={() => setViewMode('list')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-800 text-primary-500 shadow-sm' : 'text-slate-400'}`}><List size={18} /></button>
            </div>
         </div>
      </div>

      {/* Reports Content */}
      <AnimatePresence mode="popLayout">
        {filteredReports.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredReports.map((report, idx) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                  key={report.id} 
                  className="glass-card group hover:-translate-y-2 transition-all duration-500 border-white/40 dark:border-white/5 relative flex flex-col h-full shadow-lg hover:shadow-2xl hover:shadow-primary-500/10"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 blur-3xl -mr-16 -mt-16 group-hover:bg-primary-500/10 transition-colors"></div>
                  
                  <div className="p-8 flex-1 cursor-pointer" onClick={() => setSelectedReport(report)}>
                    <div className="flex justify-between items-start mb-8">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-slate-900 dark:bg-white/[0.05] flex flex-col items-center justify-center text-white group-hover:bg-primary-600 transition-all duration-500 shadow-lg">
                          <span className="text-[10px] font-black uppercase tracking-tighter opacity-50">{format(new Date(report.date || 0), 'MMM', { locale: arSA })}</span>
                          <span className="text-xl font-black leading-none mt-1">{format(new Date(report.date || 0), 'dd')}</span>
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-primary-600 transition-colors leading-tight">{report.station || 'المحطة الرئيسية'}</h3>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mt-1">{report.operatorName || 'مشغل معتمد'}</p>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${report.alerts?.length > 0 ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'}`}>
                         {report.alerts?.length > 0 ? 'تنبيهات' : 'سليم'}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-y-6 gap-x-8">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">إنتاج اليوم</p>
                        <p className="text-xl font-display font-black text-slate-900 dark:text-white">{Number(report.dailyProduction || 0).toLocaleString()} <span className="text-xs font-bold opacity-30">كوب</span></p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ساعات العمل</p>
                        <p className="text-xl font-display font-black text-slate-900 dark:text-white">{report.operatingHours || 0} <span className="text-xs font-bold opacity-30">HR</span></p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">المياه المعبأة</p>
                        <p className="text-xl font-display font-black text-slate-900 dark:text-white">{Number(report.bottledWater || 0).toLocaleString()} <span className="text-xs font-bold opacity-30">كوب</span></p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">الوقود المستهلك</p>
                        <p className="text-xl font-display font-black text-slate-900 dark:text-white">{report.fuelConsumed || 0} <span className="text-xs font-bold opacity-30">L</span></p>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 bg-slate-50/50 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/5 flex justify-between items-center mt-auto">
                    <div className="flex items-center gap-1">
                      <button onClick={(e) => { e.stopPropagation(); navigate(`/edit-report/${report.id}`); }} className="p-2.5 text-slate-400 hover:text-primary-600 hover:bg-primary-500/10 rounded-xl transition-all" title="تعديل"><Edit size={18} /></button>
                      <button onClick={(e) => { e.stopPropagation(); setConfirmDelete({ isOpen: true, reportId: report.id }); }} className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 rounded-xl transition-all" title="حذف"><Trash2 size={18} /></button>
                      <button onClick={(e) => { e.stopPropagation(); window.open(`https://wa.me/?text=${generateWhatsAppMessage(report)}`, '_blank'); }} className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-500/10 rounded-xl transition-all" title="واتساب"><MessageCircle size={18} /></button>
                    </div>
                    <button onClick={() => setSelectedReport(report)} className="flex items-center gap-2 px-5 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[14px] text-[11px] font-black transition-all hover:scale-105 active:scale-95 shadow-lg">
                      عرض التفاصيل <ChevronLeft size={16} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="glass-card overflow-hidden border-white/40 dark:border-white/5 shadow-xl">
               <table className="w-full text-right border-collapse">
                  <thead className="bg-slate-50 dark:bg-white/[0.03] border-b border-slate-100 dark:border-white/10">
                     <tr>
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">التاريخ</th>
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">المحطة / المشغل</th>
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">الإنتاج (كوب)</th>
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">التشغيل</th>
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">الحالة</th>
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">الإجراءات</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                     {filteredReports.map((r, i) => (
                        <motion.tr key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors group">
                           <td className="p-6 font-black text-slate-900 dark:text-white">{r.date}</td>
                           <td className="p-6">
                              <p className="font-bold text-slate-900 dark:text-white">{r.station}</p>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{r.operatorName}</p>
                           </td>
                           <td className="p-6 text-center font-display font-black text-primary-600">{r.dailyProduction}</td>
                           <td className="p-6 text-center font-bold text-slate-500">{r.operatingHours} HR</td>
                           <td className="p-6 text-center">
                              <span className={`inline-block w-2 h-2 rounded-full ${r.alerts?.length > 0 ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]'}`}></span>
                           </td>
                           <td className="p-6">
                              <div className="flex items-center justify-center gap-2">
                                 <button onClick={() => setSelectedReport(r)} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"><Eye size={18} /></button>
                                 <button onClick={() => navigate(`/edit-report/${r.id}`)} className="p-2 text-slate-400 hover:text-primary-500 transition-all"><Edit size={18} /></button>
                                 <button onClick={() => setConfirmDelete({ isOpen: true, reportId: r.id })} className="p-2 text-slate-400 hover:text-rose-500 transition-all"><Trash2 size={18} /></button>
                              </div>
                           </td>
                        </motion.tr>
                     ))}
                  </tbody>
               </table>
            </div>
          )
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-24 flex flex-col items-center justify-center text-center border-white/40 dark:border-white/5">
            <div className="w-24 h-24 bg-slate-100 dark:bg-white/5 rounded-[40px] flex items-center justify-center mb-8 relative">
               <FileText size={48} className="text-slate-300 dark:text-slate-700" />
               <div className="absolute -right-2 -bottom-2 w-10 h-10 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-lg border border-slate-100 dark:border-white/5">
                  <X size={20} className="text-rose-500" />
               </div>
            </div>
            <h3 className="text-2xl font-display font-black text-slate-900 dark:text-white">لم نجد أي سجلات مطابقة</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2 font-bold text-sm">حاول تغيير معايير البحث أو الفترة الزمنية المختارة.</p>
            <button onClick={() => {setSearchTerm(''); setFilterStatus('all'); setDateFrom(''); setDateTo('');}} className="mt-8 px-8 py-3 bg-slate-100 dark:bg-white/5 rounded-2xl text-xs font-black text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition-all flex items-center gap-2">
               <RefreshCw size={16} /> إعادة تعيين الفلاتر
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modern Detailed View Modal */}
      <AnimatePresence>
        {selectedReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-10 overflow-hidden">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl" onClick={() => setSelectedReport(null)} />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 40 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-[#0b1120] rounded-[48px] shadow-[0_0_100px_rgba(0,0,0,0.5)] w-full max-w-5xl overflow-hidden relative z-10 border border-white/20 dark:border-white/10 flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-10 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50/50 dark:bg-white/[0.03] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600 blur-[100px] opacity-[0.07] -mr-32 -mt-32"></div>
                <div className="flex items-center gap-6 relative z-10">
                  <div className="w-16 h-16 rounded-[24px] bg-primary-600 text-white flex flex-col items-center justify-center shadow-2xl shadow-primary-600/30">
                    <span className="text-[10px] font-black uppercase leading-none opacity-60">{format(new Date(selectedReport.date || 0), 'MMM', { locale: arSA })}</span>
                    <span className="text-2xl font-black mt-1 leading-none">{format(new Date(selectedReport.date || 0), 'dd')}</span>
                  </div>
                  <div>
                    <h2 className="text-3xl font-display font-black text-slate-900 dark:text-white leading-tight">{selectedReport.station || 'المحطة الرئيسية'}</h2>
                    <div className="flex items-center gap-4 mt-2">
                       <p className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-widest"><MapPin size={14} className="text-primary-500" /> {selectedReport.date}</p>
                       <span className="text-slate-200 dark:text-white/10">|</span>
                       <p className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-widest"><Users size={14} className="text-primary-500" /> {selectedReport.operatorName}</p>
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedReport(null)} className="p-4 text-slate-400 hover:text-rose-500 bg-white dark:bg-white/5 rounded-2xl transition-all shadow-sm active:scale-95"><X size={28} /></button>
              </div>
              
              <div className="p-10 overflow-y-auto space-y-12 flex-1 custom-scrollbar">
                {/* Visual KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {[
                    { label: 'الإنتاج الكلي', value: selectedReport.dailyProduction, unit: 'كوب', color: 'text-primary-600', icon: <Droplet size={18} /> },
                    { label: 'ساعات التشغيل', value: selectedReport.operatingHours, unit: 'ساعة', color: 'text-amber-600', icon: <Clock size={18} /> },
                    { label: 'استهلاك الوقود', value: selectedReport.fuelConsumed, unit: 'لتر', color: 'text-purple-600', icon: <Fuel size={18} /> },
                    { label: 'المياه المعبأة', value: selectedReport.bottledWater, unit: 'كوب', color: 'text-emerald-600', icon: <Activity size={18} /> },
                  ].map((stat, i) => (
                    <div key={i} className="p-6 rounded-[32px] bg-slate-50 dark:bg-white/[0.04] border border-slate-100 dark:border-white/5 relative overflow-hidden group">
                      <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-125 transition-transform duration-700">{stat.icon}</div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">{stat.icon} {stat.label}</p>
                      <p className={`text-3xl font-display font-black ${stat.color}`}>{Number(stat.value || 0).toLocaleString()} <span className="text-xs font-bold opacity-30">{stat.unit}</span></p>
                    </div>
                  ))}
                </div>

                {/* Technical & Quality Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-3">
                       <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500"><Zap size={16} /></div>
                       مواصفات التشغيل الفنية
                    </h3>
                    <div className="p-8 bg-slate-50 dark:bg-white/[0.03] rounded-[32px] border border-slate-100 dark:border-white/5 space-y-6">
                       <div className="flex justify-between items-center py-2 border-b border-slate-200/50 dark:border-white/5">
                          <span className="text-sm font-bold text-slate-500">الحالة التشغيلية</span>
                          <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase ${selectedReport.generatorStatus === 'يعمل' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>{selectedReport.generatorStatus || 'يعمل'}</span>
                       </div>
                       <div className="flex justify-between items-center py-2 border-b border-slate-200/50 dark:border-white/5"><span className="text-sm font-bold text-slate-500">وقت البدء</span> <span className="text-sm font-black" dir="ltr">{selectedReport.startTime || '--:--'}</span></div>
                       <div className="flex justify-between items-center py-2 border-b border-slate-200/50 dark:border-white/5"><span className="text-sm font-bold text-slate-500">وقت الإغلاق</span> <span className="text-sm font-black" dir="ltr">{selectedReport.endTime || '--:--'}</span></div>
                       <div className="flex justify-between items-center py-2"><span className="text-sm font-bold text-slate-500">نسبة الفاقد</span> <span className={`text-sm font-black ${selectedReport.wastePercentage > 40 ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}>{Number(selectedReport.wastePercentage || 0).toFixed(1)}%</span></div>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-3">
                       <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500"><Beaker size={16} /></div>
                       تقارير جودة المياه (Lab)
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                       {[
                         { label: 'TDS المنتج', value: selectedReport.tdsDesalinated, unit: 'ppm', color: 'text-primary-600' },
                         { label: 'PH المعالجة', value: selectedReport.phAfterDesalination, unit: 'pH', color: 'text-emerald-600' },
                         { label: 'TDS البئر', value: selectedReport.tdsWell, unit: 'ppm', color: 'text-slate-600' },
                         { label: 'الكلور الحر', value: selectedReport.freeChlorine, unit: 'mg/L', color: 'text-sky-600' },
                       ].map((lab, idx) => (
                         <div key={idx} className="p-6 bg-blue-500/5 dark:bg-white/[0.03] rounded-3xl border border-blue-500/10 flex flex-col justify-center">
                            <p className="text-[10px] font-black text-blue-500/60 uppercase mb-2">{lab.label}</p>
                            <p className={`text-xl font-black ${lab.color}`}>{lab.value || '-'} <span className="text-[10px] opacity-40">{lab.unit}</span></p>
                         </div>
                       ))}
                    </div>
                  </div>
                </div>

                {/* Tabled Data for Entities */}
                {selectedReport.entities?.length > 0 && (
                  <div className="space-y-6">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-3">
                       <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500"><Users size={16} /></div>
                       سجل التوزيع والجهات المستفيدة
                    </h3>
                    <div className="overflow-hidden rounded-[32px] border border-slate-100 dark:border-white/5 shadow-sm">
                      <table className="w-full text-right text-sm">
                        <thead className="bg-slate-50 dark:bg-white/[0.05]">
                          <tr>
                            <th className="p-6 text-[11px] font-black uppercase text-slate-500">الجهة المستلمة</th>
                            <th className="p-6 text-[11px] font-black uppercase text-slate-500 text-center">الكمية (كوب)</th>
                            <th className="p-6 text-[11px] font-black uppercase text-slate-500 text-center">عدد السيارات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                          {selectedReport.entities.map((e, i) => (
                            <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01]">
                              <td className="p-6 font-bold text-slate-900 dark:text-white">{e.name}</td>
                              <td className="p-6 text-center font-black text-primary-600">{e.quantity}</td>
                              <td className="p-6 text-center font-black text-slate-700 dark:text-slate-300">{e.cars}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Footer Notes & Security */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
                  <div className="p-8 bg-slate-900 text-white rounded-[40px] relative overflow-hidden shadow-2xl">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600 blur-3xl opacity-20 -mr-16 -mt-16"></div>
                     <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                        <ShieldCheck size={18} className="text-primary-400" /> الحالة الأمنية للتقرير
                     </h3>
                     <div className="space-y-4">
                        <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
                           <div className={`w-3 h-3 rounded-full ${selectedReport.alerts?.length > 0 ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`}></div>
                           التدقيق البرمجي: {selectedReport.alerts?.length > 0 ? 'يتطلب مراجعة إدارية' : 'تم التدقيق - البيانات متناسقة'}
                        </div>
                        {selectedReport.alerts?.map((a, i) => (
                           <div key={i} className="text-[10px] font-black text-rose-400 uppercase bg-rose-500/10 px-4 py-2 rounded-xl border border-rose-500/20">{a}</div>
                        ))}
                     </div>
                  </div>
                  <div className="p-8 bg-slate-50 dark:bg-white/[0.03] rounded-[40px] border border-slate-100 dark:border-white/5">
                     <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">ملاحظات إضافية</h3>
                     <p className="text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{selectedReport.notes || 'لا توجد ملاحظات إضافية لهذا اليوم.'}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-10 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.03] flex flex-wrap justify-between items-center gap-6">
                <button onClick={() => setConfirmDelete({ isOpen: true, reportId: selectedReport.id })} className="flex items-center gap-2 text-rose-500 font-black text-xs hover:bg-rose-500/10 px-6 py-3 rounded-2xl transition-all">
                   <Trash2 size={20} /> حذف هذا السجل
                </button>
                <div className="flex flex-wrap gap-4">
                  <button onClick={() => navigate(`/edit-report/${selectedReport.id}`)} className="px-8 py-3 bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-black text-slate-900 dark:text-white transition-all hover:bg-slate-50 active:scale-95 shadow-sm">تعديل البيانات</button>
                  <button onClick={() => window.open(`https://wa.me/?text=${generateWhatsAppMessage(selectedReport)}`, '_blank')} className="px-8 py-3 bg-emerald-600 text-white rounded-2xl text-sm font-black flex items-center gap-3 shadow-xl shadow-emerald-500/20 active:scale-95 transition-all"><MessageCircle size={20} /> واتساب</button>
                  <button onClick={() => printWaterReport(selectedReport)} className="px-10 py-3 bg-primary-600 text-white rounded-2xl text-sm font-black flex items-center gap-3 shadow-xl shadow-primary-600/30 active:scale-95 transition-all"><Printer size={20} /> طباعة التقرير الرسمي</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, reportId: null })}
        onConfirm={() => handleDelete(confirmDelete.reportId)}
        title="تأكيد حذف السجل"
        message="هل أنت متأكد من رغبتك في إزالة هذا التقرير نهائياً؟ هذا الإجراء غير قابل للتراجع وسيتم توثيقه في سجل الأمان."
        type="danger"
        confirmText="نعم، احذف السجل"
        cancelText="تراجع"
      />
    </div>
  );
};

export default Archive;
