import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously, signInWithEmailAndPassword } from 'firebase/auth';

const oldConfig = {
  apiKey: "AIzaSyDSutT8QUKJDV756T3dzYD915BDS4k2Iw8",
  authDomain: "fridge-oracle-sza.firebaseapp.com",
  projectId: "fridge-oracle-sza",
  storageBucket: "fridge-oracle-sza.firebasestorage.app",
  messagingSenderId: "943671816209",
  appId: "1:943671816209:web:56422aa9e09bf75f2281b0"
};

const newConfig = {
  apiKey: "AIzaSyCUGmFKPI7OW0eLZ4pwQ0rA7BDksOmmfOE",
  authDomain: "geoai-f0601.firebaseapp.com",
  projectId: "geoai-f0601",
  storageBucket: "geoai-f0601.firebasestorage.app",
  messagingSenderId: "412351758374",
  appId: "1:412351758374:web:ea8633e3b15c52a40da6e7"
};

const oldApp = initializeApp(oldConfig, "old");
const newApp = initializeApp(newConfig, "new");

const oldAuth = getAuth(oldApp);
const newAuth = getAuth(newApp);

const oldDb = getFirestore(oldApp);
const newDb = getFirestore(newApp);

async function migrate() {
  console.log('Authenticating...');
  try {
    await signInAnonymously(oldAuth);
    console.log('Old app authenticated anonymously.');
  } catch (e) {
    console.warn('Could not auth old app anonymously:', e.message);
  }

  try {
    // New app might need email/pass since it uses real auth
    await signInWithEmailAndPassword(newAuth, 'mmashharawi2021@gmail.com', 'Mashharawi2026!');
    console.log('New app authenticated.');
  } catch (e) {
    console.warn('Could not auth new app:', e.message);
  }

  console.log('Starting migration...');
  let reportsCount = 0;
  let fuelCount = 0;

  try {
    const oldReportsSnap = await getDocs(collection(oldDb, 'reports'));
    for (const d of oldReportsSnap.docs) {
      await setDoc(doc(newDb, 'reports', d.id), d.data());
      reportsCount++;
    }
    console.log(`Migrated ${reportsCount} reports.`);

    const oldFuelSnap = await getDocs(collection(oldDb, 'fuelEntries'));
    for (const d of oldFuelSnap.docs) {
      await setDoc(doc(newDb, 'fuelEntries', d.id), d.data());
      fuelCount++;
    }
    console.log(`Migrated ${fuelCount} fuel entries.`);
    
    console.log('Migration complete!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
