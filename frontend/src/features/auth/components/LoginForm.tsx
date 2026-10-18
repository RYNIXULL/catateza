import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { LogIn, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import { useToast } from '../../../hooks/useToast';
import api from '../../../lib/axios';

const loginSchema = z.object({
  email: z.string().min(1, { message: "Harap isi Email atau Token Akses" }),
  password: z.string().min(6, { message: "Kata sandi minimal 6 karakter" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const { error, success } = useToast();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', data);
      
      const { user, tokens } = response.data;
      setAuth(user, tokens.accessToken);
      
      success("Login Berhasil", `Selamat datang kembali, ${user.name}`);
      
      if (user.role === 'OWNER') {
        navigate('/dashboard');
      } else {
        navigate('/pos');
      }
    } catch (err: any) {
      error(
        "Login Gagal", 
        err.response?.data?.message || "Terjadi kesalahan pada server. Pastikan email dan sandi benar."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Email / Token Akses
        </label>
        <input
          {...register('email')}
          type="text"
          placeholder="admin@smartpos.com"
          className={`w-full px-4 py-2.5 rounded-lg border bg-white/50 dark:bg-black/50  transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 ${
            errors.email ? 'border-red-500/50' : 'border-border'
          }`}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Kata Sandi
        </label>
        <input
          {...register('password')}
          type="password"
          placeholder="••••••••"
          className={`w-full px-4 py-2.5 rounded-lg border bg-white/50 dark:bg-black/50  transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 ${
            errors.password ? 'border-red-500/50' : 'border-border'
          }`}
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded-lg font-medium transition-all active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none shadow-sm"
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <LogIn className="w-5 h-5" />
            Masuk
          </>
        )}
      </button>
    </form>
  );
};
