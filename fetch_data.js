import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "geoai-f0601",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fetchData() {
  try {
    const reportsRef = collection(db, 'reports');
    const q = query(reportsRef, limit(20));
    const querySnapshot = await getDocs(q);
    
    const reports = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      reports.push({ 
        id: doc.id, 
        hasDate: !!data.date, 
        hasReportDate: !!data.reportDate,
        date: data.date,
        reportDate: data.reportDate,
        water: data.water ? 'present' : 'absent',
        fuel: data.fuel ? 'present' : 'absent',
        generator: data.generator ? 'present' : 'absent'
      });
    });
    
    console.log(JSON.stringify(reports, null, 2));
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

fetchData();
