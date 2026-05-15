import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { Link, useNavigate } from 'react-router-dom';
import {
  Fuel,
  Droplets,
  Plus,
  Zap,
  TrendingUp,
  TrendingDown,
  FileText,
  ChevronLeft,
  Layers,
  Sparkles,
  ArrowRight,
  History,
  Settings,
  Package,
  User,
  ShieldCheck,
  MessageCircle,
  MapPin
} from 'lucide-react';
import { collection, getDocs, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { motion } from 'framer-motion';
import DashboardSkeleton from '../components/DashboardSkeleton';
import { generateWhatsAppMessage } from '../utils/exportUtils';
import { Wrench, ShieldAlert, Cpu } from 'lucide-react';

const StatCard = ({ title, value, icon, colorClass, trend, subtext, link, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className="relative group"
  >
    <Link 
      to={link || "#"} 
      className={`block glass-card p-8 border-white/40 dark:border-white/5 relative overflow-hidden h-full shadow-2xl shadow-slate-200/50 dark:shadow-none transition-all duration-500 hover:-translate-y-2`}
    >
      {/* Dynamic Background Glow */}
      <div className={`absolute -top-10 -right-10 w-32 h-32 blur-[80px] opacity-0 group-hover:opacity-30 transition-opacity duration-700 rounded-full ${colorClass.split(' ')[0]}`}></div>
      
      <div className="flex justify-between items-start relative z-10">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
             <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse"></span>
             <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{title}</p>
          </div>
          <h3 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white group-hover:text-primary-600 transition-colors">{value}</h3>
          {subtext && (
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 dark:bg-white/5 rounded-full border border-slate-100 dark:border-white/5 w-fit">
               <Layers size={12} className="text-slate-400" />
               <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{subtext}</p>
            </div>
          )}
        </div>
        <div className={`p-5 rounded-[24px] ${colorClass} shadow-xl shadow-current/10 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
          {React.cloneElement(icon, { size: 28, strokeWidth: 2.5 })}
        </div>
      </div>
      
      {trend !== undefined && (
        <div className="mt-8 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-black px-3 py-1 rounded-full flex items-center gap-1.5 ${Number(trend) >= 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
              {Number(trend) >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {Math.abs(trend)}%
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">vs أمس</span>
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center gap-1 text-[10px] font-black text-primary-600">
             تفاصيل <ArrowRight size={12} />
          </div>
        </div>
      )}
    </Link>
  </motion.div>
);

const Dashboard = () => {
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalReports: 0,
    totalHours: 0,
    currentFuel: 0,
    totalWater: 0,
    totalFuelConsumed: 0,
    totalBottled: 0,
    prodTrend: 0,
    hoursTrend: 0,
    fuelTrend: 0,
  });
  const [chartData, setChartData] = useState([]);
  const [distributionData, setDistributionData] = useState([]);
  const [operationalAlerts, setOperationalAlerts] = useState([]);
  const [latestReport, setLatestReport] = useState(null);
  const [recentReports, setRecentReports] = useState([]);
  const [sysSettings, setSysSettings] = useState({
    maintenanceInterval: 250,
    fuelAlertThreshold: 300,
    whatsappNumber: '972599876261'
  });
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState('all');
  const [activeChartTab, setActiveChartTab] = useState('Production');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch System Settings
      const settingsRef = doc(db, 'system', 'settings');
      const settingsSnap = await getDoc(settingsRef);
      const settings = settingsSnap.exists() ? settingsSnap.data() : sysSettings;
      setSysSettings(settings);

      // Fetch Stations
      const stationsSnap = await getDocs(query(collection(db, 'stations'), orderBy('name')));
      const stationsList = stationsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStations(stationsList);

      const reportsRef = collection(db, 'reports');
      const q = query(reportsRef, orderBy('date', 'desc'));
      const querySnapshot = await getDocs(q);

      let reports = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (selectedStation === 'all' || data.station === selectedStation) {
          reports.push({ id: doc.id, ...data });
        }
      });

      if (reports.length === 0) {
        setLoading(false);
        return;
      }

      setRecentReports(reports.slice(0, 5));
      const latest = reports[0];
      const previous = reports[1] || latest;

      const parseTime = (timeStr) => {
        if (!timeStr || typeof timeStr !== 'string' || !timeStr.includes(':')) return 0;
        const [h, m] = timeStr.split(':').map(Number);
        return (isNaN(h) ? 0 : h) + (isNaN(m) ? 0 : m / 60);
      };

      const getProd = (r) => Number(r.dailyProduction || 0);
      
      const getHours = (r) => {
        const val = r.operatingHours || 0;
        return typeof val === 'string' ? parseTime(val) : Number(val);
      };
      const getFuel = (r) => Number(r.currentFuelBalance || 0);

      const totalWater = reports.reduce((acc, r) => acc + getProd(r), 0);
      const totalHours = Number(reports.reduce((acc, r) => acc + getHours(r), 0)).toFixed(1);
      const totalFuelConsumed = reports.reduce((acc, r) => acc + Number(r.fuelConsumed || 0), 0);
      const totalBottled = reports.reduce((acc, r) => acc + Number(r.bottledWater || 0), 0);

      const latestProd = getProd(latest);
      const prevProd = getProd(previous);
      const prodTrend = prevProd ? (((latestProd - prevProd) / prevProd) * 100).toFixed(1) : 0;

      const latestHours = getHours(latest);
      const prevHours = getHours(previous);
      const hoursTrend = prevHours ? (((latestHours - prevHours) / prevHours) * 100).toFixed(1) : 0;

      const currentFuel = getFuel(latest);
      const prevFuel = getFuel(previous);
      const fuelTrend = prevFuel ? (((currentFuel - prevFuel) / prevFuel) * 100).toFixed(1) : 0;

      const distributionMap = {};
      reports.forEach(r => {
        if (r.entities && Array.isArray(r.entities)) {
          r.entities.forEach(e => {
            const name = e.name || 'غير محدد';
            const qty = Number(e.quantity || 0);
            distributionMap[name] = (distributionMap[name] || 0) + qty;
          });
        }
      });

      const distData = Object.keys(distributionMap).map(name => ({
        name,
        value: distributionMap[name]
      })).sort((a, b) => b.value - a.value).slice(0, 6);

      setDistributionData(distData);

      setStats({
        totalReports: reports.length,
        totalHours,
        currentFuel,
        totalWater,
        totalFuelConsumed,
        totalBottled,
        prodTrend,
        hoursTrend,
        fuelTrend,
      });

      const weeklyData = reports
        .slice(0, 7)
        .reverse()
        .map((r) => ({
          date: format(new Date(r.date || 0), 'dd/MM'),
          production: getProd(r),
          hours: getHours(r),
        }));
      setChartData(weeklyData);
      setLatestReport(reports[0]);

      // Smart Alerts & Proactive Maintenance
      const genHoursSinceLastService = totalHours; // Logic simplified for example
      const alerts = [];
      if (genHoursSinceLastService >= settings.maintenanceInterval) {
        alerts.push({
          type: 'warning',
          icon: <Wrench size={18} />,
          text: `المولد تجاوز ${settings.maintenanceInterval} ساعة عمل. يرجى جدولة صيانة دورية فوراً.`
        });
      }

      if (currentFuel < (settings.fuelAlertThreshold || 300)) {
        alerts.push({
          type: 'danger',
          icon: <ShieldAlert size={18} />,
          text: `رصيد الوقود حرج (${currentFuel} لتر). يرجى التزود بالديزل لتجنب توقف المحطة.`
        });
      }
      if (totalWater / (totalHours || 1) < 25) {
        alerts.push({ 
          type: 'info', 
          icon: <Cpu size={16} />, 
          text: 'معدل الإنتاج منخفض مقارنة بساعات التشغيل، قد تحتاج الفلاتر إلى تنظيف.' 
        });
      }
      setOperationalAlerts(alerts);
    } catch (error) {
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedStation]);

  const handleAutoReport = () => {
    if (!latestReport) {
      toast.error('لا توجد بيانات لآخر تقرير');
      return;
    }
    const msg = generateWhatsAppMessage(latestReport);
    window.open(`https://wa.me/${sysSettings.whatsappNumber}?text=${msg}`, '_blank');
  };

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-12 pb-20 overflow-hidden">
      
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-8"
      >
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
             <div className="w-12 h-12 bg-primary-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-primary-500/30">
                <Sparkles size={24} />
             </div>
             <div className="flex flex-col">
                <span className="text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest">مرحبا بك في Sapphire</span>
                <span className="text-xs font-bold text-slate-400">{format(new Date(), 'EEEE، dd MMMM yyyy', { locale: arSA })}</span>
             </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-slate-900 dark:text-white leading-tight">
            لوحة <span className="text-primary-600">البيانات</span> الذكية
          </h1>
        </div>
        
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative group">
            <select 
              value={selectedStation} 
              onChange={(e) => setSelectedStation(e.target.value)}
              className="pl-12 pr-6 py-5 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-[28px] font-black text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 transition-all appearance-none cursor-pointer min-w-[220px] shadow-sm"
            >
              <option value="all">جميع المحطات</option>
              {stations.map(s => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-primary-500 transition-colors pointer-events-none">
              <MapPin size={18} />
            </div>
          </div>

          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAutoReport}
            className="px-8 py-5 bg-emerald-500 text-white font-black rounded-[28px] shadow-2xl shadow-emerald-500/20 flex items-center justify-center gap-3"
          >
            <MessageCircle size={22} /> 
            <span>تقرير واتساب سريع</span>
          </motion.button>

          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/add-report')} 
            className="px-10 py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-[28px] shadow-2xl shadow-slate-900/20 flex items-center justify-center gap-3"
          >
            <Plus size={22} /> 
            <span>إضافة تقرير تشغيل</span>
          </motion.button>
        </div>
      </motion.div>

      {operationalAlerts.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {operationalAlerts.map((alert, idx) => (
            <div key={idx} className={`p-4 rounded-3xl border flex items-center gap-4 ${
              alert.type === 'danger' ? 'bg-rose-500/10 border-rose-500/20 text-rose-600' :
              alert.type === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-600' :
              'bg-primary-500/10 border-primary-500/20 text-primary-600'
            }`}>
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                alert.type === 'danger' ? 'bg-rose-500/20' :
                alert.type === 'warning' ? 'bg-amber-500/20' :
                'bg-primary-500/20'
              }`}>
                {alert.icon}
              </div>
              <p className="text-xs font-black leading-relaxed">{alert.text}</p>
            </div>
          ))}
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <StatCard 
          title="إنتاج المياه" 
          value={`${stats.totalWater.toLocaleString()} كوب`}
          icon={<Droplets />} 
          colorClass="bg-blue-500/10 text-blue-500" 
          trend={stats.prodTrend} 
          subtext="الإنتاج التراكمي الكلي" 
          link="/archive"
          delay={0.1}
        />
        <StatCard 
          title="ساعات التشغيل" 
          value={`${stats.totalHours} ساعة`}
          icon={<Zap />} 
          colorClass="bg-amber-500/10 text-amber-500" 
          trend={stats.hoursTrend} 
          subtext="إجمالي ساعات العمل" 
          link="/archive"
          delay={0.2}
        />
        <StatCard 
          title="رصيد الديزل" 
          value={`${stats.currentFuel.toLocaleString()} لتر`}
          icon={<Fuel />} 
          colorClass="bg-purple-500/10 text-purple-600" 
          trend={stats.fuelTrend} 
          subtext="المخزون المتوفر حالياً"
          link="/fuel-archive"
          delay={0.3}
        />
        <StatCard 
          title="الوقود المستهلك" 
          value={`${stats.totalFuelConsumed.toLocaleString()} لتر`}
          icon={<TrendingDown />} 
          colorClass="bg-rose-500/10 text-rose-600" 
          trend={stats.fuelTrend} 
          subtext="إجمالي استهلاك المحطة"
          link="/archive"
          delay={0.4}
        />
        <StatCard 
          title="المياه المعبأة" 
          value={`${stats.totalBottled.toLocaleString()} كوب`}
          icon={<Package />} 
          colorClass="bg-emerald-500/10 text-emerald-600" 
          subtext="إجمالي المياه الموزعة"
          link="/archive"
          delay={0.5}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="lg:col-span-3 glass-card p-10 border-white/40 dark:border-white/5 relative overflow-hidden group shadow-2xl shadow-slate-200/50 dark:shadow-none"
        >
          <div className="absolute top-0 left-0 w-full h-full opacity-[0.02] dark:opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-12 relative z-10 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                 <TrendingUp size={16} className="text-primary-500" />
                 <h3 className="text-2xl font-black text-slate-900 dark:text-white">تحليل تدفق الإنتاج</h3>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">معدلات الإنتاج اليومي لآخر 7 ورديات عمل</p>
            </div>
            
            <div className="flex items-center gap-4 bg-slate-50 dark:bg-white/5 p-2 rounded-2xl border border-slate-100 dark:border-white/5">
               {['Production', 'Operating Hours'].map((tab) => (
                 <button 
                   key={tab} 
                   onClick={() => setActiveChartTab(tab)}
                   className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeChartTab === tab ? 'bg-white dark:bg-slate-800 text-primary-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                 >
                    {tab === 'Production' ? 'الإنتاج اليومي' : 'ساعات العمل'}
                 </button>
               ))}
            </div>
          </div>
          
          <div className="h-96 w-full relative z-10 min-w-0">
            {chartData && chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorProduction" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorOperating Hours" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="5 5" vertical={false} stroke={darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'} />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }}
                    dy={20}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }}
                  />
                  <Tooltip 
                    cursor={{ stroke: '#2563eb', strokeWidth: 2, strokeDasharray: '8 8' }}
                    contentStyle={{ 
                      borderRadius: '32px', 
                      border: 'none', 
                      boxShadow: '0 40px 60px -15px rgba(0,0,0,0.15)',
                      backgroundColor: darkMode ? '#020617' : '#ffffff',
                      padding: '24px',
                      textAlign: 'right'
                    }}
                    itemStyle={{ fontWeight: 'black', fontSize: '16px', color: '#2563eb' }}
                    labelStyle={{ fontWeight: 'black', marginBottom: '8px', color: darkMode ? '#f8fafc' : '#020617', fontSize: '12px', textTransform: 'uppercase' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey={activeChartTab === 'Production' ? 'production' : 'hours'} 
                    stroke={activeChartTab === 'Production' ? '#2563eb' : '#f59e0b'} 
                    strokeWidth={5}
                    fillOpacity={1} 
                    fill={`url(#color${activeChartTab})`} 
                    animationDuration={2500}
                    animationEasing="ease-in-out"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                <p>لا توجد بيانات للعرض</p>
              </div>
            )}
          </div>

          <div className="mt-12 flex items-center justify-between border-t border-slate-100 dark:border-white/5 pt-8">
             <div className="flex gap-10">
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">متوسط الإنتاج</p>
                   <p className="text-xl font-black text-slate-900 dark:text-white">{(stats.totalWater / (stats.totalReports || 1)).toFixed(0)} <span className="text-xs opacity-40">كوب / يوم</span></p>
                </div>
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">كفاءة الوقود</p>
                   <p className="text-xl font-black text-emerald-600">{(stats.totalWater / (stats.totalHours || 1)).toFixed(1)} <span className="text-xs opacity-60">كوب / ساعة</span></p>
                </div>
             </div>
             <Link to="/archive" className="flex items-center gap-2 text-xs font-black text-primary-600 hover:gap-3 transition-all">
                استكشاف البيانات الكاملة <ArrowRight size={16} />
             </Link>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="lg:col-span-1 glass-card p-8 border-white/40 dark:border-white/5 relative overflow-hidden flex flex-col min-h-[500px]"
        >
          <div className="flex flex-col mb-8">
             <div className="flex items-center gap-2 mb-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">توزيع الاستهلاك</h3>
             </div>
             <p className="text-xs font-bold text-slate-500">حسب الجهات المستفيدة</p>
          </div>

          <div className="flex-1 w-full relative min-h-[300px]">
            {distributionData && distributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {distributionData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={[
                          '#0ea5e9',
                          '#10b981',
                          '#f59e0b',
                          '#8b5cf6',
                          '#f43f5e',
                          '#64748b'
                        ][index % 6]} 
                        stroke="none"
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                      borderRadius: '16px', 
                      border: 'none', 
                      boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                      color: '#fff',
                      fontSize: '12px',
                      fontWeight: '900'
                    }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                <p>لا توجد بيانات للعرض</p>
              </div>
            )}
          </div>

          <div className="mt-auto space-y-3">
             {distributionData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between group">
                   <div className="flex items-center gap-3">
                      <div 
                        className="w-2.5 h-2.5 rounded-full" 
                        style={{ backgroundColor: ['#0ea5e9','#10b981','#f59e0b','#8b5cf6','#f43f5e','#64748b'][idx % 6] }}
                      ></div>
                      <span className="text-[11px] font-black text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{item.name}</span>
                   </div>
                   <span className="text-[11px] font-black text-slate-900 dark:text-white">{item.value.toLocaleString()} <span className="opacity-30 text-[9px]">كوب</span></span>
                </div>
             ))}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
        <div className="lg:col-span-2 space-y-6">
           <div className="flex items-center justify-between px-2">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">آخر التقارير</h3>
              <Link to="/archive" className="text-xs font-black text-slate-400 hover:text-primary-600 transition-colors uppercase tracking-widest">مشاهدة الكل</Link>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {recentReports.slice(0, 4).map((r, idx) => (
                <motion.div 
                  key={r.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + (idx * 0.1) }}
                  onClick={() => navigate('/archive')}
                  className="glass-card p-6 border-white/40 dark:border-white/5 flex items-center gap-5 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer group transition-all"
                >
                  <div className="w-16 h-16 rounded-[22px] bg-slate-100 dark:bg-white/5 flex flex-col items-center justify-center text-slate-400 group-hover:bg-primary-600 group-hover:text-white transition-all overflow-hidden relative">
                     <span className="text-[9px] font-black uppercase tracking-tighter relative z-10">{format(new Date(r.date || 0), 'MMMM', { locale: arSA })}</span>
                     <span className="text-xl font-black relative z-10 leading-none">{format(new Date(r.date || 0), 'dd')}</span>
                     <div className="absolute bottom-0 left-0 w-full h-1 bg-primary-500 opacity-0 group-hover:opacity-100"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-slate-900 dark:text-white truncate">{r.station || 'محطة غير محددة'}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                       <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center">
                          <User size={10} className="text-slate-500" />
                       </div>
                       <span className="text-[10px] font-bold text-slate-400 truncate">{r.operatorName || 'مشغل النظام'}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-slate-900 dark:text-white leading-none">{Number(r.dailyProduction || 0).toLocaleString()}</p>
                    <span className="text-[10px] font-black text-primary-500 uppercase tracking-tighter">كوب</span>
                  </div>
                </motion.div>
              ))}
           </div>
        </div>

        <div className="lg:col-span-1 glass-card p-8 border-white/40 dark:border-white/5 relative bg-gradient-to-br from-white to-slate-50 dark:from-white/[0.03] dark:to-transparent">
           <h3 className="text-xl font-black text-slate-900 dark:text-white mb-8">إجراءات سريعة</h3>
           
           <div className="space-y-4">
              {[
                { label: 'تصدير كشف الوقود', icon: <FileText size={18} />, path: '/export', color: 'bg-purple-500/10 text-purple-600' },
                { label: 'إدارة المستخدمين', icon: <UsersIcon size={18} />, path: '/users', color: 'bg-blue-500/10 text-blue-600' },
                { label: 'سجل الحركات الأمني', icon: <History size={18} />, path: '/logs', color: 'bg-emerald-500/10 text-emerald-600' },
                { label: 'تعديل الإعدادات', icon: <Settings size={18} />, path: '/settings', color: 'bg-slate-500/10 text-slate-600' },
              ].map((action, i) => (
                <Link 
                  key={i} 
                  to={action.path} 
                  className="flex items-center justify-between p-5 rounded-3xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 hover:border-primary-500/30 transition-all group"
                >
                  <div className="flex items-center gap-4">
                     <div className={`p-3 rounded-2xl ${action.color}`}>
                        {action.icon}
                     </div>
                     <span className="text-sm font-black text-slate-700 dark:text-slate-300">{action.label}</span>
                  </div>
                  <ChevronLeft size={18} className="text-slate-300 group-hover:text-primary-500 group-hover:-translate-x-1 transition-all" />
                </Link>
              ))}
           </div>

           <div className="mt-10 p-6 rounded-[32px] bg-primary-600 text-white shadow-2xl shadow-primary-500/30 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 blur-2xl rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700"></div>
              <h4 className="text-lg font-black relative z-10">هل تحتاج للمساعدة؟</h4>
              <p className="text-xs font-medium opacity-80 mt-2 relative z-10">تواصل مع الدعم الفني للحصول على استشارة حول تشغيل المحطة.</p>
              <button className="mt-6 w-full py-3 bg-white text-primary-600 rounded-2xl text-xs font-black shadow-lg relative z-10 hover:bg-slate-50 transition-colors">اتصل بنا الآن</button>
           </div>
        </div>
      </div>

    </div>
  );
};

// Internal icon for users in quick actions
const UsersIcon = ({ size, className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

export default Dashboard;
