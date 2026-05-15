import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';

const value = (input, fallback = '_') => {
  if (input === undefined || input === null || input === '') return fallback;
  return input;
};

const numberValue = (input) => Number(input || 0);

export const getReportTotals = (report = {}) => {
  const entities = Array.isArray(report.entities) ? report.entities : [];
  const totalCars = entities.reduce((sum, item) => sum + numberValue(item.cars), 0);
  const totalQuantity = entities.reduce((sum, item) => sum + numberValue(item.quantity), 0);
  return {
    totalCars,
    totalQuantity,
    avgPerCar: totalCars > 0 ? (totalQuantity / totalCars).toFixed(2) : '_',
  };
};

export const generateWhatsAppMessage = (report = {}) => {
  const totals = getReportTotals(report);
  const bottledWater = report.bottledWater || totals.totalQuantity || '_';

  const msg = `*تقرير تشغيل وضخ المياه ${value(report.date, '')}*

📅 التاريخ: ${value(report.date)}
📍 المحطة: ${value(report.station)}

⏱️ تشغيل المولد:
▪️ البداية: ${value(report.startTime)}
▪️ الإيقاف: ${value(report.endTime)}
▪️ ساعات التشغيل: ${value(report.operatingHours)}
▪️ الحالة: ${value(report.generatorStatus)}

⛽ الوقود:
▪️ المضاف يومياً: ${value(report.fuelAdded)} لتر
▪️ المستهلك يومياً: ${value(report.fuelConsumed)} لتر
▪️ المورد من البلدية: ${value(report.fuelFromMunicipality)} لتر
▪️ الرصيد السابق: ${value(report.previousFuelBalance)} لتر
▪️ الرصيد الحالي: ${value(report.currentFuelBalance)} لتر
▪️ الفرق/الفاقد: ${value(report.fuelDifference)} لتر

💧 كميات المياه:
▪️ إنتاج الغاطس: ${value(report.submersibleProduction)} كوب/ساعة
▪️ بعد الفلترة: ${value(report.afterFilterProduction)} كوب/ساعة
▪️ الإنتاج اليومي: ${value(report.dailyProduction)} كوب
▪️ العادم: ${value(report.waste)} كوب
▪️ نسبة الفاقد: ${value(report.wastePercentage)}%
▪️ المعبأ للجهات: ${bottledWater} كوب
▪️ عدد السيارات: ${totals.totalCars || '_'}
▪️ متوسط السيارة: ${totals.avgPerCar} كوب

🧪 فحوصات المياه:
▪️ PH بعد التحلية: ${value(report.phAfterDesalination)}
▪️ PH مياه الغاطس: ${value(report.phSubmersible)}
▪️ TDS مياه محلاة: ${value(report.tdsDesalinated)}
▪️ TDS بئر: ${value(report.tdsWell)}
▪️ TDS عادم: ${value(report.tdsWaste)}
▪️ الكلور الحر: ${value(report.freeChlorine)}

${report.notes ? `📝 ملاحظات:\n${report.notes}\n` : ''}`;

  return encodeURIComponent(msg);
};

const reportToRow = (report = {}) => {
  const totals = getReportTotals(report);
  return {
    'التاريخ': report.date || '',
    'المحطة': report.station || '',
    'اسم المشغل': report.operatorName || '',
    'بداية التشغيل': report.startTime || '',
    'إيقاف التشغيل': report.endTime || '',
    'ساعات التشغيل': report.operatingHours || 0,
    'حالة المولد': report.generatorStatus || '',
    'الرصيد السابق للوقود': report.previousFuelBalance || 0,
    'وقود مضاف داخل التقرير': report.fuelAdded || 0,
    'وقود من البلدية': report.fuelFromMunicipality || 0,
    'الوقود المستهلك': report.fuelConsumed || 0,
    'الرصيد الحالي للوقود': report.currentFuelBalance || 0,
    'فرق أو فاقد الوقود': report.fuelDifference || 0,
    'إنتاج الغاطس كوب/ساعة': report.submersibleProduction || 0,
    'بعد الفلترة كوب/ساعة': report.afterFilterProduction || 0,
    'الإنتاج اليومي': report.dailyProduction || 0,
    'العادم': report.waste || 0,
    'نسبة الفاقد': report.wastePercentage || 0,
    'المعبأ للجهات': report.bottledWater || totals.totalQuantity || 0,
    'عدد السيارات': totals.totalCars || 0,
    'متوسط السيارة': totals.avgPerCar === '_' ? '' : totals.avgPerCar,
    'PH بعد التحلية': report.phAfterDesalination || '',
    'PH مياه الغاطس': report.phSubmersible || '',
    'TDS مياه محلاة': report.tdsDesalinated || '',
    'TDS بئر': report.tdsWell || '',
    'TDS عادم': report.tdsWaste || '',
    'الكلور الحر': report.freeChlorine || '',
    'الحالة': report.status || '',
    'ملاحظات': report.notes || '',
  };
};

