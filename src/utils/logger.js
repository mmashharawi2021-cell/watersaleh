import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Logs an action to the database.
 * @param {string} action - The action performed (e.g., 'إضافة مستخدم', 'تعديل تقرير')
 * @param {string} details - A brief description of the action.
 * @param {object} userData - The current user object containing uid and name.
 */
export const logAction = async (action, details, userData) => {
  try {
    if (!import.meta.env.VITE_FIREBASE_API_KEY || !userData) {
      console.log('Mock Log:', action, details, userData);
      return;
    }

    await addDoc(collection(db, 'logs'), {
      action,
      details,
      userName: userData.name || userData.email || 'مستخدم',
      userId: userData.uid || 'unknown',
      timestamp: serverTimestamp(),
      date: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to log action:', error);
  }
};
