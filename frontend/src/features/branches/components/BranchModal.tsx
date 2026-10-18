import React, { useState, useEffect } from 'react';
import { X, Building2, MapPin, Phone } from 'lucide-react';
import api from '../../../lib/axios';

interface Building2 {
  id?: string;
  name: string;
  address: string | null;
  phone: string | null;
}

interface BranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: Building2; // If provided, it's edit mode
}

export const BranchModal: React.FC<BranchModalProps> = ({ isOpen, onClose, onSuccess, initialData }) => {
  const [formData, setFormData] = useState<Building2>({
    name: '',
    address: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        address: initialData.address || '',
        phone: initialData.phone || ''
      });
    } else {
      setFormData({ name: '', address: '', phone: '' });
    }
    setError('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.name) {
      setError('Nama cabang wajib diisi');
      return;
    }

    try {
      setLoading(true);
      if (initialData?.id) {
        // Update
        await api.put(`/store/${initialData.id}`, formData);
      } else {
        // Create
        await api.post('/store', formData);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Terjadi kesalahan saat menyimpan data cabang');
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
            <Building2 className="w-5 h-5 text-primary" />
            {initialData ? 'Edit Cabang' : 'Tambah Cabang Baru'}
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

          <form id="branch-form" onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Nama Cabang</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Mis. Cabang Jakarta Pusat"
                  className="w-full pl-10 pr-4 py-2.5 bg-background border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Alamat (Opsional)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 pt-3 pointer-events-none">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </div>
                <textarea
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Alamat lengkap cabang"
                  rows={3}
                  className="w-full pl-10 pr-4 py-2.5 bg-background border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground resize-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Nomor Telepon (Opsional)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  type="text"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Mis. 08123456789"
                  className="w-full pl-10 pr-4 py-2.5 bg-background border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                />
              </div>
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
            form="branch-form"
            disabled={loading}
            className="px-5 py-2.5 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-md disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                Menyimpan...
              </>
            ) : (
              'Simpan Cabang'
            )}
          </button>
        </div>
        
      </div>
    </div>
  );
};
