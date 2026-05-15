import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { db } from '../firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { 
  LayoutDashboard, 
  FileText, 
  Archive, 
  Fuel, 
  Download, 
  Users as UsersIcon, 
  Settings, 
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  Droplets,
  RefreshCw,
  History,
  User,
  ChevronLeft,
  Search,
  Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Layout = () => {
  const { logout, userData, isAdmin, isSuperAdmin } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const handleHardRefresh = () => {
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }
    window.location.reload();
  };

  const allNavItems = [
    { name: 'لوحة المؤشرات', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'إضافة تقرير', path: '/add-report', icon: <FileText size={20} /> },
    { name: 'أرشيف التقارير', path: '/archive', icon: <Archive size={20} /> },
    { name: 'إضافة وقود', path: '/add-fuel', icon: <Fuel size={20} /> },
    { name: 'سجل الوقود', path: '/fuel-archive', icon: <Fuel size={20} className="opacity-70" /> },
    { name: 'مركز التصدير', path: '/export', icon: <Download size={20} /> },
    { name: 'المستخدمون', path: '/users', icon: <UsersIcon size={20} />, requireSuperAdmin: true },
    { name: 'سجل الحركات', path: '/logs', icon: <History size={20} />, requireSuperAdmin: true },
    { name: 'الإعدادات', path: '/settings', icon: <Settings size={20} />, requireAdmin: true },
  ];

  const navItems = allNavItems.filter(item => {
    if (item.requireSuperAdmin && !isSuperAdmin) return false;
    if (item.requireAdmin && !isAdmin) return false;
    return true;
  });

  const fetchAlerts = async () => {
    try {
      const reportsRef = collection(db, 'reports');
      const q = query(reportsRef, orderBy('date', 'desc'), limit(10));
      const snap = await getDocs(q);
      const reports = snap.docs.map(doc => doc.data());
      
      const newAlerts = [];
      if (reports.length > 0) {
        const latest = reports[0];
        if (Number(latest.currentFuelBalance) < 300) {
          newAlerts.push({ id: 1, title: 'نقص وقود', message: 'رصيد الوقود الحالي منخفض جداً', time: 'الآن', type: 'fuel' });
        }
        if (Number(latest.wastePercentage) > 5) {
          newAlerts.push({ id: 2, title: 'فاقد مرتفع', message: 'تم رصد نسبة فاقد غير طبيعية في آخر تقرير', time: 'اليوم', type: 'waste' });
        }
      }
      setNotifications(newAlerts);
    } catch (err) {
      console.error(err);
    }
  };

  React.useEffect(() => {
    if (showNotifications) fetchAlerts();
  }, [showNotifications]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc] dark:bg-[#020617] text-slate-800 dark:text-slate-200 transition-colors duration-500">
      
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-500/5 dark:bg-primary-500/10 blur-[100px] rounded-full -mr-64 -mt-64 animate-pulse-slow"></div>
         <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/5 dark:bg-emerald-500/10 blur-[100px] rounded-full -ml-48 -mb-48 animate-pulse-slow"></div>
      </div>

      {/* Premium Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-80 m-6 mr-0 z-10 shrink-0">
        <div className="glass-card h-full flex flex-col p-6 border-white/40 dark:border-white/5 relative overflow-hidden group shadow-2xl shadow-slate-200/50 dark:shadow-none">
          {/* Logo Section */}
          <div className="flex items-center gap-4 mb-10 px-2">
            <motion.div 
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.8, ease: "anticipate" }}
              className="p-3.5 bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl text-white shadow-xl shadow-primary-500/30"
            >
              <Droplets size={26} />
            </motion.div>
            <div>
              <h1 className="font-display font-black text-xl tracking-tight text-slate-900 dark:text-white leading-tight">Sapphire <span className="text-primary-600">&</span> Emerald</h1>
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-md">V 2.0 Premium</span>
            </div>
          </div>

          {/* User Profile Quick View */}
          <NavLink to="/profile" className="mb-8 p-4 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/5 flex items-center gap-4 hover:bg-slate-100 dark:hover:bg-white/10 transition-all group">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-white dark:border-slate-800 shadow-md">
                 {userData?.photoURL ? (
                    <img src={userData.photoURL} className="w-full h-full object-cover" alt="User" />
                 ) : (
                    <div className="w-full h-full bg-primary-500 flex items-center justify-center text-white font-black text-lg">
                       {userData?.name?.charAt(0)}
                    </div>
                 )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full animate-pulse"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-slate-900 dark:text-white truncate group-hover:text-primary-600 transition-colors">{userData?.name || 'مستخدم'}</p>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">{userData?.role || 'مشاهد'}</p>
            </div>
          </NavLink>

          {/* Navigation Links */}
          <nav className="flex-1 space-y-1.5 overflow-y-auto pr-1 custom-scrollbar">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 text-sm font-bold group relative ${
                    isActive 
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl shadow-slate-900/10 dark:shadow-white/10' 
                      : 'hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400 hover:translate-x-1'
                  }`}
                >
                  <div className={`${isActive ? 'text-primary-400 dark:text-primary-600' : 'text-slate-400 group-hover:text-primary-500'} transition-colors duration-300`}>
                    {item.icon}
                  </div>
                  <span className="flex-1">{item.name}</span>
                  {isActive && (
                    <motion.div 
                      layoutId="active-nav"
                      className="absolute right-2 w-1.5 h-1.5 bg-primary-500 rounded-full"
                    />
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Sidebar Footer Action Buttons */}
          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-white/5 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={toggleTheme}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-3xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 transition-all active:scale-95 border border-slate-100 dark:border-white/5 group"
              >
                {darkMode ? <Sun size={18} className="group-hover:rotate-45 transition-transform" /> : <Moon size={18} className="group-hover:-rotate-12 transition-transform" />}
                <span className="text-[10px] font-black uppercase tracking-widest">{darkMode ? 'Light' : 'Dark'}</span>
              </button>
              <button 
                onClick={handleHardRefresh}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-3xl bg-amber-50 dark:bg-amber-500/5 hover:bg-amber-100 dark:hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 transition-all active:scale-95 border border-amber-200/20 group"
              >
                <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-500" />
                <span className="text-[10px] font-black uppercase tracking-widest">Refresh</span>
              </button>
            </div>
            
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-3 px-4 py-4 rounded-3xl bg-rose-500/5 hover:bg-rose-500 text-rose-600 hover:text-white transition-all duration-300 font-black text-sm group shadow-sm hover:shadow-rose-500/30"
            >
              <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
              <span>خروج آمن من النظام</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
        
        {/* Top Navigation Bar - Desktop Only */}
        <header className="hidden lg:flex items-center justify-between h-24 px-10 shrink-0">
           <div className="flex items-center gap-8">
              <div className="relative group">
                 <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={18} />
                 <input 
                   type="text" 
                   placeholder="البحث السريع في التقارير..." 
                   className="w-80 h-12 bg-white/40 dark:bg-white/5 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl pr-12 pl-6 text-sm font-bold focus:ring-2 focus:ring-primary-500/20 transition-all"
                 />
              </div>
           </div>

           <div className="flex items-center gap-4">
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`p-3 bg-white/40 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl transition-all relative ${showNotifications ? 'text-primary-600 ring-4 ring-primary-500/10' : 'text-slate-500 hover:text-primary-600'}`}
                >
                   <Bell size={20} />
                   {notifications.length > 0 && (
                     <span className="absolute top-3 right-3 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900"></span>
                   )}
                </button>

                <AnimatePresence>
                  {showNotifications && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)}></div>
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute left-0 mt-4 w-80 glass-card p-4 z-50 shadow-2xl border border-white/40 dark:border-white/10 overflow-hidden"
                      >
                         <div className="flex items-center justify-between mb-4 px-2">
                            <h3 className="font-black text-sm uppercase tracking-widest">تنبيهات النظام</h3>
                            <span className="text-[10px] font-bold text-slate-400">{notifications.length} تنبيه</span>
                         </div>
                         <div className="space-y-2">
                            {notifications.length === 0 ? (
                              <div className="p-8 text-center space-y-3">
                                 <div className="w-12 h-12 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto text-slate-300"><Bell size={24} /></div>
                                 <p className="text-xs text-slate-400 font-bold">لا يوجد تنبيهات جديدة حالياً</p>
                              </div>
                            ) : (
                              notifications.map(n => (
                                <div key={n.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 flex gap-4 hover:bg-slate-100 dark:hover:bg-white/10 transition-all cursor-pointer">
                                   <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${n.type === 'fuel' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                      {n.type === 'fuel' ? <Fuel size={18} /> : <RefreshCw size={18} />}
                                   </div>
                                   <div className="flex-1 text-right">
                                      <p className="text-[10px] font-black uppercase tracking-tighter mb-1">{n.title}</p>
                                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-tight">{n.message}</p>
                                   </div>
                                </div>
                              ))
                            )}
                         </div>
                         <button className="w-full mt-4 py-3 text-[10px] font-black text-primary-500 uppercase tracking-widest hover:bg-primary-500/5 rounded-xl transition-all">مشاهدة جميع السجلات</button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
              
              <div className="h-10 w-[1px] bg-slate-200 dark:bg-white/10 mx-2"></div>
              
              <div className="flex items-center gap-3 px-4 py-2 bg-white/40 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl">
                 <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary-500 to-emerald-500 flex items-center justify-center text-white text-xs font-black">
                    {userData?.name?.charAt(0)}
                 </div>
                 <div className="text-right">
                    <p className="text-xs font-black text-slate-900 dark:text-white leading-none">{userData?.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">On-Duty</p>
                 </div>
              </div>
           </div>
        </header>

        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-6 z-20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-900 dark:bg-white rounded-2xl text-white dark:text-slate-900 shadow-xl">
              <Droplets size={22} />
            </div>
            <h1 className="font-display font-black text-xl tracking-tight">System</h1>
          </div>
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-3 bg-white dark:bg-white/5 shadow-lg dark:shadow-none border border-slate-100 dark:border-white/10 rounded-2xl transition-all active:scale-95"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </header>

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="lg:hidden absolute top-24 left-6 right-6 glass-card p-6 z-30 shadow-2xl border border-white/40 dark:border-white/10"
            >
              <nav className="space-y-1.5 mb-8">
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-4 px-5 py-4 rounded-3xl transition-all ${
                        isActive 
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl' 
                          : 'hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300'
                      }`
                    }
                  >
                    {item.icon}
                    <span className="font-black text-sm">{item.name}</span>
                  </NavLink>
                ))}
              </nav>
              
              <div className="grid grid-cols-2 gap-4">
                 <button onClick={toggleTheme} className="flex items-center justify-center gap-3 py-4 bg-slate-50 dark:bg-white/5 rounded-3xl font-black text-xs uppercase tracking-widest">
                    {darkMode ? <Sun size={18} /> : <Moon size={18} />} {darkMode ? 'Light' : 'Dark'}
                 </button>
                 <button onClick={handleLogout} className="flex items-center justify-center gap-3 py-4 bg-rose-500 text-white rounded-3xl font-black text-xs uppercase tracking-widest">
                    <LogOut size={18} /> Logout
                 </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main scrollable content area */}
        <main className="flex-1 overflow-y-auto px-6 lg:px-10 pb-24 lg:pb-10 custom-scrollbar relative">
           <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="h-full"
              >
                <Outlet />
              </motion.div>
           </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default Layout;
