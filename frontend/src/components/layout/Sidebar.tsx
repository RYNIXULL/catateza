import React from 'react';
import { NavLink } from 'react-router-dom';
import { Gauge, Calculator, Boxes, UsersRound, SlidersHorizontal, Building2, AreaChart, X } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { motion } from 'framer-motion';

export const Sidebar = ({ isOpen = false, onClose }: { isOpen?: boolean; onClose?: () => void }) => {
  const { user } = useAuthStore();
  
  const menuItems = [
    { icon: Gauge, label: 'Dashboard', path: '/dashboard' },
    { icon: Calculator, label: 'Kasir (POS)', path: '/pos' },
    { icon: Building2, label: 'Cabang', path: '/branches' },
    { icon: Boxes, label: 'Inventaris', path: '/inventory' },
    { icon: AreaChart, label: 'Laporan', path: '/reports' },
    { icon: UsersRound, label: 'Karyawan', path: '/employees' },
    { icon: SlidersHorizontal, label: 'Pengaturan', path: '/settings' },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50  z-20 md:hidden"
          onClick={onClose}
        />
      )}
      
      <aside className={`w-64 h-screen fixed left-0 top-0 border-r border-white/20 glass flex flex-col z-30 transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="p-6 flex items-center justify-between gap-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center ring-1 ring-primary/30">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-foreground text-lg leading-tight truncate w-32">
                {user?.role === 'CASHIER' && user?.store ? user.store.name : 'Catat Eza'}
              </h2>
              <p className="text-xs text-muted-foreground font-medium truncate w-32">
                {user?.role === 'CASHIER' && user?.store?.address ? user.store.address : 'Enterprise'}
              </p>
            </div>
          </div>
          {/* Close Button for Mobile */}
          <button 
            onClick={onClose}
            className="md:hidden p-2 text-muted-foreground hover:text-foreground hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-1.5 scrollbar-hide">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 mt-2 px-2">Menu Utama</div>
          {menuItems.map((item) => (
            <motion.div key={item.path} whileHover={{ scale: 1.02, x: 4 }} whileTap={{ scale: 0.98 }}>
              <NavLink
                to={item.path}
                onClick={() => { if (window.innerWidth < 768 && onClose) onClose(); }}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 font-medium ${
                    isActive 
                      ? 'bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20' 
                      : 'text-muted-foreground hover:bg-white/50 dark:hover:bg-black/50 hover:text-foreground'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </NavLink>
            </motion.div>
          ))}
        </div>
        
        <div className="p-4 border-t border-white/10">
          <div className="p-3 rounded-xl bg-white/40 dark:bg-black/40  border border-white/20 shadow-sm flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-blue-400 flex items-center justify-center text-white font-bold shadow-md">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold text-foreground truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.role}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
