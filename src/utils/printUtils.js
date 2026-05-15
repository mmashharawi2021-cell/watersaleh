export const printFuelReceipt = (entry) => {
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    alert("يرجى السماح بالنوافذ المنبثقة (Pop-ups) لطباعة الإيصال");
    return;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>إيصال استلام وقود - ${entry.date}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 0;
          padding: 20px;
          color: #333;
        }
        .receipt-container {
          max-width: 800px;
          margin: 0 auto;
          border: 2px solid #ddd;
          padding: 40px;
          border-radius: 8px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #eee;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header-title h1 {
          margin: 0;
          color: #2c3e50;
          font-size: 24px;
        }
        .header-title p {
          margin: 5px 0 0;
          color: #7f8c8d;
        }
        .logo-placeholder {
          width: 80px;
          height: 80px;
          background-color: #f8f9fa;
          border: 1px dashed #ccc;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          color: #aaa;
          font-size: 12px;
        }
        .details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 40px;
        }
        .detail-item {
          background-color: #f8f9fa;
          padding: 15px;
          border-radius: 6px;
        }
        .detail-item span {
          display: block;
          color: #7f8c8d;
          font-size: 13px;
          margin-bottom: 5px;
        }
        .detail-item strong {
          color: #2c3e50;
          font-size: 16px;
        }
        .quantity-box {
          background-color: #f3e8ff;
          border: 1px solid #d8b4fe;
          text-align: center;
          padding: 30px;
          border-radius: 8px;
          margin-bottom: 40px;
        }
        .quantity-box h2 {
          margin: 0;
          color: #7e22ce;
          font-size: 36px;
        }
        .quantity-box p {
          margin: 5px 0 0;
          color: #9333ea;
        }
        .signatures {
          display: flex;
          justify-content: space-between;
          margin-top: 60px;
          padding-top: 30px;
          border-top: 1px solid #eee;
        }
        .sig-box {
          text-align: center;
          width: 200px;
        }
        .sig-line {
          border-bottom: 1px solid #333;
          margin-top: 50px;
          margin-bottom: 10px;
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          color: #95a5a6;
          font-size: 12px;
        }
        @media print {
          body { padding: 0; }
          .receipt-container { border: none; padding: 0; }
          .quantity-box { background-color: #f3e8ff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>
      <div class="receipt-container">
        <div class="header">
          <div class="header-title">
            <h1>إيصال استلام وقود رسمي</h1>
            <p>رقم الإيصال: #${entry.id.substring(0, 8).toUpperCase()}</p>
          </div>
          <div class="logo-placeholder">شعار البلدية</div>
        </div>

        <div class="details-grid">
          <div class="detail-item">
            <span>تاريخ الاستلام</span>
            <strong>${entry.date} - ${entry.time}</strong>
          </div>
          <div class="detail-item">
            <span>الجهة الموردة / المصدر</span>
            <strong>${entry.supplier}</strong>
          </div>
          <div class="detail-item">
            <span>آلية التعبئة</span>
            <strong>${entry.fillingMethod}</strong>
          </div>
          <div class="detail-item">
            <span>المستلم</span>
            <strong>${entry.receivedBy || 'إدارة المحطة'}</strong>
          </div>
        </div>

        <div class="quantity-box">
          <h2>${entry.quantityLiters} لتر</h2>
          <p>الكمية المستلمة (سولار)</p>
        </div>

        ${entry.notes ? `
          <div class="detail-item" style="grid-column: 1 / -1; margin-bottom: 40px;">
            <span>ملاحظات</span>
            <strong>${entry.notes}</strong>
          </div>
        ` : ''}

        <div class="signatures">
          <div class="sig-box">
            <span>توقيع المورد (السائق)</span>
            <div class="sig-line"></div>
            <span>الاسم: ........................</span>
          </div>
          <div class="sig-box">
            <span>توقيع المستلم (المشرف)</span>
            <div class="sig-line"></div>
            <span>الختم الرسمي</span>
          </div>
        </div>

        <div class="footer">
          <p>أُصدر هذا الإيصال إلكترونياً من نظام إدارة المياه - بلدية المنطقة</p>
          <p>تاريخ الإصدار: ${new Date().toLocaleDateString('ar-EG')}</p>
        </div>
      </div>
      <script>
        window.onload = function() { window.print(); }
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};

export const printWaterReport = (report) => {
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    alert("يرجى السماح بالنوافذ المنبثقة (Pop-ups) لطباعة التقرير");
    return;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>تقرير مياه رسمي - ${report.date}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 0;
          padding: 20px;
          color: #333;
        }
        .report-container {
          max-width: 800px;
          margin: 0 auto;
          border: 2px solid #ddd;
          padding: 40px;
          border-radius: 8px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #eee;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header-title h1 {
          margin: 0;
          color: #2c3e50;
          font-size: 24px;
        }
        .header-title p {
          margin: 5px 0 0;
          color: #7f8c8d;
        }
        .logo-placeholder {
          width: 80px;
          height: 80px;
          background-color: #f8f9fa;
          border: 1px dashed #ccc;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          color: #aaa;
          font-size: 12px;
        }
        .details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 30px;
        }
        .detail-item {
          background-color: #f8f9fa;
          padding: 15px;
          border-radius: 6px;
          border-right: 4px solid #3498db;
        }
        .detail-item span {
          display: block;
          color: #7f8c8d;
          font-size: 13px;
          margin-bottom: 5px;
        }
        .detail-item strong {
          color: #2c3e50;
          font-size: 18px;
        }
        .alerts-section {
          background-color: #fdf2f2;
          border: 1px solid #fbd5d5;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
        }
        .alerts-section h3 {
          color: #c81e1e;
          margin-top: 0;
        }
        .signatures {
          display: flex;
          justify-content: space-between;
          margin-top: 60px;
          padding-top: 30px;
          border-top: 1px solid #eee;
        }
        .sig-box {
          text-align: center;
          width: 200px;
        }
        .sig-line {
          border-bottom: 1px solid #333;
          margin-top: 50px;
          margin-bottom: 10px;
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          color: #95a5a6;
          font-size: 12px;
        }
        @media print {
          body { padding: 0; }
          .report-container { border: none; padding: 0; }
          .detail-item { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .alerts-section { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>
      <div class="report-container">
        <div class="header">
          <div class="header-title">
            <h1>تقرير الإنتاج اليومي للمياه</h1>
            <p>محطة: ${report.station}</p>
            <p>التاريخ: ${report.date}</p>
          </div>
          <div class="logo-placeholder">شعار البلدية</div>
        </div>

        <div class="details-grid">
          <div class="detail-item" style="border-right-color: #3b82f6;">
            <span>الإنتاج اليومي</span>
            <strong>${report.dailyProduction || 0} كوب</strong>
          </div>
          <div class="detail-item" style="border-right-color: #8b5cf6;">
            <span>المعبأ للسيارات</span>
            <strong>${report.bottledWater || 0} كوب</strong>
          </div>
          <div class="detail-item" style="border-right-color: #f59e0b;">
            <span>ساعات التشغيل</span>
            <strong>${report.operatingHours || 0} ساعة</strong>
          </div>
          <div class="detail-item" style="border-right-color: #ef4444;">
            <span>استهلاك الوقود</span>
            <strong>${report.fuelConsumed || 0} لتر</strong>
          </div>
          <div class="detail-item" style="border-right-color: #10b981;">
            <span>رصيد الوقود (بعد الاستهلاك)</span>
            <strong>${report.fuelBalance || 0} لتر</strong>
          </div>
          <div class="detail-item" style="border-right-color: #64748b;">
            <span>العادم الكلي</span>
            <strong>${report.waste || 0} كوب</strong>
          </div>
        </div>

        ${report.alerts && report.alerts.length > 0 ? `
          <div class="alerts-section">
            <h3>تنبيهات وملاحظات طارئة</h3>
            <ul>
              ${report.alerts.map(a => `<li>${a}</li>`).join('')}
            </ul>
          </div>
        ` : ''}

        ${report.notes ? `
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <h3 style="margin-top: 0; color: #475569;">ملاحظات إضافية</h3>
            <p style="color: #64748b; line-height: 1.6;">${report.notes}</p>
          </div>
        ` : ''}

        <div class="signatures">
          <div class="sig-box">
            <span>معد التقرير (المشرف)</span>
            <div class="sig-line"></div>
            <span>الاسم: ........................</span>
          </div>
          <div class="sig-box">
            <span>اعتماد الإدارة</span>
            <div class="sig-line"></div>
            <span>الختم الرسمي</span>
          </div>
        </div>

        <div class="footer">
          <p>أُصدر هذا التقرير إلكترونياً من نظام إدارة المياه - بلدية المنطقة</p>
          <p>تاريخ الطباعة: ${new Date().toLocaleDateString('ar-EG')}</p>
        </div>
      </div>
      <script>
        window.onload = function() { window.print(); }
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};
