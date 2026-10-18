import React, { useState, useEffect } from 'react';
import { X, User, Mail, Lock, ShieldCheck } from 'lucide-react';
import api from '../../../lib/axios';

interface CashierData {
  id?: string;
  name: string;
  email: string;
  password?: string;
  storeId: string;
}

interface CashierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: CashierData | null;
  storeId: string;
}

export const CashierModal: React.FC<CashierModalProps> = ({ isOpen, onClose, onSuccess, initialData, storeId }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        email: initialData.email || '',
        password: '' // Don't pre-fill password for edit
      });
    } else {
      setFormData({ name: '', email: '', password: '' });
    }
    setError('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.name || !formData.email) {
      setError('Nama dan Email wajib diisi');
      return;
    }

    if (!initialData && !formData.password) {
      setError('Password wajib diisi untuk kasir baru');
      return;
    }

    try {
      setLoading(true);
      if (initialData?.id) {
        // Update
        const payload: any = { name: formData.name, email: formData.email };
        if (formData.password) {
          payload.password = formData.password;
        }
        await api.put(`/auth/cashier/${initialData.id}`, payload);
      } else {
        // Create
        await api.post('/auth/cashier', { ...formData, storeId });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Terjadi kesalahan saat menyimpan data kasir');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50  animate-in fade-in duration-200">
      <div className="bg-background border border-white/10 rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5 shrink-0">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            {initialData ? 'Edit Akses Kasir' : 'Buat Akses Kasir Baru'}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
              {error}
            </div>
          )}

          <form id="cashier-form" onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Nama Kasir</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Mis. Ahmad Budi"
                  className="w-full pl-10 pr-4 py-2.5 bg-background border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Token Akses</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="kasir1@smartpos.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-background border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                {initialData ? 'Password Baru (Opsional)' : 'Password'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  type="password"
                  required={!initialData}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={initialData ? "Kosongkan jika tidak ingin diubah" : "Minimal 6 karakter"}
                  className="w-full pl-10 pr-4 py-2.5 bg-background border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                />
              </div>
              {initialData && (
                <p className="text-xs text-muted-foreground mt-2">
                  Jika Anda mengisi kolom password ini, maka akses login kasir tersebut akan ikut berubah.
                </p>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 flex justify-end gap-3 bg-white/5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-white/10 transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            form="cashier-form"
            disabled={loading}
            className="px-5 py-2.5 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-md disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                Menyimpan...
              </>
            ) : (
              'Simpan Akses'
            )}
          </button>
        </div>
        
      </div>
    </div>
  );
};
