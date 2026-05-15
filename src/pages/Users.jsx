import { useState, useEffect } from 'react';
import { 
  Users as UsersIcon, Shield, Trash2, X, Mail, Search, Filter,
  ShieldCheck, UserPlus, Key, UserCog, Activity, Star
} from 'lucide-react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { logAction } from '../utils/logger';
import ConfirmDialog from '../components/ConfirmDialog';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingScreen from '../components/LoadingScreen';

// Secondary Firebase app for user creation (to avoid logging out current user)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const UserAvatar = ({ name, role, colorIndex = 0 }) => {
  const colors = ['bg-primary-500', 'bg-emerald-500', 'bg-blue-500', 'bg-indigo-500', 'bg-cyan-500', 'bg-teal-500'];
  const initials = name ? name.split(' ').map(n => n[0]).join('').substring(0, 2) : '?';
  
  return (
    <div className="relative group/avatar">
      <div className={`w-14 h-14 rounded-[20px] ${colors[colorIndex % colors.length]} flex items-center justify-center text-white font-display font-black text-lg shadow-xl group-hover/avatar:scale-105 transition-transform duration-300`}>
        {initials}
      </div>
      {role === 'Super Admin' && (
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-amber-500 rounded-lg flex items-center justify-center text-white border-2 border-white dark:border-slate-900 shadow-lg">
          <Star size={12} fill="currentColor" />
        </div>
      )}
    </div>
  );
};

