import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Provider } from 'react-redux';
import {
  LayoutDashboardIcon,
  UsersIcon,
  UserCogIcon,
  WalletIcon,
  Layers3Icon,
  FileBarChart2Icon,
  ReceiptIcon,
  SettingsIcon } from
'lucide-react';

import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';

import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { DashboardLayout } from './components/layout/DashboardLayout';
import type { NavItem } from './components/layout/Sidebar';

import { StudentPortal } from './pages/StudentPortal';
import { Login } from './pages/Login';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { ReceptionistsPage } from './pages/admin/ReceptionistsPage';
import { FeeStructuresPage } from './pages/admin/FeeStructuresPage';
import { ReportsPage } from './pages/admin/ReportsPage';
import { SettingsPage } from './pages/admin/SettingsPage';
import { ReceptionDashboard } from './pages/reception/ReceptionDashboard';
import { StudentsPage } from './pages/shared/StudentsPage';
import { FeeManagementPage } from './pages/shared/FeeManagementPage';
import { PaymentHistoryPage } from './pages/shared/PaymentHistoryPage';
import { store } from './app/store';

const adminNav: NavItem[] = [
{ to: '/admin', label: 'Dashboard', icon: LayoutDashboardIcon, end: true },
{ to: '/admin/students', label: 'Students', icon: UsersIcon },
{ to: '/admin/receptionists', label: 'Receptionists', icon: UserCogIcon },
{ to: '/admin/fee-structures', label: 'Fee Structures', icon: Layers3Icon },
{ to: '/admin/fees', label: 'Fee Management', icon: WalletIcon },
{ to: '/admin/history', label: 'Payment History', icon: ReceiptIcon },
{ to: '/admin/reports', label: 'Reports', icon: FileBarChart2Icon },
{ to: '/admin/settings', label: 'Settings', icon: SettingsIcon }];


const receptionNav: NavItem[] = [
{ to: '/reception', label: 'Dashboard', icon: LayoutDashboardIcon, end: true },
{ to: '/reception/students', label: 'Students', icon: UsersIcon },
{ to: '/reception/fees', label: 'Fee Collection', icon: WalletIcon },
{ to: '/reception/history', label: 'Payment History', icon: ReceiptIcon }];


export function App() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <DataProvider>
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<StudentPortal />} />
                <Route path="/login" element={<Login />} />

              {/* Admin */}
              <Route
                element={
                <ProtectedRoute role="ADMIN">
                    <DashboardLayout items={adminNav} roleLabel="Administrator" basePath="/admin" />
                  </ProtectedRoute>
                }>
                
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/students" element={<StudentsPage canManage />} />
                <Route path="/admin/receptionists" element={<ReceptionistsPage />} />
                <Route path="/admin/fee-structures" element={<FeeStructuresPage />} />
                <Route path="/admin/fees" element={<FeeManagementPage />} />
                <Route path="/admin/history" element={<PaymentHistoryPage />} />
                <Route path="/admin/reports" element={<ReportsPage />} />
                <Route path="/admin/settings" element={<SettingsPage />} />
              </Route>

              {/* Receptionist */}
              <Route
                element={
                <ProtectedRoute role="RECEPTIONIST">
                    <DashboardLayout
                    items={receptionNav}
                    roleLabel="Receptionist"
                    basePath="/reception" />
                  
                  </ProtectedRoute>
                }>
                
                <Route path="/reception" element={<ReceptionDashboard />} />
                <Route path="/reception/students" element={<StudentsPage canManage={false} />} />
                <Route path="/reception/fees" element={<FeeManagementPage />} />
                <Route path="/reception/history" element={<PaymentHistoryPage />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              <Toaster position="top-right" richColors closeButton />
            </BrowserRouter>
          </AuthProvider>
        </DataProvider>
      </ThemeProvider>
    </Provider>);

}
