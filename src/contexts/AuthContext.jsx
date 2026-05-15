import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

import LoadingScreen from '../components/LoadingScreen';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  async function login(email, password) {
    if (!import.meta.env.VITE_FIREBASE_API_KEY) {
      if (email === 'admin@water.com' && password === '123456') {
        const mockUser = { uid: 'mock-uid', email: 'admin@water.com' };
        setCurrentUser(mockUser);
        setUserData({ role: 'Super Admin', name: 'مدير النظام' });
        localStorage.setItem('mock_user', 'true');
        return Promise.resolve();
      }
      return Promise.reject(new Error('Invalid credentials'));
    }
    return signInWithEmailAndPassword(auth, email, password);
  }

  function logout() {
    if (!import.meta.env.VITE_FIREBASE_API_KEY) {
      setCurrentUser(null);
      setUserData(null);
      localStorage.removeItem('mock_user');
      return Promise.resolve();
    }
    return signOut(auth);
  }

  useEffect(() => {
    if (!import.meta.env.VITE_FIREBASE_API_KEY) {
      if (localStorage.getItem('mock_user')) {
        setCurrentUser({ uid: 'mock-uid', email: 'admin@water.com' });
        setUserData({ role: 'Super Admin', name: 'مدير النظام' });
      } else {
        setCurrentUser(null);
        setUserData(null);
      }
      setLoading(false);
      return () => {};
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.status === 'معطل') {
              alert("تم تعطيل حسابك من قبل الإدارة.");
              await signOut(auth);
              setUserData(null);
              setCurrentUser(null);
            } else {
              setUserData(data);
            }
          } else {
            // Default fallback if user doc doesn't exist
            setUserData({ role: 'Viewer', name: user.email, status: 'نشط' });
          }
        } catch (error) {
          console.error("Error fetching user data", error);
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userData,
    login,
    logout,
    isAdmin: userData?.role === 'Admin' || userData?.role === 'Super Admin',
    isSuperAdmin: userData?.role === 'Super Admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? <LoadingScreen /> : children}
    </AuthContext.Provider>
  );
}
