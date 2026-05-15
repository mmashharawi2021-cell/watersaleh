import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Toaster } from 'react-hot-toast';

import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AddReport from './pages/AddReport';
import Archive from './pages/Archive';
import AddFuel from './pages/AddFuel';
import FuelArchive from './pages/FuelArchive';
import ExportCenter from './pages/ExportCenter';
import Settings from './pages/Settings';
import Users from './pages/Users';
import Profile from './pages/Profile';
import Logs from './pages/Logs';
import NotificationManager from './components/NotificationManager';

const PrivateRoute = ({ children }) => {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const { currentUser, isAdmin } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  return isAdmin ? children : <Navigate to="/" replace />;
};

const SuperAdminRoute = ({ children }) => {
  const { currentUser, isSuperAdmin } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  return isSuperAdmin ? children : <Navigate to="/" replace />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route path="/" element={
        <PrivateRoute>
          <Layout />
        </PrivateRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="add-report" element={<AddReport />} />
        <Route path="edit-report/:id" element={<AddReport />} />
        <Route path="archive" element={<Archive />} />
        <Route path="add-fuel" element={<AddFuel />} />
        <Route path="edit-fuel/:id" element={<AddFuel />} />
        <Route path="fuel-archive" element={<FuelArchive />} />
        <Route path="export" element={<ExportCenter />} />
        <Route path="users" element={<SuperAdminRoute><Users /></SuperAdminRoute>} />
        <Route path="logs" element={<SuperAdminRoute><Logs /></SuperAdminRoute>} />
        <Route path="settings" element={<AdminRoute><Settings /></AdminRoute>} />
        <Route path="profile" element={<Profile />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <AppRoutes />
          <NotificationManager />
          <Toaster position="top-center" toastOptions={{ style: { direction: 'rtl' } }} />
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
