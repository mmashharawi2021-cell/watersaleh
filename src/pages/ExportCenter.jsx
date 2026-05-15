import { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, query } from 'firebase/firestore';
import { Download, FileText, FileSpreadsheet, Fuel, RefreshCw, Droplet } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '../firebase';
import {
  exportToExcel,
  exportFuelEntriesToExcel,
  exportFullWorkbook,
  exportReportsToPDF,
  exportFuelEntriesToPDF,
} from '../utils/exportUtils';

const ExportButton = ({ onClick, disabled, icon, label }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="flex-1 min-w-[120px] h-12 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-black flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
  >
    {icon}
    {label}
  </button>
);

const ExportCard = ({ title, description, children }) => (
  <div className="glass-card p-7 border-white/40 dark:border-white/5 space-y-6">
    <div>
      <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm font-bold text-slate-500 dark:text-slate-400 leading-relaxed">{description}</p>
    </div>
    <div className="flex flex-wrap gap-3">{children}</div>
  </div>
);

const ExportCenter = () => {
  const [reports, setReports] = useState([]);
  const [fuelEntries, setFuelEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const totals = useMemo(() => ({
    reports: reports.length,
    fuel: fuelEntries.length,
    water: reports.reduce((sum, item) => sum + Number(item.dailyProduction || 0), 0),
    fuelReceived: fuelEntries.reduce((sum, item) => sum + Number(item.quantityLiters || 0), 0),
  }), [reports, fuelEntries]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [reportsSnapshot, fuelSnapshot] = await Promise.all([
        getDocs(query(collection(db, 'reports'))),
        getDocs(query(collection(db, 'fuelEntries'))),
      ]);

      const nextReports = reportsSnapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
      const nextFuel = fuelSnapshot.docs.map((item) => ({ id: item.id, ...item.data() }));

      nextReports.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
      nextFuel.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

      setReports(nextReports);
      setFuelEntries(nextFuel);
    } catch (error) {
      console.error(error);
      toast.error('فشل تحميل بيانات التصدير. تحقق من Firebase وصلاحيات Firestore.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const requireReports = () => {
    if (!reports.length) {
      toast.error('لا توجد تقارير للتصدير');
      return false;
    }
    return true;
  };

  const requireFuel = () => {
    if (!fuelEntries.length) {
      toast.error('لا توجد سجلات وقود للتصدير');
      return false;
    }
    return true;
  };

  return (
    <div className="max-w-7xl mx-auto pb-20 space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-primary-600 rounded-lg text-white"><Download size={16} /></div>
            <span className="text-xs font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest">مركز التصدير</span>
          </div>
          <h1 className="text-4xl font-display font-black tracking-tight text-slate-900 dark:text-white">تصدير البيانات</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">تصدير فعلي للتقارير والوقود من Firestore بصيغ PDF وExcel.</p>
        </div>

        <button onClick={loadData} disabled={loading} className="flex items-center gap-3 px-6 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-black text-slate-600 dark:text-slate-300 disabled:opacity-50">
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> تحديث البيانات
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="glass-card p-6"><p className="text-xs font-black text-slate-400">التقارير</p><h3 className="text-3xl font-black">{totals.reports}</h3></div>
        <div className="glass-card p-6"><p className="text-xs font-black text-slate-400">سجلات الوقود</p><h3 className="text-3xl font-black">{totals.fuel}</h3></div>
        <div className="glass-card p-6"><p className="text-xs font-black text-slate-400">إنتاج المياه</p><h3 className="text-3xl font-black">{totals.water.toLocaleString()}</h3></div>
        <div className="glass-card p-6"><p className="text-xs font-black text-slate-400">الوقود الوارد</p><h3 className="text-3xl font-black">{totals.fuelReceived.toLocaleString()}</h3></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ExportCard title="تقارير التشغيل" description="تصدير جميع التقارير اليومية المحفوظة.">
          <ExportButton disabled={loading || !reports.length} onClick={() => requireReports() && exportReportsToPDF(reports, 'تقارير التشغيل اليومية')} icon={<FileText size={16} />} label="PDF" />
          <ExportButton disabled={loading || !reports.length} onClick={() => requireReports() && exportToExcel(reports, 'تقارير_التشغيل.xlsx')} icon={<FileSpreadsheet size={16} />} label="Excel" />
        </ExportCard>

        <ExportCard title="الوقود الوارد" description="تصدير سجلات الوقود الوارد المنفصلة عن التقارير.">
          <ExportButton disabled={loading || !fuelEntries.length} onClick={() => requireFuel() && exportFuelEntriesToPDF(fuelEntries, 'سجل الوقود الوارد')} icon={<Fuel size={16} />} label="PDF" />
          <ExportButton disabled={loading || !fuelEntries.length} onClick={() => requireFuel() && exportFuelEntriesToExcel(fuelEntries, 'سجل_الوقود_الوارد.xlsx')} icon={<FileSpreadsheet size={16} />} label="Excel" />
        </ExportCard>

        <ExportCard title="تصدير شامل" description="ملف Excel واحد يحتوي التقارير والوقود الوارد.">
          <ExportButton disabled={loading || (!reports.length && !fuelEntries.length)} onClick={() => exportFullWorkbook(reports, fuelEntries, 'تصدير_شامل_نظام_المياه.xlsx')} icon={<Droplet size={16} />} label="Excel شامل" />
        </ExportCard>
      </div>
    </div>
  );
};

export default ExportCenter;
