import React from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

import { LoginPage } from '../../features/auth/pages/LoginPage';
import { ProtectedRoute } from '../auth/ProtectedRoute';
import { OwnerLayout } from './OwnerLayout';
import { DashboardPage } from '../../features/dashboard/pages/DashboardPage';
import { POSPage } from '../../features/pos/pages/POSPage';
import { InventoryPage } from '../../features/inventory/pages/InventoryPage';
import { EmployeePage } from '../../features/employees/pages/EmployeePage';
import { SettingsPage } from '../../features/settings/pages/SettingsPage';
import { ReportsPage } from '../../features/reports/pages/ReportsPage';
import { BranchesPage } from '../../features/branches/pages/BranchesPage';
import { BranchDetailsPage } from '../../features/branches/pages/BranchDetailsPage';

const pageTransition = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2, ease: 'easeOut' }
};

const PageWrapper = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial="initial"
    animate="animate"
    exit="exit"
    variants={pageTransition}
    className="h-full w-full"
  >
    {children}
  </motion.div>
);

export const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<PageWrapper><LoginPage /></PageWrapper>} />
        
        {/* Protected Routes for Owner */}
        <Route element={<ProtectedRoute allowedRoles={['OWNER']} />}>
          <Route element={<OwnerLayout />}>
            <Route path="/dashboard" element={<PageWrapper><DashboardPage /></PageWrapper>} />
            <Route path="/inventory" element={<PageWrapper><InventoryPage /></PageWrapper>} />
            <Route path="/employees" element={<PageWrapper><EmployeePage /></PageWrapper>} />
            <Route path="/reports" element={<PageWrapper><ReportsPage /></PageWrapper>} />
            <Route path="/settings" element={<PageWrapper><SettingsPage /></PageWrapper>} />
            <Route path="/branches" element={<PageWrapper><BranchesPage /></PageWrapper>} />
            <Route path="/branches/:id" element={<PageWrapper><BranchDetailsPage /></PageWrapper>} />
          </Route>
        </Route>

        {/* POS Standalone Route for Owner & Cashier */}
        <Route element={<ProtectedRoute allowedRoles={['OWNER', 'CASHIER']} />}>
          <Route path="/pos" element={<PageWrapper><POSPage /></PageWrapper>} />
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AnimatePresence>
  );
};
