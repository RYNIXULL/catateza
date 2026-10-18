import React, { useState } from 'react';
import { X, TrendingUp, TrendingDown, AlignLeft, Calendar, Loader2 } from 'lucide-react';
import { cashFlowApi } from '../api/cashFlowApi';
import { useToast } from '../../../hooks/useToast';

interface CashFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  storeId: string;
}

export const CashFlowModal: React.FC<CashFlowModalProps> = ({ isOpen, onClose, onSuccess, storeId }) => {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'EXPENSE' as 'INCOME' | 'EXPENSE',
    amount: '',
    description: '',
    date: new Date().toISOString().substring(0, 10),
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.description) {
      error("Error", "Nominal dan Keterangan wajib diisi!");
      return;
    }

    try {
      setLoading(true);
      await cashFlowApi.create({
        type: formData.type,
        amount: Number(formData.amount),
        description: formData.description,
        date: formData.date,
        storeId,
      } as any);

      success("Berhasil", "Data pembukuan berhasil disimpan!");
      onSuccess();
      setFormData({
        type: 'EXPENSE',
        amount: '',
        description: '',
        date: new Date().toISOString().substring(0, 10),
      });
    } catch (err: any) {
      console.error(err);
      error("Gagal", err.response?.data?.error || "Gagal menyimpan data pembukuan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      <div className="absolute inset-0 bg-black/60  transition-opacity" onClick={onClose} />
      
      <div className="bg-white/10 dark:bg-black/40  border border-white/20 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
          <h2 className="text-xl font-bold text-foreground">Catat Pembukuan Baru</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Tipe Transaksi (Income / Expense) */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'INCOME' })}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${
                formData.type === 'INCOME' 
                  ? 'bg-green-500/20 border-green-500/50 text-green-600 dark:text-green-400 font-medium' 
                  : 'bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10'
              }`}
            >
              <TrendingUp className="w-5 h-5" /> Pemasukan
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'EXPENSE' })}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${
                formData.type === 'EXPENSE' 
                  ? 'bg-red-500/20 border-red-500/50 text-red-600 dark:text-red-400 font-medium' 
                  : 'bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10'
              }`}
            >
              <TrendingDown className="w-5 h-5" /> Pengeluaran
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Nominal (Rp)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">Rp</span>
              <input 
                type="number" 
                required
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground transition-all"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Keterangan</label>
            <div className="relative">
              <AlignLeft className="w-5 h-5 absolute left-4 top-3 text-muted-foreground" />
              <textarea 
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground transition-all resize-none h-24"
                placeholder="Cth: Beli Tisu, Bayar Listrik, dll..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Tanggal</label>
            <div className="relative">
              <Calendar className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input 
                type="date" 
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground transition-all"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 flex gap-3">
            <button 
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-foreground font-medium transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Simpan Data'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
