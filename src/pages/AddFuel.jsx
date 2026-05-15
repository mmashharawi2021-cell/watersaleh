import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, doc, getDoc, updateDoc, serverTimestamp, query, orderBy, getDocs } from 'firebase/firestore';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Fuel, Save, ArrowRight, Calendar, Truck, Info, Droplets, RefreshCw, Sparkles, Clock, ChevronRight, MapPin, User, ShieldCheck, Package } from 'lucide-react';
import { logAction } from '../utils/logger';
import ConfirmDialog from '../components/ConfirmDialog';
import { motion, AnimatePresence } from 'framer-motion';

const AddFuel = () => {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [initialFetchDone, setInitialFetchDone] = useState(false);
  
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    time: format(new Date(), 'HH:mm'),
    supplier: '',
    quantityLiters: '',
    fillingMethod: 'فرد تعبئة',
    deliveredBy: '',
    station: 'المحطة الرئيسية',
    notes: ''
  });

  const [stations, setStations] = useState([]);
  const [isMaintenance, setIsMaintenance] = useState(false);

  useEffect(() => {
    const checkMaintenance = async () => {
      const settingsSnap = await getDoc(doc(db, 'system', 'settings'));
      if (settingsSnap.exists() && settingsSnap.data().maintenanceMode) {
        setIsMaintenance(true);
      }
    };
    checkMaintenance();
    const init = async () => {
      // Fetch stations
      const q = query(collection(db, 'stations'), orderBy('name'));
      const snap = await getDocs(q);
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStations(list);

      if (id) {
        const fetchFuelEntry = async () => {
          try {
            const docRef = doc(db, 'fuelEntries', id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              setFormData(docSnap.data());
            } else {
              toast.error('لم يتم العثور على السجل');
              navigate('/fuel-archive');
            }
          } catch (error) {
            console.error(error);
          } finally {
            setInitialFetchDone(true);
          }
        };
        fetchFuelEntry();
      } else {
        if (list.length > 0) {
          setFormData(prev => ({ ...prev, station: list[0].name }));
        }
        setInitialFetchDone(true);
      }
    };
    init();
  }, [id, navigate]);

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value
    }));
  };

  const handlePreSubmit = (e) => {
    e.preventDefault();
    if (!formData.supplier || !formData.quantityLiters) {
      toast.error('الرجاء إدخال الجهة الموردة والكمية');
      return;
    }
    if (Number(formData.quantityLiters) <= 0) {
      toast.error('الكمية يجب أن تكون أكبر من صفر');
      return;
    }
    setShowConfirm(true);
  };

  const saveFuel = async () => {
    try {
      setLoading(true);
      const fuelData = {
        ...formData,
        quantityLiters: Number(formData.quantityLiters),
        updatedAt: serverTimestamp(),
        updatedBy: currentUser.uid
      };

      if (id) {
        await updateDoc(doc(db, 'fuelEntries', id), fuelData);
        await logAction('تعديل وقود', `تعديل ${formData.quantityLiters} لتر - ${formData.supplier}`, userData);
        toast.success('تم تحديث السجل');
      } else {
        await addDoc(collection(db, 'fuelEntries'), {
          ...fuelData,
          createdAt: serverTimestamp(),
          createdBy: currentUser.uid
        });
        await logAction('إضافة وقود', `إضافة ${formData.quantityLiters} لتر - ${formData.supplier}`, userData);
        toast.success('تم تسجيل الوقود بنجاح');
      }
      navigate('/fuel-archive');
    } catch (error) {
      console.error(error);
      toast.error('خطأ في الحفظ');
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  if (!initialFetchDone) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
        <div className="relative">
           <div className="w-16 h-16 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin"></div>
           <Fuel className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary-500" size={24} />
        </div>
        <p className="text-sm font-black text-slate-400 uppercase tracking-widest animate-pulse">جاري تحضير البيانات...</p>
      </div>
    );
  }

  if (isMaintenance && !id) return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-8 p-10 text-center">
       <div className="w-24 h-24 bg-rose-500/10 text-rose-600 rounded-3xl flex items-center justify-center animate-pulse">
          <Truck size={48} />
       </div>
       <div className="space-y-4 max-w-md">
          <h2 className="text-3xl font-black text-slate-900 dark:text-white">وضع الصيانة مفعل</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">نعتذر، تم تعليق إدخال بيانات الوقود مؤقتاً لإجراء صيانة دورية للنظام.</p>
          <button onClick={() => navigate('/')} className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black transition-all hover:scale-105 active:scale-95">العودة للوحة البيانات</button>
       </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto pb-20 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
           <div className="flex items-center gap-3 mb-4">
              <Link to="/fuel-archive" className="w-10 h-10 bg-white/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl flex items-center justify-center text-slate-400 hover:text-amber-600 hover:border-amber-500 transition-all active:scale-95 shadow-sm">
                 <ChevronRight size={20} />
              </Link>
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                 <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">التوثيق اللوجستي</span>
              </div>
           </div>
           <h1 className="text-4xl md:text-5xl font-display font-black tracking-tighter text-slate-900 dark:text-white leading-tight">
             {id ? 'تعديل بيانات التوريد' : 'تسجيل توريد وقود جديد'}
           </h1>
           <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium max-w-xl">توثيق الكميات الواردة، طريقة التعبئة، والجهات المسؤولة عن تزويد المحطة بالطاقة.</p>
        </div>

        <div className="hidden lg:flex items-center gap-4 bg-amber-500/5 p-4 rounded-[32px] border border-amber-500/10">
           <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
              <Sparkles size={24} />
           </div>
           <div>
              <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest leading-none mb-1">تحديث ذكي</p>
              <p className="text-xs font-bold text-slate-500">سيتم ربط الكمية بميزان الاستهلاك تلقائياً</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Main Form Column */}
        <div className="lg:col-span-8">
          <form onSubmit={handlePreSubmit} className="glass-card p-10 md:p-12 border-white/40 dark:border-white/5 space-y-10 relative overflow-hidden shadow-2xl shadow-slate-200/50 dark:shadow-none">
            <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 blur-[100px] -mr-40 -mt-40 pointer-events-none"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
              {/* Date & Time */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Calendar size={14} className="text-amber-500" /> تاريخ الاستلام
                </label>
                <input 
                  type="date" name="date" value={formData.date} onChange={handleInputChange} 
                  className="input-field h-14 bg-slate-50 dark:bg-white/[0.03] border-none font-bold text-lg" required 
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Clock size={14} className="text-amber-500" /> وقت الوصول
                </label>
                <input 
                  type="time" name="time" value={formData.time} onChange={handleInputChange} 
                  className="input-field h-14 bg-slate-50 dark:bg-white/[0.03] border-none font-bold text-lg text-center" required 
                />
              </div>
              
              {/* Supplier */}
              <div className="md:col-span-2 space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Truck size={14} className="text-amber-500" /> الجهة الموردة / الناقلة
                </label>
                <div className="relative group">
                   <input 
                     type="text" name="supplier" value={formData.supplier} onChange={handleInputChange} 
                     placeholder="مثال: الهلال الأحمر، مؤسسة قطر، توريد محلي..."
                     className="input-field h-14 bg-slate-50 dark:bg-white/[0.03] border-none font-black text-lg pr-14" required 
                   />
                   <Truck className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-amber-500 transition-colors" size={20} />
                </div>
              </div>
              
              {/* Quantity */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">إجمالي الكمية (لتر)</label>
                <div className="relative group h-20">
                  <input 
                    type="number" name="quantityLiters" value={formData.quantityLiters} onChange={handleInputChange} 
                    className="input-field h-full bg-slate-900 dark:bg-white/[0.05] border-none font-display font-black text-5xl text-amber-500 text-center pr-16" 
                    required min="1" 
                  />
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-amber-500/40 uppercase tracking-widest">Liters</div>
                </div>
              </div>

              {/* Method */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">طريقة استلام الوقود</label>
                <select 
                  name="fillingMethod" value={formData.fillingMethod} onChange={handleInputChange} 
                  className="input-field h-20 bg-slate-50 dark:bg-white/[0.03] border-none font-black text-xl cursor-pointer"
                >
                  <option value="فرد تعبئة">فرد تعبئة (خرطوم)</option>
                  <option value="جالون جاهز">جالونات مغلقة</option>
                  <option value="تفريغ صهريج">تفريغ صهريج مباشر</option>
                  <option value="أخرى">أخرى (ذكر بالملاحظات)</option>
                </select>
              </div>
              
              {/* Station */}
              <div className="md:col-span-2 space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <MapPin size={14} className="text-amber-500" /> المحطة المستلمة
                </label>
                <select 
                  name="station" value={formData.station} onChange={handleInputChange} 
                  className="input-field h-14 bg-slate-50 dark:bg-white/[0.03] border-none font-black text-lg cursor-pointer"
                >
                  {stations.length > 0 ? (
                    stations.map(s => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))
                  ) : (
                    <option value="المحطة الرئيسية">المحطة الرئيسية</option>
                  )}
                </select>
              </div>

              {/* Receiver */}
              <div className="md:col-span-2 space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <User size={14} className="text-amber-500" /> اسم المشغل / المستلم الميداني
                </label>
                <div className="relative group">
                   <input 
                     type="text" name="deliveredBy" value={formData.deliveredBy} onChange={handleInputChange} 
                     className="input-field h-14 bg-slate-50 dark:bg-white/[0.03] border-none font-bold pr-14" 
                     placeholder="اسم الشخص الذي استلم الشحنة..."
                   />
                   <User className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-amber-500 transition-colors" size={20} />
                </div>
              </div>
              
              {/* Notes */}
              <div className="md:col-span-2 space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Info size={14} className="text-amber-500" /> تفاصيل إضافية / فنية
                </label>
                <textarea 
                  name="notes" value={formData.notes} onChange={handleInputChange} 
                  className="input-field h-40 bg-slate-50 dark:bg-white/[0.03] border-none font-bold resize-none p-6 text-sm leading-relaxed" 
                  placeholder="رقم السند، حالة الوقود، أي ملاحظات على الناقلة..."
                ></textarea>
              </div>
            </div>

            <div className="pt-10 border-t border-slate-100 dark:border-white/5 flex justify-end gap-6 relative z-10">
              <button 
                type="button" onClick={() => navigate(-1)} 
                className="px-8 py-4 rounded-2xl font-black text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
              >
                تراجع
              </button>
              <button 
                type="submit" disabled={loading} 
                className="px-12 py-4 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-3xl shadow-2xl shadow-amber-600/20 transition-all hover:scale-[1.03] active:scale-95 flex items-center gap-3 group"
              >
                {loading ? <RefreshCw className="animate-spin" size={24} /> : <Save size={24} className="group-hover:scale-110 transition-transform" />}
                {loading ? 'جاري الحفظ...' : 'اعتماد السجل'}
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar Column */}
        <div className="lg:col-span-4 space-y-8">
          <div className="glass-card p-8 border-white/40 dark:border-white/5 space-y-6">
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-3">
               <div className="w-8 h-8 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-500"><ShieldCheck size={18} /></div>
               بروتوكول الاستلام
            </h3>
            <div className="space-y-6">
               {[
                 { title: 'التحقق الفيزيائي', desc: 'يجب مطابقة الكمية في السند مع عداد الصهريج أو عدد الجالونات قبل التوقيع.' },
                 { title: 'ضبط الجودة', desc: 'تأكد من خلو الوقود من الشوائب أو المياه لضمان كفاءة عمل المولدات.' },
                 { title: 'التوثيق الرقمي', desc: 'هذا السجل سيؤثر مباشرة على مؤشرات أداء المحطة ورصيد الوقود التراكمي.' }
               ].map((item, i) => (
                 <div key={i} className="flex gap-4 group">
                    <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center text-[10px] font-black text-slate-400 shrink-0 mt-0.5 group-hover:bg-primary-500 group-hover:text-white transition-all">{i+1}</div>
                    <div>
                       <p className="text-xs font-black text-slate-800 dark:text-white mb-1">{item.title}</p>
                       <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
                    </div>
                 </div>
               ))}
            </div>
          </div>

          <div className="p-10 rounded-[40px] bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-600 blur-[80px] opacity-20 -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
            <Package size={40} className="text-amber-500 opacity-40 mb-6" />
            <h4 className="text-xl font-display font-black leading-tight">تكامل الموارد</h4>
            <p className="text-xs font-medium opacity-60 mt-3 leading-relaxed">
              عند اعتماد هذا السجل، سيتم إضافة الكمية فوراً إلى "الرصيد الميداني" للمحطة. يمكنك مراقبة التغيرات في صفحة أرشيف الوقود.
            </p>
            <div className="mt-8 pt-8 border-t border-white/10 flex items-center justify-between">
               <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30">Security Verified</span>
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={saveFuel}
        title={id ? "تعديل السجل" : "تأكيد التوريد"}
        message={id ? "هل أنت متأكد من حفظ التعديلات؟ سيتم تحديث الأرصدة التاريخية بناءً على القيم الجديدة." : `أنت بصدد تسجيل توريد ${formData.quantityLiters} لتر من جهة ${formData.supplier}. هل تريد المتابعة؟`}
        type="success"
        confirmText="نعم، اعتمد السجل"
        cancelText="مراجعة"
      />
    </div>
  );
};

export default AddFuel;
