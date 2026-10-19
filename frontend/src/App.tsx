import React from 'react';
import { HashRouter } from 'react-router-dom';
import { ToastProvider } from './components/providers/ToastProvider';
import { ModalProvider } from './components/providers/ModalProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnimatedRoutes } from './components/layout/AnimatedRoutes';

// Initialize query client for react-query
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <div className="min-h-screen">
          <AnimatedRoutes />
        </div>
        
        {/* Global Providers for UI Feedback */}
        <ToastProvider />
        <ModalProvider />
      </HashRouter>
    </QueryClientProvider>
  );
}

export default App;
