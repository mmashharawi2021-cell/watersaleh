import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, deleteField } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import fs from 'fs';
import path from 'path';

// Read .env file to get config
const envContent = fs.readFileSync('.env', 'utf8');
const config = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^VITE_FIREBASE_(\w+)="(.*)"/);
    if (match) {
        const key = match[1].toLowerCase().replace(/_([a-z])/g, (g) => g[1].toUpperCase());
        config[key] = match[2];
    }
});

const firebaseConfig = {
    apiKey: config.apiKey,
    authDomain: config.authDomain,
    projectId: config.projectId,
    storageBucket: config.storageBucket,
    messagingSenderId: config.messagingSenderId,
    appId: config.appId
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function normalize() {
    console.log('--- بدء عملية توحيد البيانات ---');
    
    try {
        // We might need to login if rules are semi-strict
        // Using the credentials found in migrate.js as a hint
        try {
            await signInWithEmailAndPassword(auth, 'mmashharawi2021@gmail.com', 'Mashharawi2026!');
            console.log('✅ تم تسجيل الدخول بنجاح.');
        } catch (e) {
            console.warn('⚠️ فشل تسجيل الدخول، سنحاول الوصول بدون مصادقة:', e.message);
        }

        const reportsRef = collection(db, 'reports');
        const snapshot = await getDocs(reportsRef);
        console.log(`📋 تم العثور على ${snapshot.size} تقرير.`);

        let updatedCount = 0;

        for (const reportDoc of snapshot.docs) {
            const data = reportDoc.data();
            const updates = {};
            const fieldsToDelete = [];

            // 1. Date normalization
            if (data.reportDate && !data.date) {
                updates.date = data.reportDate;
                fieldsToDelete.push('reportDate');
            }

            // 2. Station normalization
            if (data.stationName && !data.station) {
                updates.station = data.stationName;
                fieldsToDelete.push('stationName');
            }

            // 3. Water production normalization
            if (data.water?.dailyProduction && data.dailyProduction === undefined) {
                updates.dailyProduction = Number(data.water.dailyProduction);
            }
            if (data.water?.filledWater && data.bottledWater === undefined) {
                updates.bottledWater = Number(data.water.filledWater);
            }

            // 4. Generator hours normalization
            if (data.generator?.totalRunHours && data.operatingHours === undefined) {
                updates.operatingHours = Number(data.generator.totalRunHours);
            }

            // 5. Fuel normalization
            if (data.fuel?.consumedDaily && data.fuelConsumed === undefined) {
                updates.fuelConsumed = Number(data.fuel.consumedDaily);
            }
            if (data.fuel?.currentBalance && data.currentFuelBalance === undefined) {
                updates.currentFuelBalance = Number(data.fuel.currentBalance);
            }

            // 6. Beneficiaries to Entities normalization
            if (data.beneficiaries && (!data.entities || data.entities.length === 0)) {
                updates.entities = data.beneficiaries.map(b => ({
                    id: Math.random().toString(36).substr(2, 9),
                    name: b.entity || b.name || '',
                    quantity: Number(b.amount || b.quantity || 0),
                    cars: Number(b.carCount || b.cars || 0)
                }));
                fieldsToDelete.push('beneficiaries');
            }

            // Apply updates if any
            if (Object.keys(updates).length > 0) {
                // Add delete fields
                fieldsToDelete.forEach(f => {
                    updates[f] = deleteField();
                });

                await updateDoc(doc(db, 'reports', reportDoc.id), updates);
                updatedCount++;
                console.log(`🔹 تم تحديث التقرير: ${reportDoc.id} (${data.date || data.reportDate})`);
            }
        }

        console.log(`\n✅ انتهت العملية. تم تحديث ${updatedCount} تقرير.`);
        process.exit(0);

    } catch (error) {
        console.error('❌ حدث خطأ أثناء العملية:', error);
        process.exit(1);
    }
}

normalize();
