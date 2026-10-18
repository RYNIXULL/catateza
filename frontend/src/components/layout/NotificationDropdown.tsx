import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  AlertTriangle, 
  Receipt, 
  Coins, 
  Info, 
  CheckCheck, 
  Trash2, 
  X, 
  ChevronRight, 
  BellOff,
  Settings
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotificationStore } from '../../store/notificationStore';
import type { NotificationItem, NotificationType } from '../../store/notificationStore';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | NotificationType>('all');

  const { notifications, markAsRead, markAllAsRead, deleteNotification, clearAll } = useNotificationStore();

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filteredNotifications = notifications.filter((item) => {
    if (activeFilter === 'all') return true;
    return item.type === activeFilter;
  });

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const formatRelativeTime = (isoString: string) => {
    try {
      const now = new Date();
      const past = new Date(isoString);
      const diffMs = now.getTime() - past.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'Baru saja';
      if (diffMins < 60) return `${diffMins} mnt lalu`;
      if (diffHours < 24) return `${diffHours} jam lalu`;
      if (diffDays === 1) return 'Kemarin';
      return `${diffDays} hari lalu`;
    } catch {
      return 'Beberapa saat lalu';
    }
  };

  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case 'stock':
        return <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'transaction':
        return <Receipt className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'cashflow':
        return <Coins className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'system':
      default:
        return <Info className="w-4 h-4 text-primary" />;
    }
  };

  const getTypeBg = (type: NotificationType) => {
    switch (type) {
      case 'stock':
        return 'bg-amber-500/10 border-amber-500/20';
      case 'transaction':
        return 'bg-emerald-500/10 border-emerald-500/20';
      case 'cashflow':
        return 'bg-blue-500/10 border-blue-500/20';
      case 'system':
      default:
        return 'bg-primary/10 border-primary/20';
    }
  };

  const handleNotificationClick = (item: NotificationItem) => {
    markAsRead(item.id);
    if (item.link) {
      navigate(item.link);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, y: 10, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.96 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="absolute right-0 top-full mt-3 w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-white/80 dark:bg-zinc-900/85 backdrop-blur-md border border-white/40 dark:border-white/10 rounded-2xl shadow-xl z-50 overflow-hidden flex flex-col"
          style={{ maxHeight: 'calc(100vh - 110px)' }}
        >
          {/* Header */}
          <div className="p-4 border-b border-white/20 dark:border-white/10 flex items-center justify-between bg-white/40 dark:bg-black/20">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-primary/10 rounded-xl text-primary">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  Notifikasi
                  {unreadCount > 0 && (
                    <span className="bg-primary text-white text-[11px] font-semibold px-2 py-0.5 rounded-full">
                      {unreadCount} baru
                    </span>
                  )}
                </h3>
                <p className="text-xs text-muted-foreground">Pemberitahuan aktivitas sistem & toko</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  title="Tandai semua dibaca"
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/40 dark:hover:bg-white/10 transition-colors"
                >
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  title="Hapus semua"
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-white/40 dark:hover:bg-white/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Filter Pills */}
          <div className="px-4 py-2 border-b border-white/10 flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-white/20 dark:bg-black/10">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                activeFilter === 'all'
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-white/40 dark:bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/60'
              }`}
            >
              Semua ({notifications.length})
            </button>
            <button
              onClick={() => setActiveFilter('stock')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
                activeFilter === 'stock'
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-white/40 dark:bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/60'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              Stok
            </button>
            <button
              onClick={() => setActiveFilter('transaction')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
                activeFilter === 'transaction'
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-white/40 dark:bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/60'
              }`}
            >
              <Receipt className="w-3 h-3" />
              Transaksi
            </button>
            <button
              onClick={() => setActiveFilter('system')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
                activeFilter === 'system'
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-white/40 dark:bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/60'
              }`}
            >
              <Info className="w-3 h-3" />
              Sistem
            </button>
          </div>

          {/* List of Notifications */}
          <div className="flex-1 overflow-y-auto divide-y divide-white/10 max-h-[360px] p-2 space-y-1">
            {filteredNotifications.length === 0 ? (
              <div className="py-12 px-4 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-muted/40 flex items-center justify-center mb-3 text-muted-foreground">
                  <BellOff className="w-6 h-6 opacity-60" />
                </div>
                <p className="text-sm font-medium text-foreground">Tidak ada notifikasi</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Semua aktivitas operasional toko sudah diperbarui
                </p>
              </div>
            ) : (
              filteredNotifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`group relative p-3 rounded-xl transition-all cursor-pointer flex items-start gap-3 border ${
                    item.isRead
                      ? 'bg-transparent border-transparent hover:bg-white/40 dark:hover:bg-white/5'
                      : 'bg-primary/[0.04] dark:bg-primary/[0.08] border-primary/20 hover:bg-primary/[0.08]'
                  }`}
                >
                  {/* Category Icon */}
                  <div className={`p-2 rounded-xl border shrink-0 mt-0.5 ${getTypeBg(item.type)}`}>
                    {getTypeIcon(item.type)}
                  </div>

                  {/* Text content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="font-semibold text-xs text-foreground truncate">
                        {item.title}
                      </span>
                      <span className="text-[10px] text-muted-foreground shrink-0 font-medium">
                        {formatRelativeTime(item.timestamp)}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {item.message}
                    </p>

                    {item.badge && (
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <span className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-md bg-white/50 dark:bg-white/10 text-foreground border border-white/30">
                          {item.badge}
                        </span>
                        {item.link && (
                          <span className="text-[10px] text-primary font-medium flex items-center gap-0.5 group-hover:underline">
                            Lihat detail <ChevronRight className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Status dot & delete button */}
                  <div className="flex flex-col items-end justify-between self-stretch shrink-0">
                    {!item.isRead && (
                      <span className="w-2 h-2 rounded-full bg-primary ring-2 ring-primary/20"></span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(item.id);
                      }}
                      title="Hapus notifikasi"
                      className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-red-500 rounded transition-all mt-auto"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-white/20 dark:border-white/10 bg-white/40 dark:bg-black/20 flex items-center justify-between text-xs">
            <button
              onClick={() => {
                navigate('/settings?tab=Notifikasi');
                onClose();
              }}
              className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5 font-medium"
            >
              <Settings className="w-3.5 h-3.5" />
              Pengaturan Notifikasi
            </button>
            <span className="text-[11px] text-muted-foreground font-mono">
              Smart POS v1.0
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