const fuelToRow = (entry = {}) => ({
  'التاريخ': entry.date || '',
  'الوقت': entry.time || '',
  'الجهة الموردة': entry.supplier || '',
  'الكمية باللتر': entry.quantityLiters || 0,
  'طريقة التعبئة': entry.fillingMethod || '',
  'اسم من سلم الوقود': entry.deliveredBy || '',
  'ملاحظات': entry.notes || '',
});

const writeWorkbook = (sheets, filename) => {
  const workbook = XLSX.utils.book_new();
  sheets.forEach(({ name, rows }) => {
    const safeRows = rows.length ? rows : [{ 'لا توجد بيانات': '' }];
    const worksheet = XLSX.utils.json_to_sheet(safeRows);
    worksheet['!cols'] = Object.keys(safeRows[0]).map(() => ({ wch: 22 }));
    XLSX.utils.book_append_sheet(workbook, worksheet, name.substring(0, 31));
  });
  XLSX.writeFile(workbook, filename);
};

export const exportToExcel = (reports = [], filename = 'تقارير_المياه.xlsx') => {
  writeWorkbook([{ name: 'التقارير', rows: reports.map(reportToRow) }], filename);
};

export const exportFuelEntriesToExcel = (entries = [], filename = 'سجل_الوقود_الوارد.xlsx') => {
  writeWorkbook([{ name: 'الوقود الوارد', rows: entries.map(fuelToRow) }], filename);
};

export const exportFullWorkbook = (reports = [], fuelEntries = [], filename = 'تصدير_شامل_نظام_المياه.xlsx') => {
  writeWorkbook([
    { name: 'التقارير', rows: reports.map(reportToRow) },
    { name: 'الوقود الوارد', rows: fuelEntries.map(fuelToRow) },
  ], filename);
};

export const exportReportsToPDF = (reports = [], title = 'تقرير تشغيل وضخ المياه') => {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  let y = 18;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(15);
  pdf.text(title, pageWidth / 2, y, { align: 'center' });
  y += 12;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);

  reports.forEach((report, index) => {
    if (y > 265) {
      pdf.addPage();
      y = 18;
    }
    pdf.text(`${index + 1}. ${report.date || ''} | ${report.station || ''}`, pageWidth - 12, y, { align: 'right' });
    y += 6;
    pdf.text(`Hours: ${report.operatingHours || 0} | Fuel: ${report.fuelConsumed || 0} L | Water: ${report.dailyProduction || 0} cups`, pageWidth - 12, y, { align: 'right' });
    y += 8;
  });

  pdf.save(`${title.replaceAll(' ', '_')}.pdf`);
};

export const exportFuelEntriesToPDF = (entries = [], title = 'سجل الوقود الوارد') => {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  let y = 18;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(15);
  pdf.text(title, pageWidth / 2, y, { align: 'center' });
  y += 12;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  entries.forEach((entry, index) => {
    if (y > 270) {
      pdf.addPage();
      y = 18;
    }
    pdf.text(`${index + 1}. ${entry.date || ''} ${entry.time || ''} | ${entry.supplier || ''} | ${entry.quantityLiters || 0} L`, pageWidth - 12, y, { align: 'right' });
    y += 7;
  });

  pdf.save(`${title.replaceAll(' ', '_')}.pdf`);
};

export const exportToPDF = async (elementId, filename = 'report.pdf') => {
  try {
    const html2canvas = (await import('html2canvas')).default;
    const element = document.getElementById(elementId);
    if (!element) return;

    const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false });
    const imgData = canvas.toDataURL('image/jpeg', 1.0);
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(filename);
  } catch (error) {
    console.error('Error generating PDF', error);
  }
};
