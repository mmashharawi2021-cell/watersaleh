import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Droplets, Eye, User, Loader2, ShieldCheck, Settings, Users, Shield, Lock, ChevronLeft, Sparkles, Waves, Zap, Globe } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('الرجاء إدخال اسم المستخدم وكلمة المرور');
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
      toast.success('مرحباً بك مجدداً في مركز القيادة');
      navigate('/');
    } catch (error) {
      console.error(error);
      toast.error('فشل تسجيل الدخول، يرجى التحقق من بياناتك');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full font-sans bg-slate-50 dark:bg-slate-950 overflow-hidden" dir="rtl">
      
      {/* Visual Identity Panel (Right) */}
      <div className="hidden lg:flex flex-col relative w-[45%] overflow-hidden bg-slate-900 shadow-2xl z-20">
        {/* Animated Background Gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-blue-900 to-slate-900"></div>
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            x: [0, 50, 0],
            y: [0, -50, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-20%] right-[-20%] w-[150%] h-[150%] bg-primary-600/20 blur-[120px] rounded-full"
        ></motion.div>
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
            x: [0, -40, 0],
            y: [0, 60, 0]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-10%] left-[-10%] w-full h-full bg-emerald-600/10 blur-[100px] rounded-full"
        ></motion.div>

        {/* Content Container */}
        <div className="relative z-10 flex flex-col justify-between h-full p-16">
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl flex items-center justify-center shadow-2xl">
                <Droplets size={32} className="text-primary-400" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white tracking-tighter uppercase">Water <span className="text-primary-400">OS</span></h3>
                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Management Suite 4.0</p>
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="text-6xl font-display font-black text-white leading-[1.1] tracking-tighter">
                مركز العمليات <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-emerald-400">الرقمي للمياه</span>
              </h1>
              <p className="text-slate-400 text-lg font-medium max-w-md leading-relaxed">
                منصة متكاملة لإدارة محطات التحلية، متابعة سلاسل التوريد، وتحليل الأداء التشغيلي بدقة عالية.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-primary-400">
                <Zap size={18} />
                <span className="text-xs font-black uppercase tracking-widest">تحليلات فورية</span>
              </div>
              <p className="text-sm font-bold text-white">معالجة البيانات في الوقت الحقيقي</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-emerald-400">
                <Globe size={18} />
                <span className="text-xs font-black uppercase tracking-widest">تغطية شاملة</span>
              </div>
              <p className="text-sm font-bold text-white">إدارة كافة المحطات من نافذة واحدة</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-12 border-t border-white/10">
            <div className="flex -space-x-3 rtl:space-x-reverse">
               {[1,2,3,4].map(i => (
                 <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-800 overflow-hidden">
                    <img src={`https://i.pravatar.cc/150?u=${i}`} alt="user" className="w-full h-full object-cover grayscale opacity-50" />
                 </div>
               ))}
               <div className="w-10 h-10 rounded-full border-2 border-slate-900 bg-primary-600 flex items-center justify-center text-[10px] font-black text-white">+12</div>
            </div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Trusted by Field Teams</span>
          </div>
        </div>
      </div>

      {/* Login Form Panel (Left) */}
      <div className="w-full lg:w-[55%] flex flex-col items-center justify-center p-8 relative overflow-hidden bg-white dark:bg-slate-950">
        
        {/* Floating Background Glows for Mobile */}
        <div className="lg:hidden absolute top-0 right-0 w-64 h-64 bg-primary-500/10 blur-[80px] rounded-full"></div>
        <div className="lg:hidden absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full"></div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-[480px]"
        >
          {/* Brand for Mobile */}
          <div className="lg:hidden flex flex-col items-center mb-12 text-center">
            <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center shadow-xl mb-6">
               <Droplets size={32} className="text-primary-400" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Water <span className="text-primary-500">OS</span></h2>
          </div>

          <div className="mb-12">
            <h2 className="text-4xl font-display font-black text-slate-900 dark:text-white tracking-tight mb-3">تسجيل الدخول</h2>
            <p className="text-slate-500 font-medium text-lg">أدخل بيانات الاعتماد للوصول إلى لوحة التحكم.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
              <div className="space-y-2 group">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2 flex items-center gap-2 group-focus-within:text-primary-500 transition-colors">
                  <User size={12} /> البريد الإلكتروني / اسم المستخدم
                </label>
                <div className="relative">
                  <input 
                    type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-16 px-6 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-3xl text-lg font-bold focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none"
                    placeholder="name@organization.com" required
                  />
                </div>
              </div>

              <div className="space-y-2 group">
                <div className="flex justify-between items-center px-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 group-focus-within:text-primary-500 transition-colors">
                     <Lock size={12} /> كلمة المرور
                   </label>
                   <button type="button" className="text-[10px] font-black text-primary-600 uppercase tracking-widest hover:underline">نسيت كلمة المرور؟</button>
                </div>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-16 px-6 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-3xl text-lg font-bold focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none"
                    placeholder="••••••••" required
                  />
                  <button 
                    type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary-600 transition-colors"
                  >
                    {showPassword ? <Eye size={20} /> : <Eye size={20} className="opacity-40" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 px-2">
              <input type="checkbox" id="remember" className="w-5 h-5 rounded-lg border-slate-200 text-primary-600 focus:ring-primary-500 transition-all cursor-pointer" />
              <label htmlFor="remember" className="text-sm font-bold text-slate-600 dark:text-slate-400 cursor-pointer select-none">البقاء متصلاً على هذا الجهاز</label>
            </div>

            <button 
              type="submit" disabled={loading}
              className="w-full h-18 bg-slate-900 dark:bg-primary-600 hover:bg-slate-800 dark:hover:bg-primary-700 text-white font-display font-black text-xl rounded-[2.5rem] shadow-2xl shadow-slate-900/20 dark:shadow-primary-600/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-4 relative overflow-hidden group"
            >
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-3">
                    <Loader2 className="animate-spin" size={24} />
                    <span>جاري المصادقة...</span>
                  </motion.div>
                ) : (
                  <motion.div key="normal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-3">
                    <span>الدخول للمنصة</span>
                    <ChevronLeft size={24} className="group-hover:-translate-x-2 transition-transform duration-300" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </form>

          <div className="mt-16 flex flex-col items-center gap-6">
            <div className="flex items-center gap-6">
               <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                  <ShieldCheck size={16} className="text-emerald-500" /> اتصال مشفر 256-bit
               </div>
               <div className="w-px h-4 bg-slate-200"></div>
               <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                  <Sparkles size={16} className="text-primary-500" /> النسخة 4.2.0
               </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
