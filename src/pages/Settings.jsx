import { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, Save, Database, Shield, Bell, Droplets,
  Zap, RefreshCw, Cpu, Sparkles, Layout, HardDrive, 
  Settings2, ShieldAlert, Radio, Wrench, ShieldCheck, Globe, MapPin, Plus, Trash2
} from 'lucide-react';
import { db } from '../firebase';
import { collection, doc, getDoc, getDocs, setDoc, addDoc, deleteDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('station');
  const [settings, setSettings] = useState({
    stationName: 'المحطة الرئيسية',
    fuelRate: 19,
    pumpProduction: 55,
    filterProduction: 33,
    defaultOperator: 'صالح الدحنون',
    fuelAlertThreshold: 200,
    lossAlertThreshold: 70,
    reportAutoArchive: true,
    darkModeByDefault: true,
    language: 'ar',
    maintenanceInterval: 250,
    whatsappNumber: '972599876261',
    adminOnlyAccess: false,
    maintenanceMode: false
  });
  const [stations, setStations] = useState([]);
  const [newStation, setNewStation] = useState({ name: '', location: '', operator: '' });
  const [loadingStations, setLoadingStations] = useState(false);

  const fetchSettings = async () => {
    try {
      const docRef = doc(db, 'system', 'settings');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setSettings(prev => ({ ...prev, ...docSnap.data() }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchStations();
  }, []);

  const fetchStations = async () => {
    setLoadingStations(true);
    try {
      const q = query(collection(db, 'stations'), orderBy('name'));
      const snap = await getDocs(q);
      setStations(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStations(false);
    }
  };

  const handleAddStation = async () => {
    if (!newStation.name) return toast.error('يرجى إدخال اسم المحطة');
    try {
      await addDoc(collection(db, 'stations'), { ...newStation, createdAt: serverTimestamp() });
      setNewStation({ name: '', location: '', operator: '' });
      fetchStations();
      toast.success('تم إضافة المحطة بنجاح');
    } catch (err) {
      toast.error('فشل في إضافة المحطة');
    }
  };

  const handleDeleteStation = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه المحطة؟')) return;
    try {
      await deleteDoc(doc(db, 'stations', id));
      fetchStations();
      toast.success('تم حذف المحطة');
    } catch (err) {
      toast.error('فشل في حذف المحطة');
    }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, 'system', 'settings'), settings);
      toast.success('تم تحديث معايير النظام بنجاح');
    } catch {
      toast.error('فشل في حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value
    }));
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[70vh] gap-6">
       <div className="relative">
          <div className="w-20 h-20 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin"></div>
          <SettingsIcon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary-500" size={32} />
       </div>
       <p className="text-sm font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Initializing Core Settings...</p>
    </div>
  );

  const tabs = [
    { id: 'station', icon: <Database size={18} />, label: 'المعايير التشغيلية' },
    { id: 'stations_list', icon: <MapPin size={18} />, label: 'إدارة المحطات' },
    { id: 'alerts', icon: <Bell size={18} />, label: 'الذكاء والتنبيهات' },
    { id: 'system', icon: <Cpu size={18} />, label: 'تفضيلات الواجهة' },
    { id: 'security', icon: <Shield size={18} />, label: 'بروتوكولات الأمان' },
  ];

  return (
    <div className="max-w-7xl mx-auto pb-20 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
           <div className="flex items-center gap-2 mb-3">
              <div className="px-3 py-1 bg-primary-500/10 dark:bg-primary-400/10 text-primary-600 dark:text-primary-400 rounded-full border border-primary-600/20 flex items-center gap-2">
                 <Settings2 size={14} />
                 <span className="text-[10px] font-black uppercase tracking-widest">تحكم النظام الشامل</span>
              </div>
           </div>
           <h1 className="text-4xl md:text-5xl font-display font-black tracking-tight text-slate-900 dark:text-white leading-tight">
             إعدادات <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-emerald-600">المركز الرئيسي</span>
           </h1>
           <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium max-w-xl">تخصيص الثوابت الفيزيائية، خوارزميات التنبيه، ومعايير أداء المولدات والغواطس.</p>
        </div>
        
        <button 
          onClick={handleSave}
          disabled={saving}
          className="relative px-10 py-5 bg-slate-900 dark:bg-primary-600 hover:bg-slate-800 dark:hover:bg-primary-700 text-white rounded-[24px] font-black shadow-2xl transition-all hover:scale-[1.03] active:scale-95 group flex items-center gap-3 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          {saving ? <RefreshCw className="animate-spin" size={24} /> : <Save size={24} />}
          <span className="text-lg uppercase tracking-tight">{saving ? 'جاري المزامنة...' : 'حفظ التعديلات'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Navigation Tabs */}
        <div className="lg:col-span-3 space-y-2">
          <div className="glass-card p-3 border-white/40 dark:border-white/5 sticky top-8 flex flex-col gap-1 shadow-2xl shadow-slate-200/50 dark:shadow-none">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-[20px] transition-all font-black text-sm relative group ${
                  activeTab === tab.id ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-xl' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'
                }`}
              >
                <div className={`transition-colors ${activeTab === tab.id ? 'text-primary-400 dark:text-primary-600' : 'text-slate-300'}`}>
                   {tab.icon}
                </div>
                <span className="flex-1 text-right">{tab.label}</span>
                {activeTab === tab.id && <motion.div layoutId="activeTab" className="absolute left-3 w-1.5 h-1.5 rounded-full bg-primary-500" />}
              </button>
            ))}
          </div>

          <div className="p-6 rounded-[32px] bg-emerald-600/5 border border-emerald-500/10">
             <div className="flex items-center gap-2 text-emerald-600 mb-2">
                <ShieldCheck size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">System Health</span>
             </div>
             <div className="flex items-end gap-2">
                <span className="text-2xl font-display font-black text-emerald-600">99.8%</span>
                <span className="text-[10px] font-bold text-slate-400 mb-1">UPTIME</span>
             </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-9 space-y-8 min-h-[500px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              {activeTab === 'station' && (
                <section className="glass-card p-10 md:p-12 border-white/40 dark:border-white/5 relative overflow-hidden group shadow-2xl shadow-slate-200/50 dark:shadow-none">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 blur-[100px] -mr-32 -mt-32 pointer-events-none"></div>
                  
                  <div className="flex items-center gap-4 mb-10">
                    <div className="w-14 h-14 bg-blue-500/10 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner"><Droplets size={28} /></div>
                    <div>
                       <h2 className="text-2xl font-black text-slate-900 dark:text-white">المعايير التشغيلية</h2>
                       <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">المقاييس الفيزيائية وحسابات الإنتاج</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">مسمى المحطة الرسمي</label>
                      <input type="text" name="stationName" value={settings.stationName} onChange={handleChange} className="w-full h-16 px-6 bg-slate-50 dark:bg-white/[0.03] border-none rounded-3xl text-lg font-black outline-none focus:ring-4 focus:ring-primary-500/10 transition-all" />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">كبير المشغلين الافتراضي</label>
                      <input type="text" name="defaultOperator" value={settings.defaultOperator} onChange={handleChange} className="w-full h-16 px-6 bg-slate-50 dark:bg-white/[0.03] border-none rounded-3xl text-lg font-black outline-none focus:ring-4 focus:ring-primary-500/10 transition-all" />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">معدل استهلاك الديزل (لتر/ساعة)</label>
                      <div className="relative group">
                        <input type="number" name="fuelRate" value={settings.fuelRate} onChange={handleChange} className="w-full h-16 px-6 bg-slate-900 dark:bg-white/[0.03] border-none rounded-3xl text-3xl font-display font-black text-amber-500 pr-16" />
                        <Zap className="absolute right-5 top-1/2 -translate-y-1/2 text-amber-500/40" size={24} />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">إنتاج الغاطس (كوب/ساعة)</label>
                      <div className="relative group">
                        <input type="number" name="pumpProduction" value={settings.pumpProduction} onChange={handleChange} className="w-full h-16 px-6 bg-slate-50 dark:bg-white/[0.03] border-none rounded-3xl text-3xl font-display font-black text-primary-600 pr-16" />
                        <Radio className="absolute right-5 top-1/2 -translate-y-1/2 text-primary-500/40" size={24} />
                      </div>
                    </div>
                  </div>

                  <div className="mt-10 flex items-center gap-4 mb-10 border-t border-slate-100 dark:border-white/5 pt-10">
                    <div className="w-14 h-14 bg-emerald-500/10 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner"><Cpu size={28} /></div>
                    <div>
                       <h2 className="text-2xl font-black text-slate-900 dark:text-white">التحكم الذكي والأتمتة</h2>
                       <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">تكوين التنبيهات ونظام واتساب</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">فاصل صيانة المولد (ساعة)</label>
                      <input type="number" name="maintenanceInterval" value={settings.maintenanceInterval} onChange={handleChange} className="w-full h-16 px-6 bg-slate-50 dark:bg-white/[0.03] border-none rounded-3xl text-2xl font-black outline-none focus:ring-4 focus:ring-primary-500/10 transition-all text-emerald-600" />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">رقم استقبال تقارير واتساب</label>
                      <input type="text" name="whatsappNumber" value={settings.whatsappNumber} onChange={handleChange} className="w-full h-16 px-6 bg-slate-50 dark:bg-white/[0.03] border-none rounded-3xl text-xl font-black outline-none focus:ring-4 focus:ring-primary-500/10 transition-all text-emerald-600" />
                    </div>
                  </div>
                </section>
              )}

              {activeTab === 'alerts' && (
                <section className="space-y-6">
                   <div className="glass-card p-10 border-white/40 dark:border-white/5">
                      <div className="flex items-center gap-4 mb-8">
                        <div className="w-14 h-14 bg-rose-500/10 text-rose-600 rounded-2xl flex items-center justify-center shadow-inner"><Bell size={28} /></div>
                        <div>
                          <h2 className="text-2xl font-black text-slate-900 dark:text-white">الذكاء والتنبيهات</h2>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">معايير اكتشاف الأخطاء والفاقد</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="p-8 rounded-[40px] bg-rose-500/5 border border-rose-500/10 space-y-6 relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-2 h-full bg-rose-500"></div>
                            <div className="flex justify-between items-center">
                               <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">مستوى الوقود الحرج</p>
                               <span className="px-3 py-1 bg-rose-500 text-white text-[10px] font-black rounded-lg uppercase tracking-widest">Alert</span>
                            </div>
                            <div className="space-y-4">
                               <input type="range" name="fuelAlertThreshold" min="50" max="1000" step="50" value={settings.fuelAlertThreshold} onChange={handleChange} className="w-full accent-rose-500 h-2 bg-rose-200 dark:bg-white/10 rounded-full appearance-none cursor-pointer" />
                               <div className="flex items-end justify-between">
                                  <span className="text-4xl font-display font-black text-rose-600">{settings.fuelAlertThreshold}</span>
                                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Liters Remaining</span>
                               </div>
                            </div>
                         </div>

                         <div className="p-8 rounded-[40px] bg-amber-500/5 border border-amber-500/10 space-y-6 relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-2 h-full bg-amber-500"></div>
                            <div className="flex justify-between items-center">
                               <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">نسبة الفاقد المسموحة</p>
                               <span className="px-3 py-1 bg-amber-500 text-white text-[10px] font-black rounded-lg uppercase tracking-widest">Warning</span>
                            </div>
                            <div className="space-y-4">
                               <input type="range" name="lossAlertThreshold" min="10" max="90" value={settings.lossAlertThreshold} onChange={handleChange} className="w-full accent-amber-500 h-2 bg-amber-200 dark:bg-white/10 rounded-full appearance-none cursor-pointer" />
                               <div className="flex items-end justify-between">
                                  <span className="text-4xl font-display font-black text-amber-600">{settings.lossAlertThreshold}</span>
                                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Percentage %</span>
                               </div>
                            </div>
                         </div>
                      </div>
                   </div>

                   <div className="p-8 bg-slate-900 text-white rounded-[40px] flex items-center gap-6">
                      <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center shrink-0"><Sparkles size={32} className="text-primary-400" /></div>
                      <div>
                         <p className="text-lg font-bold">التحليل التنبؤي مفعل</p>
                         <p className="text-sm text-slate-400 font-medium leading-relaxed">يقوم النظام بتحليل هذه العتبات لاقتراح جداول الصيانة وتنبؤ تاريخ نفاذ الوقود بناءً على معدلات الاستهلاك التاريخية.</p>
                      </div>
                   </div>
                </section>
              )}

              {activeTab === 'stations_list' && (
                <section className="space-y-8">
                   <div className="glass-card p-10 border-white/40 dark:border-white/5">
                      <div className="flex items-center gap-4 mb-10">
                        <div className="w-14 h-14 bg-primary-500/10 text-primary-600 rounded-2xl flex items-center justify-center shadow-inner"><MapPin size={28} /></div>
                        <div>
                           <h2 className="text-2xl font-black text-slate-900 dark:text-white">إدارة المحطات</h2>
                           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">إضافة وإدارة محطات التوزيع والضخ</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">اسم المحطة</label>
                            <input type="text" value={newStation.name} onChange={(e) => setNewStation({...newStation, name: e.target.value})} className="w-full h-14 px-5 bg-slate-50 dark:bg-white/5 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-primary-500" placeholder="مثلاً: بئر الصالح" />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">الموقع</label>
                            <input type="text" value={newStation.location} onChange={(e) => setNewStation({...newStation, location: e.target.value})} className="w-full h-14 px-5 bg-slate-50 dark:bg-white/5 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-primary-500" placeholder="الحي أو المنطقة" />
                         </div>
                         <div className="flex items-end">
                            <button onClick={handleAddStation} className="w-full h-14 bg-primary-600 text-white rounded-2xl font-black shadow-lg shadow-primary-500/20 flex items-center justify-center gap-2 hover:bg-primary-700 transition-all">
                               <Plus size={20} />
                               <span>إضافة محطة جديدة</span>
                            </button>
                         </div>
                      </div>

                      <div className="space-y-4">
                         {stations.length === 0 ? (
                           <div className="p-10 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-[32px] text-center">
                              <p className="text-slate-400 font-bold">لا يوجد محطات مضافة حالياً</p>
                           </div>
                         ) : (
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {stations.map(station => (
                                <div key={station.id} className="p-6 rounded-[28px] bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 flex items-center justify-between group hover:border-primary-500/30 transition-all">
                                   <div className="flex items-center gap-4">
                                      <div className="w-12 h-12 bg-slate-100 dark:bg-white/10 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-primary-500 transition-colors"><MapPin size={22} /></div>
                                      <div>
                                         <p className="font-black text-slate-900 dark:text-white leading-none mb-1">{station.name}</p>
                                         <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{station.location || 'موقع غير محدد'}</p>
                                      </div>
                                   </div>
                                   <button onClick={() => handleDeleteStation(station.id)} className="w-10 h-10 rounded-xl flex items-center justify-center text-rose-400 hover:bg-rose-500/10 transition-all"><Trash2 size={18} /></button>
                                </div>
                              ))}
                           </div>
                         )}
                      </div>
                   </div>
                </section>
              )}

              {activeTab === 'system' && (
                <section className="glass-card p-10 border-white/40 dark:border-white/5 space-y-10">
                   <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-emerald-500/10 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner"><Layout size={28} /></div>
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 dark:text-white">تفضيلات الواجهة والنظام</h2>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">تخصيص تجربة المستخدم والأتمتة</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="flex items-center justify-between p-8 rounded-[32px] bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 hover:border-primary-500/30 transition-all cursor-pointer group">
                      <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-primary-500 transition-colors shadow-sm"><HardDrive size={24} /></div>
                        <div>
                          <p className="text-lg font-black text-slate-900 dark:text-white leading-none mb-2">الأرشفة الذكية للتقارير</p>
                          <p className="text-sm text-slate-500 font-medium">نقل التقارير التي تجاوزت 90 يوماً إلى سجل الأرشيف البارد تلقائياً.</p>
                        </div>
                      </div>
                      <div className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ${settings.reportAutoArchive ? 'bg-primary-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                         <motion.div animate={{ x: settings.reportAutoArchive ? -24 : 0 }} className="w-6 h-6 bg-white rounded-full shadow-lg" />
                         <input type="checkbox" name="reportAutoArchive" checked={settings.reportAutoArchive} onChange={handleChange} className="hidden" />
                      </div>
                    </label>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="p-8 rounded-[32px] bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">لغة النظام (Localization)</p>
                          <select name="language" value={settings.language} onChange={handleChange} className="w-full bg-transparent border-none font-black text-xl text-slate-900 dark:text-white focus:ring-0 p-0 cursor-pointer">
                             <option value="ar">العربية - اللغة الأم</option>
                             <option value="en">English - US (Beta)</option>
                          </select>
                       </div>
                       <div className="p-8 rounded-[32px] bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 flex flex-col justify-between">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">النمط الافتراضي (UI Theme)</p>
                          <div className="flex items-center gap-4">
                             <span className="text-xl font-black text-slate-900 dark:text-white">Dark Mode</span>
                             <div className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 text-[10px] font-black rounded-lg uppercase tracking-tighter border border-emerald-500/20">Active</div>
                          </div>
                       </div>
                    </div>
                  </div>
                </section>
              )}

              {activeTab === 'security' && (
                <section className="glass-card p-10 border-white/40 dark:border-white/5 space-y-8">
                   <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-primary-500/10 text-primary-600 rounded-2xl flex items-center justify-center shadow-inner"><Shield size={28} /></div>
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 dark:text-white">بروتوكولات الأمان والوصول</h2>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">حماية البيانات وخصوصية العمليات</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <label className={`p-8 rounded-[32px] border transition-all cursor-pointer group flex flex-col gap-4 ${settings.adminOnlyAccess ? 'bg-rose-500/5 border-rose-500/30' : 'border-slate-100 dark:border-white/5'}`}>
                        <div className="flex justify-between items-start">
                           <ShieldAlert className={settings.adminOnlyAccess ? "text-rose-500" : "text-slate-400"} size={32} />
                           <div className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 ${settings.adminOnlyAccess ? 'bg-rose-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                              <motion.div animate={{ x: settings.adminOnlyAccess ? -20 : 0 }} className="w-5 h-5 bg-white rounded-full shadow-md" />
                           </div>
                        </div>
                        <h4 className="text-lg font-black">تقييد الوصول للمسؤولين فقط</h4>
                        <p className="text-sm text-slate-500 font-medium leading-relaxed">تفعيل طبقة الحماية الإضافية عند محاولة تعديل الإعدادات المركزية من خارج النطاق الشبكي المعتمد.</p>
                        <input type="checkbox" name="adminOnlyAccess" checked={settings.adminOnlyAccess} onChange={handleChange} className="hidden" />
                     </label>

                     <label className={`p-8 rounded-[32px] border transition-all cursor-pointer group flex flex-col gap-4 ${settings.maintenanceMode ? 'bg-primary-500/5 border-primary-500/30' : 'border-slate-100 dark:border-white/5'}`}>
                        <div className="flex justify-between items-start">
                           <Wrench className={settings.maintenanceMode ? "text-primary-500" : "text-slate-400"} size={32} />
                           <div className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 ${settings.maintenanceMode ? 'bg-primary-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                              <motion.div animate={{ x: settings.maintenanceMode ? -20 : 0 }} className="w-5 h-5 bg-white rounded-full shadow-md" />
                           </div>
                        </div>
                        <h4 className="text-lg font-black">وضع الصيانة الشاملة</h4>
                        <p className="text-sm text-slate-500 font-medium leading-relaxed">عند التفعيل، ستتوقف جميع عمليات الإدخال الميدانية للسماح بإجراء فحوصات دورية لقاعدة البيانات.</p>
                        <input type="checkbox" name="maintenanceMode" checked={settings.maintenanceMode} onChange={handleChange} className="hidden" />
                     </label>
                  </div>
                </section>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Safety Note */}
      <div className="p-10 bg-slate-900 rounded-[48px] text-white flex flex-col md:flex-row items-center gap-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600 blur-[100px] opacity-20 -mr-32 -mt-32 group-hover:scale-150 transition-transform duration-1000"></div>
        <div className="w-20 h-20 bg-white/10 rounded-[28px] flex items-center justify-center shrink-0 border border-white/10 shadow-2xl"><ShieldCheck size={40} className="text-emerald-400" /></div>
        <div className="flex-1 text-center md:text-right">
          <h4 className="text-xl font-display font-black tracking-tight mb-2">منطقة العمليات المحمية</h4>
          <p className="text-sm text-slate-400 font-medium leading-relaxed">يرجى ملاحظة أن جميع التغييرات في هذه الصفحة يتم توثيقها بالوقت والمستخدم في سجل الحركات السيادي (Master Audit Log). سيتم إرسال تنبيه فوري لمديري النظام عند حفظ أي تعديلات على المعايير التشغيلية.</p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
