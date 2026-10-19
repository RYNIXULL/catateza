import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { LogIn, Loader2, KeyRound, HelpCircle, Eye, EyeOff } from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [savedHint, setSavedHint] = useState<string>('');
  const { setAuth } = useAuthStore();
  const { error, success } = useToast();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    // Check for remembered email
    const rememberEmailSetting = localStorage.getItem('smartpos_remember_email');
    if (rememberEmailSetting !== 'false') {
      const lastEmail = localStorage.getItem('smartpos_last_email');
      if (lastEmail) {
        setValue('email', lastEmail);
      }
    }

    // Check for saved password hint
    const hint = localStorage.getItem('smartpos_password_hint');
    if (hint && hint.trim()) {
      setSavedHint(hint.trim());
    }
  }, [setValue]);

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', {
        email: data.email.trim().toLowerCase(),
        password: data.password.trim(),
      });
      
      const { user, tokens } = response.data;
      setAuth(user, tokens.accessToken);

      // Save email for next login if remember email is active
      const rememberEmailSetting = localStorage.getItem('smartpos_remember_email');
      if (rememberEmailSetting !== 'false') {
        localStorage.setItem('smartpos_last_email', data.email.trim().toLowerCase());
      }
      
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

  const handleFillDemo = () => {
    setValue('email', 'admin@smartpos.com');
    setValue('password', 'admin123');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Email
        </label>
        <input
          {...register('email')}
          type="text"
          placeholder="admin@smartpos.com"
          autoCapitalize="none"
          autoCorrect="off"
          className={`w-full px-4 py-2.5 rounded-lg border bg-white/50 dark:bg-black/50  transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 ${
            errors.email ? 'border-red-500/50' : 'border-border'
          }`}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-sm font-medium text-foreground">
            Kata Sandi
          </label>
          {savedHint && (
            <button
              type="button"
              onClick={() => setShowHint(!showHint)}
              className="text-xs text-primary hover:underline flex items-center gap-1 font-medium cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{showHint ? 'Tutup Petunjuk' : 'Lihat Petunjuk Sandi'}</span>
            </button>
          )}
        </div>
        <div className="relative">
          <input
            {...register('password')}
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            className={`w-full px-4 py-2.5 pr-10 rounded-lg border bg-white/50 dark:bg-black/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 ${
              errors.password ? 'border-red-500/50' : 'border-border'
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
        )}

        {/* Display Password Hint if toggled */}
        {showHint && savedHint && (
          <div className="mt-2 p-3 rounded-xl bg-white/40 dark:bg-black/40 backdrop-blur-md border border-white/40 shadow-xs text-xs text-muted-foreground flex items-start gap-2 animate-in fade-in duration-200">
            <KeyRound className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-foreground">Petunjuk Kata Sandi: </span>
              <span className="text-foreground/90 italic font-medium">{savedHint}</span>
            </div>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded-lg font-medium transition-all active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none shadow-sm cursor-pointer"
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

      <div className="pt-2 text-center border-t border-border/50">
        <button
          type="button"
          onClick={handleFillDemo}
          className="text-xs text-primary hover:underline font-medium inline-block cursor-pointer py-1 px-2 rounded hover:bg-primary/5 transition-colors"
        >
          Isi Otomatis Akun Admin (admin@smartpos.com / admin123)
        </button>
      </div>
    </form>
  );
};
