import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../hooks/useToast';
import { Clock, ShieldAlert, LogOut, CheckCircle } from 'lucide-react';

interface AutoLogoutSettings {
  timeoutMinutes: string; // 'never' | '15' | '30' | '60' | '120' | '240' | '480'
  showWarning: boolean;
  rememberEmail: boolean;
  passwordHint: string;
}

interface AutoLogoutContextType {
  settings: AutoLogoutSettings;
  updateSettings: (newSettings: Partial<AutoLogoutSettings>) => void;
  resetTimer: () => void;
}

const STORAGE_KEYS = {
  MINUTES: 'smartpos_auto_logout_minutes',
  WARNING: 'smartpos_auto_logout_warning',
  REMEMBER_EMAIL: 'smartpos_remember_email',
  PASSWORD_HINT: 'smartpos_password_hint',
  LAST_EMAIL: 'smartpos_last_email',
};

const AutoLogoutContext = createContext<AutoLogoutContextType | null>(null);

export const useAutoLogout = () => {
  const context = useContext(AutoLogoutContext);
  if (!context) {
    throw new Error('useAutoLogout must be used within an AutoLogoutProvider');
  }
  return context;
};

export const AutoLogoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { warning } = useToast();

  const [settings, setSettings] = useState<AutoLogoutSettings>(() => ({
    timeoutMinutes: localStorage.getItem(STORAGE_KEYS.MINUTES) || 'never',
    showWarning: localStorage.getItem(STORAGE_KEYS.WARNING) !== 'false',
    rememberEmail: localStorage.getItem(STORAGE_KEYS.REMEMBER_EMAIL) !== 'false',
    passwordHint: localStorage.getItem(STORAGE_KEYS.PASSWORD_HINT) || '',
  }));

  const [showWarningModal, setShowWarningModal] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(60);

  const lastActivityRef = useRef<number>(Date.now());
  const timerIntervalRef = useRef<any>(null);

  const updateSettings = (newSettings: Partial<AutoLogoutSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      if (newSettings.timeoutMinutes !== undefined) {
        localStorage.setItem(STORAGE_KEYS.MINUTES, updated.timeoutMinutes);
      }
      if (newSettings.showWarning !== undefined) {
        localStorage.setItem(STORAGE_KEYS.WARNING, String(updated.showWarning));
      }
      if (newSettings.rememberEmail !== undefined) {
        localStorage.setItem(STORAGE_KEYS.REMEMBER_EMAIL, String(updated.rememberEmail));
      }
      if (newSettings.passwordHint !== undefined) {
        localStorage.setItem(STORAGE_KEYS.PASSWORD_HINT, updated.passwordHint);
      }
      return updated;
    });
    resetTimer();
  };

  const resetTimer = () => {
    lastActivityRef.current = Date.now();
    setShowWarningModal(false);
    setSecondsRemaining(60);
  };

  // Activity listeners
  useEffect(() => {
    if (!isAuthenticated || settings.timeoutMinutes === 'never') return;

    const handleActivity = () => {
      // If modal is not currently open, update activity timestamp
      if (!showWarningModal) {
        lastActivityRef.current = Date.now();
      }
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(ev => window.addEventListener(ev, handleActivity, { passive: true }));

    return () => {
      events.forEach(ev => window.removeEventListener(ev, handleActivity));
    };
  }, [isAuthenticated, settings.timeoutMinutes, showWarningModal]);

  // Main inactivity interval check
  useEffect(() => {
    if (!isAuthenticated || settings.timeoutMinutes === 'never') {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      setShowWarningModal(false);
      return;
    }

    const timeoutMs = parseInt(settings.timeoutMinutes, 10) * 60 * 1000;
    const warningLeadMs = 60 * 1000; // 60 seconds before timeout

    timerIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastActivityRef.current;
      const timeLeftMs = timeoutMs - elapsed;

      if (timeLeftMs <= 0) {
        // Time expired: execute auto-logout
        if (settings.rememberEmail && user?.email) {
          localStorage.setItem(STORAGE_KEYS.LAST_EMAIL, user.email);
        }
        setShowWarningModal(false);
        logout();
        warning(
          'Sesi Berakhir Otomatis',
          'Anda telah keluar otomatis karena tidak ada aktivitas kasir sesuai pengaturan keamanan.'
        );
      } else if (timeLeftMs <= warningLeadMs) {
        // Less than 60 seconds remaining
        const remainingSec = Math.max(1, Math.ceil(timeLeftMs / 1000));
        setSecondsRemaining(remainingSec);
        if (settings.showWarning && !showWarningModal) {
          setShowWarningModal(true);
        }
      } else {
        if (showWarningModal) {
          setShowWarningModal(false);
        }
      }
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isAuthenticated, settings, user, logout, warning, showWarningModal]);

  const handleConfirmStay = () => {
    resetTimer();
  };

  const handleConfirmLogout = () => {
    if (settings.rememberEmail && user?.email) {
      localStorage.setItem(STORAGE_KEYS.LAST_EMAIL, user.email);
    }
    setShowWarningModal(false);
    logout();
  };

  return (
    <AutoLogoutContext.Provider value={{ settings, updateSettings, resetTimer }}>
      {children}

      {/* Warning Countdown Modal */}
      {showWarningModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="glass w-full max-w-md rounded-2xl border border-white/20 shadow-2xl p-6 text-foreground space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-500 border border-amber-500/30 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Peringatan Sesi Tidak Aktif</h3>
                <p className="text-xs text-muted-foreground">Tidak ada aktivitas pada aplikasi kasir.</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center space-y-1">
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Sesi Anda akan otomatis keluar dalam:</p>
              <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 tracking-wider">
                {secondsRemaining}s
              </div>
            </div>

            {settings.passwordHint && (
              <div className="p-3 rounded-xl bg-white/40 dark:bg-black/40 border border-white/20 text-xs text-muted-foreground flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-foreground">Petunjuk Kata Sandi Anda: </span>
                  <span className="italic">{settings.passwordHint}</span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleConfirmLogout}
                className="flex-1 px-4 py-2.5 rounded-xl border border-white/20 hover:bg-white/10 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                Keluar Sekarang
              </button>
              <button
                type="button"
                onClick={handleConfirmStay}
                className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-white hover:bg-primary/90 text-xs font-semibold transition-all shadow-md flex items-center justify-center gap-1.5"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Tetap Masuk
              </button>
            </div>
          </div>
        </div>
      )}
    </AutoLogoutContext.Provider>
  );
};
