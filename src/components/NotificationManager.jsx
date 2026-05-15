import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

const NotificationManager = () => {
  const { currentUser } = useAuth();
  const [lastNotified, setLastNotified] = useState({});

  useEffect(() => {
    if (!currentUser) return;

    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const checkAlerts = async () => {
      try {
        // Fetch System Settings
        const settingsSnap = await getDoc(doc(db, 'system', 'settings'));
        const settings = settingsSnap.exists() ? settingsSnap.data() : { maintenanceInterval: 250, fuelAlertThreshold: 300 };

        // Fetch latest reports to calculate state
        const reportsRef = collection(db, 'reports');
        const q = query(reportsRef, orderBy('date', 'desc'), limit(50));
        const snap = await getDocs(q);
        const reports = snap.docs.map(doc => doc.data());

        if (reports.length === 0) return;

        let totalHours = 0;
        reports.forEach(r => totalHours += Number(r.operatingHours || 0));

        const latestReport = reports[0];
        const currentFuel = Number(latestReport.currentFuelBalance || 0);

        const newAlerts = [];

        // Maintenance Alert
        if (totalHours >= settings.maintenanceInterval) {
          newAlerts.push({
            id: 'maintenance',
            title: 'تنبيه صيانة',
            body: `المولد تجاوز ${settings.maintenanceInterval} ساعة عمل. يرجى الصيانة.`
          });
        }

        // Fuel Alert
        if (currentFuel < (settings.fuelAlertThreshold || 300)) {
          newAlerts.push({
            id: 'fuel',
            title: 'نقص وقود',
            body: `رصيد الوقود منخفض جداً (${currentFuel} لتر).`
          });
        }

        // Trigger Notifications
        newAlerts.forEach(alert => {
          // Only notify if not already notified in this session or if status changed (simplified: notify once per hour)
          const now = Date.now();
          if (!lastNotified[alert.id] || (now - lastNotified[alert.id] > 3600000)) {
            if (Notification.permission === 'granted') {
              new Notification(alert.title, {
                body: alert.body,
                icon: '/favicon.svg'
              });
              setLastNotified(prev => ({ ...prev, [alert.id]: now }));
            }
          }
        });

      } catch (error) {
        console.error("Notification Check Error:", error);
      }
    };

    // Check every 5 minutes
    const interval = setInterval(checkAlerts, 300000);
    checkAlerts(); // Initial check

    return () => clearInterval(interval);
  }, [currentUser, lastNotified]);

  return null;
};

export default NotificationManager;
