import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './components/providers/ToastProvider';
import { ModalProvider } from './components/providers/ModalProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { Navigate } from 'react-router-dom';
import { LoginPage } from './features/auth/pages/LoginPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { OwnerLayout } from './components/layout/OwnerLayout';
import { DashboardPage } from './features/dashboard/pages/DashboardPage';
import { POSPage } from './features/pos/pages/POSPage';
import { InventoryPage } from './features/inventory/pages/InventoryPage';
import { EmployeePage } from './features/employees/pages/EmployeePage';
import { SettingsPage } from './features/settings/pages/SettingsPage';
import { ReportsPage } from './features/reports/pages/ReportsPage';
import { BranchesPage } from './features/branches/pages/BranchesPage';
import { BranchDetailsPage } from './features/branches/pages/BranchDetailsPage';
import { AnimatedRoutes } from './components/layout/AnimatedRoutes';

// Initialize query client for react-query
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen">
          <AnimatedRoutes />
        </div>
        
        {/* Global Providers for UI Feedback */}
        <ToastProvider />
        <ModalProvider />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
