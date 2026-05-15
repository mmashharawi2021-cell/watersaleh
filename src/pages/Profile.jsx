import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, storage } from '../firebase';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  User, 
  Key, 
  Save, 
  Camera, 
  Shield, 
  History, 
  Mail, 
  Fingerprint, 
  Trophy, 
  Zap, 
  Activity,
  Lock,
  Edit3,
  CheckCircle2,
  RefreshCw,
  ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const Profile = () => {
  const { userData, currentUser } = useAuth();
  
  const [name, setName] = useState(userData?.name || '');
  const [username, setUsername] = useState(userData?.username || '');
  const [avatarUrl, setAvatarUrl] = useState(userData?.photoURL || '');
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [stats, setStats] = useState({ reportsCount: 0, fuelCount: 0, uptime: '99.9%' });

  useEffect(() => {
    const fetchStats = async () => {
      if (!currentUser) return;
      try {
        const reportsQ = query(collection(db, 'reports'), where('operatorId', '==', currentUser.uid));
        const reportsSnap = await getDocs(reportsQ);
        
        const fuelQ = query(collection(db, 'fuelEntries'), where('operatorId', '==', currentUser.uid));
        const fuelSnap = await getDocs(fuelQ);
        
        setStats(prev => ({
          ...prev,
          reportsCount: reportsSnap.size,
          fuelCount: fuelSnap.size
        }));
      } catch (err) {
        console.error("Error fetching stats:", err);
      }
    };
    fetchStats();
  }, [currentUser]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("حجم الصورة يجب أن لا يتجاوز 2 ميجابايت");
      return;
    }

    try {
      setUploadingAvatar(true);
      const storageRef = ref(storage, `avatars/${currentUser.uid}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, { photoURL: url });
      
      setAvatarUrl(url);
      toast.success("تم تحديث صورة الملف الشخصي بنجاح", { icon: '📸' });
    } catch (error) {
      console.error(error);
      toast.error("حدث خطأ أثناء رفع الصورة");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      setSavingProfile(true);
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        name: name,
        username: username
      });
      toast.success("تم تحديث البيانات الشخصية بنجاح", { icon: '✅' });
    } catch (error) {
      console.error(error);
      toast.error("حدث خطأ أثناء تحديث البيانات");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    if (newPassword !== confirmPassword) {
      toast.error("كلمات المرور الجديدة غير متطابقة");
      return;
    }

    try {
      setSavingPassword(true);
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, newPassword);
      
      toast.success("تم تغيير كلمة المرور بنجاح", { icon: '🔐' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error(error);
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        toast.error("كلمة المرور الحالية غير صحيحة");
      } else {
        toast.error("حدث خطأ أثناء تغيير كلمة المرور");
      }
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-20 space-y-10 animate-in fade-in duration-700">
      
      {/* Premium Header / Hero Section */}
      <div className="relative overflow-hidden rounded-[48px] bg-slate-900 text-white p-8 md:p-12 shadow-2xl">
         {/* Background Orbs */}
         <div className="absolute top-0 right-0 w-96 h-96 bg-primary-600/20 blur-[120px] -mr-48 -mt-48"></div>
         <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-600/10 blur-[80px] -ml-32 -mb-32"></div>
         
         <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-12">
            <div className="relative group">
               <motion.div 
                 whileHover={{ scale: 1.05 }}
                 className="w-40 h-40 rounded-[40px] overflow-hidden border-4 border-white/10 p-1.5 bg-gradient-to-tr from-primary-500 to-emerald-500 shadow-2xl"
               >
                 <div className="w-full h-full rounded-[34px] overflow-hidden bg-slate-800 flex items-center justify-center relative">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User size={64} className="text-slate-600" />
                    )}
                    
                    {uploadingAvatar && (
                      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center">
                         <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                 </div>
               </motion.div>
               <label className="absolute -bottom-2 -right-2 p-3 bg-white text-slate-900 rounded-2xl shadow-xl cursor-pointer hover:bg-primary-500 hover:text-white transition-all transform hover:scale-110 active:scale-95">
                  <Camera size={20} />
                  <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} disabled={uploadingAvatar} />
               </label>
            </div>

            <div className="text-center md:text-right flex-1">
               <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
                  <h1 className="text-4xl md:text-5xl font-display font-black tracking-tight">{userData?.name || 'مستكشف النظام'}</h1>
                  <div className="px-4 py-1.5 bg-white/10 backdrop-blur-md border border-white/10 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2">
                     <Shield size={14} className="text-emerald-400" />
                     {userData?.role === 'super_admin' ? 'مدير نظام عام' : userData?.role === 'admin' ? 'مدير محطة' : 'مشغل محطة'}
                  </div>
               </div>
               <p className="text-slate-400 font-medium max-w-lg">مرحباً بك في لوحة تحكم حسابك الشخصي. يمكنك تعديل بياناتك وإدارة تفضيلات الأمان الخاصة بك من هنا.</p>
               
               <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-8">
                  <div className="flex items-center gap-3 px-6 py-3 bg-white/5 rounded-2xl border border-white/5">
                     <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center text-primary-400">
                        <Activity size={20} />
                     </div>
                     <div>
                        <p className="text-[10px] font-black uppercase opacity-40">التقارير</p>
                        <p className="text-lg font-black">{stats.reportsCount}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-3 px-6 py-3 bg-white/5 rounded-2xl border border-white/5">
                     <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
                        <Zap size={20} />
                     </div>
                     <div>
                        <p className="text-[10px] font-black uppercase opacity-40">سجلات الوقود</p>
                        <p className="text-lg font-black">{stats.fuelCount}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-3 px-6 py-3 bg-white/5 rounded-2xl border border-white/5">
                     <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <Trophy size={20} />
                     </div>
                     <div>
                        <p className="text-[10px] font-black uppercase opacity-40">النشاط</p>
                        <p className="text-lg font-black">{stats.uptime}</p>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-10">
        
        {/* Profile Details Card */}
        <div className="lg:col-span-2 space-y-10">
          <div className="glass-card p-10 border-white/40 dark:border-white/5">
             <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                   <div className="w-14 h-14 bg-primary-500/10 text-primary-600 rounded-2xl flex items-center justify-center">
                      <Edit3 size={28} />
                   </div>
                   <div>
                      <h2 className="text-2xl font-display font-black text-slate-900 dark:text-white">المعلومات الشخصية</h2>
                      <p className="text-sm font-medium text-slate-500 mt-1">قم بتحديث بياناتك لتسهيل التواصل والتعرف عليك</p>
                   </div>
                </div>
                {savingProfile && <div className="flex items-center gap-2 text-xs font-black text-primary-600 animate-pulse"><RefreshCw size={14} className="animate-spin" /> جاري الحفظ...</div>}
             </div>

             <form onSubmit={handleUpdateProfile} className="space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                   <div className="space-y-3">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                         <User size={14} /> الاسم الكامل
                      </label>
                      <input 
                        type="text" 
                        required 
                        value={name} 
                        onChange={e => setName(e.target.value)}
                        className="input-field h-14 bg-slate-50 dark:bg-white/5 border-none font-bold" 
                        placeholder="أدخل اسمك الحقيقي"
                      />
                   </div>
                   <div className="space-y-3">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                         <Fingerprint size={14} /> اسم المستخدم (التقني)
                      </label>
                      <input 
                        type="text" 
                        required 
                        value={username} 
                        onChange={e => setUsername(e.target.value)}
                        className="input-field h-14 bg-slate-50 dark:bg-white/5 border-none font-mono text-left" 
                        dir="ltr"
                        placeholder="username"
                      />
                   </div>
                </div>

                <div className="space-y-3">
                   <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Mail size={14} /> البريد الإلكتروني (غير قابل للتعديل)
                   </label>
                   <div className="relative group">
                      <input 
                        type="email" 
                        disabled 
                        value={currentUser?.email || ''} 
                        className="w-full h-14 bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-500 rounded-2xl px-6 border border-slate-200 dark:border-white/5 text-left font-mono cursor-not-allowed"
                        dir="ltr"
                      />
                      <Lock size={16} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" />
                   </div>
                   <p className="text-[10px] text-slate-400 font-bold mr-2">لأسباب أمنية، يرجى التواصل مع المدير العام لتغيير البريد الإلكتروني.</p>
                </div>

                <div className="pt-6 border-t border-slate-100 dark:border-white/5 flex justify-end">
                   <button 
                     type="submit" 
                     disabled={savingProfile}
                     className="btn-primary px-10 h-14 shadow-xl shadow-primary-500/20"
                   >
                      <Save size={20} /> حفظ التغييرات
                   </button>
                </div>
             </form>
          </div>

          <div className="glass-card p-10 border-white/40 dark:border-white/5 relative overflow-hidden">
             <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-amber-500/5 blur-3xl rounded-full"></div>
             
             <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                   <div className="w-14 h-14 bg-amber-500/10 text-amber-600 rounded-2xl flex items-center justify-center">
                      <Key size={28} />
                   </div>
                   <div>
                      <h2 className="text-2xl font-display font-black text-slate-900 dark:text-white">تغيير كلمة المرور</h2>
                      <p className="text-sm font-medium text-slate-500 mt-1">حافظ على أمان حسابك بكلمة مرور قوية</p>
                   </div>
                </div>
             </div>

             <form onSubmit={handleUpdatePassword} className="space-y-8">
                <div className="space-y-3 max-w-md">
                   <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      كلمة المرور الحالية
                   </label>
                   <input 
                     type="password" 
                     required 
                     value={currentPassword} 
                     onChange={e => setCurrentPassword(e.target.value)}
                     className="input-field h-14 bg-slate-50 dark:bg-white/5 border-none text-left" 
                     dir="ltr"
                   />
                </div>

                <div className="grid md:grid-cols-2 gap-8 pt-6 border-t border-slate-100 dark:border-white/5">
                   <div className="space-y-3">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">كلمة المرور الجديدة</label>
                      <input 
                        type="password" 
                        required 
                        minLength={6} 
                        value={newPassword} 
                        onChange={e => setNewPassword(e.target.value)}
                        className="input-field h-14 bg-slate-50 dark:bg-white/5 border-none text-left" 
                        dir="ltr"
                      />
                   </div>
                   <div className="space-y-3">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">تأكيد كلمة المرور</label>
                      <input 
                        type="password" 
                        required 
                        minLength={6} 
                        value={confirmPassword} 
                        onChange={e => setConfirmPassword(e.target.value)}
                        className="input-field h-14 bg-slate-50 dark:bg-white/5 border-none text-left" 
                        dir="ltr"
                      />
                   </div>
                </div>

                <div className="flex justify-end pt-4">
                   <button 
                     type="submit" 
                     disabled={savingPassword}
                     className="px-10 h-14 bg-slate-900 hover:bg-black text-white font-black rounded-2xl transition-all shadow-xl shadow-slate-900/10 flex items-center gap-2 disabled:opacity-50"
                   >
                      {savingPassword ? <RefreshCw size={20} className="animate-spin" /> : <Shield size={20} />}
                      تحديث كلمة المرور
                   </button>
                </div>
             </form>
          </div>
        </div>

        {/* Right Sidebar: Status & Info */}
        <div className="space-y-8">
           <div className="glass-card p-8 border-white/40 dark:border-white/5">
              <h3 className="text-sm font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2 uppercase tracking-widest">
                 <Shield size={16} className="text-primary-500" /> مستوى الوصول
              </h3>
              
              <div className="space-y-6">
                 {[
                   { label: 'الوصول للتقارير', status: true },
                   { label: 'إدارة الوقود', status: true },
                   { label: 'تعديل الإعدادات', status: userData?.role === 'super_admin' },
                   { label: 'إدارة المستخدمين', status: userData?.role === 'super_admin' },
                 ].map((perm, i) => (
                   <div key={i} className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-600 dark:text-slate-400">{perm.label}</span>
                      {perm.status ? (
                        <div className="p-1 bg-emerald-500/10 text-emerald-500 rounded-lg">
                           <CheckCircle2 size={16} />
                        </div>
                      ) : (
                        <div className="p-1 bg-rose-500/10 text-rose-500 rounded-lg">
                           <Lock size={16} />
                        </div>
                      )}
                   </div>
                 ))}
              </div>

              <div className="mt-10 p-4 bg-primary-500/5 rounded-2xl border border-primary-500/10 text-center">
                 <p className="text-[10px] font-black text-primary-600 uppercase">حالة الحساب</p>
                 <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">نشط بالكامل ✓</p>
              </div>
           </div>

           <div className="glass-card p-8 border-white/40 dark:border-white/5">
              <h3 className="text-sm font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2 uppercase tracking-widest">
                 <History size={16} className="text-emerald-500" /> معلومات العضوية
              </h3>
              <div className="space-y-4">
                 <div className="flex justify-between items-center py-3 border-b border-slate-100 dark:border-white/5">
                    <span className="text-xs font-bold text-slate-400">تاريخ الانضمام</span>
                    <span className="text-xs font-black text-slate-700 dark:text-slate-300">{userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString('ar-EG') : '2024/05/14'}</span>
                 </div>
                 <div className="flex justify-between items-center py-3">
                    <span className="text-xs font-bold text-slate-400">معرف الموظف</span>
                    <span className="text-xs font-black text-slate-700 dark:text-slate-300 font-mono">#{currentUser?.uid?.slice(0, 8).toUpperCase()}</span>
                 </div>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;