const Users = () => {
  const { currentUser, userData: activeUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, user: null });
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'Viewer',
    status: 'نشط'
  });

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersData);
      setLoading(false);
    }, (error) => {
      console.error(error);
      toast.error('فشل في جلب قائمة المستخدمين');
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleOpenModal = (user = null) => {
    if (user) {
      setIsEditMode(true);
      setSelectedUser(user);
      setFormData({
        name: user.name || '',
        username: user.username || '',
        email: user.email || '',
        password: '',
        role: user.role || 'Viewer',
        status: user.status || 'نشط'
      });
    } else {
      setIsEditMode(false);
      setSelectedUser(null);
      setFormData({ name: '', username: '', email: '', password: '', role: 'Viewer', status: 'نشط' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const toastId = toast.loading(isEditMode ? 'جاري التحديث...' : 'جاري إنشاء الحساب...');
    
    try {
      if (isEditMode) {
        await setDoc(doc(db, 'users', selectedUser.id), {
          name: formData.name,
          username: formData.username,
          role: formData.role,
          status: formData.status,
          email: formData.email
        }, { merge: true });
        await logAction('تعديل مستخدم', `تعديل صلاحيات: ${formData.name}`, activeUser);
        toast.success('تم التحديث بنجاح', { id: toastId });
      } else {
        if (!formData.password || formData.password.length < 6) {
          toast.error('كلمة المرور ضعيفة (6 أحرف كحد أدنى)', { id: toastId });
          return;
        }
        const secondaryApp = initializeApp(firebaseConfig, "SecondaryApp" + Date.now());
        const secondaryAuth = getAuth(secondaryApp);
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, formData.email, formData.password);
        const newUserId = userCredential.user.uid;
        await signOut(secondaryAuth);
        
        await setDoc(doc(db, 'users', newUserId), {
          name: formData.name,
          username: formData.username,
          email: formData.email,
          role: formData.role,
          status: formData.status,
          createdAt: serverTimestamp()
        });
        await logAction('إضافة مستخدم', `إنشاء حساب: ${formData.name}`, activeUser);
        toast.success('تم إنشاء الحساب بنجاح', { id: toastId });
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
      toast.error(error.code === 'auth/email-already-in-use' ? 'البريد مسجل بالفعل' : 'فشل في حفظ البيانات', { id: toastId });
    }
  };

  const handleDelete = async (user) => {
    if (user.id === currentUser?.uid) return toast.error('لا يمكن حذف حسابك!');
    const toastId = toast.loading('جاري الحذف...');
    try {
      await deleteDoc(doc(db, 'users', user.id));
      await logAction('حذف مستخدم', `حذف حساب: ${user.name}`, activeUser);
      toast.success('تم الحذف نهائياً', { id: toastId });
      setConfirmDelete({ isOpen: false, user: null });
    } catch {
      toast.error('خطأ في الحذف', { id: toastId });
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <LoadingScreen />;

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
           <div className="flex items-center gap-2 mb-3">
              <div className="px-3 py-1 bg-primary-500/10 dark:bg-primary-400/10 text-primary-600 dark:text-primary-400 rounded-full border border-primary-600/20 flex items-center gap-2">
                 <ShieldCheck size={14} />
                 <span className="text-[10px] font-black uppercase tracking-widest">إدارة الوصول والأمن</span>
              </div>
           </div>
           <h1 className="text-4xl md:text-5xl font-display font-black tracking-tight text-slate-900 dark:text-white leading-tight">
             هيكل <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-emerald-600">الفريق الإداري</span>
           </h1>
           <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium max-w-xl">إدارة الحسابات، توزيع الصلاحيات، ومراقبة نشاط المستخدمين داخل النظام الرقمي.</p>
        </div>
        
        <button 
          onClick={() => handleOpenModal()} 
          className="flex items-center gap-3 px-8 py-4 bg-slate-900 dark:bg-primary-600 hover:bg-slate-800 dark:hover:bg-primary-700 text-white rounded-2xl font-black shadow-2xl transition-all hover:scale-[1.03] active:scale-95 group"
        >
          <UserPlus size={22} className="group-hover:rotate-12 transition-transform" /> 
          إضافة عضو جديد
        </button>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="p-8 glass-card border-white/40 dark:border-white/5 flex items-center justify-between">
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">إجمالي المستخدمين</p>
               <h3 className="text-4xl font-display font-black text-primary-600 leading-none">{users.length}</h3>
            </div>
            <div className="w-14 h-14 bg-primary-500/10 text-primary-600 rounded-2xl flex items-center justify-center"><UsersIcon size={28} /></div>
         </div>
         <div className="p-8 glass-card border-white/40 dark:border-white/5 flex items-center justify-between">
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">المسؤولين (Admins)</p>
               <h3 className="text-4xl font-display font-black text-emerald-600 leading-none">{users.filter(u => u.role.includes('Admin')).length}</h3>
            </div>
            <div className="w-14 h-14 bg-emerald-500/10 text-emerald-600 rounded-2xl flex items-center justify-center"><ShieldCheck size={28} /></div>
         </div>
         <div className="p-8 glass-card border-white/40 dark:border-white/5 flex items-center justify-between">
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">نشاط النظام</p>
               <h3 className="text-xl font-display font-black text-slate-900 dark:text-white leading-none">Healthy</h3>
            </div>
            <div className="w-14 h-14 bg-slate-100 dark:bg-white/5 text-slate-400 rounded-2xl flex items-center justify-center animate-pulse"><Activity size={28} /></div>
         </div>
      </div>

      {/* Control Bar */}
      <div className="glass-card p-4 border-white/40 dark:border-white/5 flex flex-col md:flex-row items-center gap-4">
         <div className="flex-1 relative group w-full">
            <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={20} />
            <input 
              type="text" placeholder="ابحث بالاسم، البريد، أو اسم المستخدم الميداني..." 
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-14 bg-slate-50 dark:bg-white/[0.03] border-none pr-14 rounded-2xl text-sm font-bold placeholder:text-slate-400"
            />
         </div>
         <button className="h-14 px-6 bg-slate-100 dark:bg-white/5 text-slate-500 rounded-2xl hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"><Filter size={20} /></button>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user, idx) => (
              <motion.div 
                layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                key={user.id} 
                className="glass-card p-8 border-white/40 dark:border-white/5 hover:shadow-2xl hover:shadow-primary-500/5 transition-all group relative overflow-hidden"
              >
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 blur-3xl -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div className="flex flex-col items-center text-center">
                  <UserAvatar name={user.name} role={user.role} colorIndex={idx} />
                  <div className="mt-6 space-y-1">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight">{user.name}</h3>
                    <p className="text-xs font-bold text-slate-400" dir="ltr">{user.email}</p>
                  </div>

                  <div className="mt-6 flex items-center gap-2">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                      user.role === 'Super Admin' ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20' :
                      user.role === 'Admin' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' :
                      'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20'
                    }`}>
                      {user.role === 'Super Admin' ? 'مدير عام النظام' : user.role === 'Admin' ? 'مشرف ميداني' : 'مراقب بيانات'}
                    </span>
                    <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter border ${
                      user.status === 'نشط' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                    }`}>
                      {user.status || 'نشط'}
                    </span>
                  </div>

                  <div className="mt-8 pt-8 border-t border-slate-100 dark:border-white/5 w-full flex items-center justify-center gap-4">
                    <button 
                      onClick={() => handleOpenModal(user)}
                      className="w-12 h-12 rounded-2xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 flex items-center justify-center text-slate-400 hover:text-primary-600 hover:border-primary-500 hover:shadow-lg transition-all active:scale-95"
                    >
                      <UserCog size={20} />
                    </button>
                    <button 
                      onClick={() => setConfirmDelete({ isOpen: true, user: user })}
                      disabled={user.id === currentUser?.uid}
                      className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-all ${
                        user.id === currentUser?.uid 
                          ? 'bg-slate-50 dark:bg-white/5 text-slate-200 border-slate-100 dark:border-white/5 cursor-not-allowed' 
                          : 'bg-white dark:bg-white/5 border-slate-100 dark:border-white/10 text-slate-400 hover:text-rose-600 hover:border-rose-500 hover:shadow-lg active:scale-95'
                      }`}
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-24 flex flex-col items-center justify-center opacity-40 grayscale">
              <UsersIcon size={80} className="mb-6 stroke-1" />
              <p className="text-2xl font-black uppercase tracking-widest">No Members Found</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Sophisticated User Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={() => setIsModalOpen(false)} />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl w-full max-w-2xl overflow-hidden relative z-10 border border-white/20"
            >
              <div className="p-10 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-display font-black text-slate-900 dark:text-white leading-tight">
                    {isEditMode ? 'إدارة بيانات العضو' : 'استقطاب عضو جديد'}
                  </h2>
                  <p className="text-xs font-black text-primary-500 mt-2 uppercase tracking-widest flex items-center gap-2">
                    <Shield size={14} /> تعريف الهوية الرقمية والصلاحيات
                  </p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 flex items-center justify-center bg-slate-100 dark:bg-white/5 rounded-2xl text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"><X size={24} /></button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-10 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">الاسم الرسمي الكامل</label>
                    <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full h-14 px-6 bg-slate-50 dark:bg-white/[0.03] border-none rounded-2xl text-base font-bold outline-none focus:ring-2 focus:ring-primary-500/20" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">اسم المستخدم الميداني</label>
                    <input type="text" required value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} className="w-full h-14 px-6 bg-slate-50 dark:bg-white/[0.03] border-none rounded-2xl text-base font-bold outline-none focus:ring-2 focus:ring-primary-500/20 text-center" dir="ltr" />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">البريد الإلكتروني للعمل</label>
                  <div className="relative group">
                    <input type="email" required disabled={isEditMode} value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full h-14 px-6 bg-slate-50 dark:bg-white/[0.03] border-none rounded-2xl text-base font-bold outline-none focus:ring-2 focus:ring-primary-500/20 disabled:opacity-40" dir="ltr" />
                    <Mail className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                  </div>
                </div>

                {!isEditMode && (
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">كلمة المرور المؤقتة</label>
                    <div className="relative group">
                      <input type="password" required value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full h-14 px-6 bg-slate-900 dark:bg-white/[0.05] border-none rounded-2xl text-xl font-black outline-none focus:ring-2 focus:ring-primary-500/20 text-center tracking-[0.5em] text-primary-500" dir="ltr" />
                      <Key className="absolute right-5 top-1/2 -translate-y-1/2 text-primary-500" size={20} />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">مستوى الوصول</label>
                    <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} className="w-full h-14 px-6 bg-slate-50 dark:bg-white/[0.03] border-none rounded-2xl text-base font-bold outline-none cursor-pointer">
                      <option value="Viewer">مراقب (View Only)</option>
                      <option value="Admin">مشرف (Edit & Log)</option>
                      <option value="Super Admin">مدير (Full Access)</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">حالة الحساب</label>
                    <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full h-14 px-6 bg-slate-50 dark:bg-white/[0.03] border-none rounded-2xl text-base font-bold outline-none cursor-pointer">
                      <option value="نشط">نشط - Active</option>
                      <option value="معطل">معطل - Suspended</option>
                    </select>
                  </div>
                </div>

                <div className="pt-8 flex gap-6">
                   <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 h-14 rounded-[20px] font-black text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all">إلغاء</button>
                   <button type="submit" className="flex-1 h-14 bg-primary-600 hover:bg-primary-700 text-white font-black rounded-[20px] shadow-xl shadow-primary-600/20 transition-all hover:scale-[1.02] active:scale-95">
                     {isEditMode ? 'تحديث المعلومات' : 'تفعيل الحساب'}
                   </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, user: null })}
        onConfirm={() => handleDelete(confirmDelete.user)}
        title="بتر الصلاحية"
        message={`تحذير: أنت على وشك حذف حساب (${confirmDelete.user?.name}) نهائياً. سيتم فقدان الوصول لهذا المستخدم فوراً. هل تريد المتابعة؟`}
        type="danger"
        confirmText="نعم، احذف نهائياً"
        cancelText="تراجع"
      />
    </div>
  );
};

export default Users;
