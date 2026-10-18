import React from 'react';
import { LoginForm } from '../components/LoginForm';
import { Building2 } from 'lucide-react';

export const LoginPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Decorative background elements for better glassmorphism contrast */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
      <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-blue-300/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-emerald-300/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>

      <div className="glass relative z-10 w-full max-w-md p-8 rounded-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 ring-1 ring-primary/20">
            <Building2 className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Catat Eza
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Masuk ke akun Anda untuk mengelola kasir dan inventaris
          </p>
        </div>

        <LoginForm />

        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Catat Eza. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};
