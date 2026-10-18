import React, { useState, useEffect } from 'react';
import { Bell, SearchCode, LogOut, Clock, CalendarDays, Menu } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { NotificationDropdown } from './NotificationDropdown';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export const Topbar = ({ onMenuClick }: { onMenuClick?: () => void }) => {
  const { logout } = useAuthStore();
  const { notifications } = useNotificationStore();
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(date);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-20 bg-white/40 dark:bg-black/40 backdrop-blur-md border-b border-white/40 sticky top-0 z-20 px-4 md:px-8 flex items-center justify-between transition-all duration-300 shadow-sm">
      <div className="flex-1 flex items-center gap-3 md:gap-4">
        {/* Mobile Menu Button */}
        <button 
          onClick={onMenuClick}
          className="md:hidden p-2 text-muted-foreground hover:text-foreground hover:bg-white/10 rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="relative max-w-md w-full hidden sm:block">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchCode className="h-5 w-5 text-muted-foreground" />
          </div>
          <input
            type="text"
            placeholder="Cari transaksi, produk, atau pelanggan..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/30 bg-white/40 dark:bg-black/40 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-sm"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Live Clock Display */}
        <div className="hidden md:flex flex-col items-end justify-center mr-4">
          <div className="flex items-center gap-2 text-primary font-bold text-lg tracking-wider font-mono">
            <Clock className="w-4 h-4 text-primary" />
            {formatTime(time)}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <CalendarDays className="w-3.5 h-3.5" />
            {formatDate(time)}
          </div>
        </div>

        {/* Notification Bell with Dropdown */}
        <div className="relative">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsNotificationOpen((prev) => !prev)}
            aria-label="Notifikasi"
            className={`relative p-2.5 rounded-full transition-colors ${
              isNotificationOpen 
                ? 'bg-primary/15 text-primary' 
                : 'hover:bg-white/50 dark:hover:bg-black/50 text-muted-foreground hover:text-foreground'
            }`}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full ring-2 ring-white dark:ring-background flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </motion.button>

          <NotificationDropdown 
            isOpen={isNotificationOpen} 
            onClose={() => setIsNotificationOpen(false)} 
          />
        </div>

        <div className="w-px h-8 bg-border"></div>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Keluar
        </motion.button>
      </div>
    </header>
  );
};

