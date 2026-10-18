import React, { useState, useEffect } from 'react';
import { PlusCircle, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, WalletCards, Trash, ShoppingBag } from 'lucide-react';
import { cashFlowApi } from '../api/cashFlowApi';
import type { CashFlowData } from '../api/cashFlowApi';
import { CashFlowModal } from './CashFlowModal';
import { ConfirmModal } from '../../../components/ui/ConfirmModal';
import { useToast } from '../../../hooks/useToast';

interface BranchBookkeepingProps {
  storeId: string;
}

const formatRupiah = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

export const BranchBookkeeping: React.FC<BranchBookkeepingProps> = ({ storeId }) => {
  const [data, setData] = useState<CashFlowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { success, error } = useToast();

  const fetchCashFlow = async () => {
    try {
      setLoading(true);
      const res = await cashFlowApi.getByStore(storeId);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCashFlow();
  }, [storeId]);

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      setIsDeleting(true);
      await cashFlowApi.delete(deleteTargetId);
      success("Berhasil", "Catatan pembukuan berhasil dihapus.");
      setDeleteTargetId(null);
      fetchCashFlow();
    } catch (err) {
      console.error(err);
      error("Gagal", "Gagal menghapus catatan pembukuan.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-primary" />
          Dashboard Arus Kas
        </h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
        >
          <PlusCircle className="w-4 h-4" /> Catat Manual
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
          <div className="relative">
             <div className="w-12 h-12 bg-green-500/20 text-green-500 rounded-xl flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Total Pemasukan</p>
            <h3 className="text-2xl font-bold text-foreground">{formatRupiah(data?.summary.totalIncome || 0)}</h3>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
          <div className="relative">
             <div className="w-12 h-12 bg-red-500/20 text-red-500 rounded-xl flex items-center justify-center mb-4">
              <TrendingDown className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Total Pengeluaran</p>
            <h3 className="text-2xl font-bold text-foreground">{formatRupiah(data?.summary.totalExpense || 0)}</h3>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
          <div className="relative">
             <div className="w-12 h-12 bg-primary/20 text-primary rounded-xl flex items-center justify-center mb-4">
              <WalletCards className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Saldo Kas Bersih</p>
            <h3 className="text-2xl font-bold text-foreground">{formatRupiah(data?.summary.balance || 0)}</h3>
          </div>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden mt-6">
        <div className="p-6 border-b border-white/10">
          <h3 className="text-lg font-bold text-foreground">Riwayat Transaksi</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="p-4 text-sm font-medium text-muted-foreground">Tanggal</th>
                <th className="p-4 text-sm font-medium text-muted-foreground">Keterangan</th>
                <th className="p-4 text-sm font-medium text-muted-foreground">Tipe</th>
                <th className="p-4 text-sm font-medium text-muted-foreground">Nominal</th>
                <th className="p-4 text-sm font-medium text-muted-foreground">Oleh</th>
                <th className="p-4 text-sm font-medium text-muted-foreground w-16">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {data?.data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    Belum ada riwayat pembukuan untuk cabang ini.
                  </td>
                </tr>
              ) : (
                data?.data.map((item) => {
                  const isPosSale = item.category === 'PENJUALAN' || item.description?.includes('Penjualan POS');
                  return (
                    <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4 text-sm text-foreground">
                        {new Date(item.date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </td>
                      <td className="p-4 text-sm text-foreground font-medium">
                        <div className="flex items-center gap-2">
                          {isPosSale && (
                            <span className="p-1 rounded-md bg-primary/10 text-primary border border-primary/20" title="Penjualan POS Otomatis">
                              <ShoppingBag className="w-3.5 h-3.5" />
                            </span>
                          )}
                          <span>{item.description}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        {item.type === 'INCOME' ? (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
                            isPosSale 
                              ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' 
                              : 'bg-green-500/10 text-green-500 border-green-500/20'
                          }`}>
                            <ArrowUpRight className="w-3 h-3" /> {isPosSale ? 'Penjualan POS' : 'Pemasukan'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/10 text-red-500 text-xs font-medium border border-red-500/20">
                            <ArrowDownRight className="w-3 h-3" /> Pengeluaran
                          </span>
                        )}
                      </td>
                      <td className={`p-4 text-sm font-bold ${item.type === 'INCOME' ? 'text-green-500' : 'text-red-500'}`}>
                        {item.type === 'INCOME' ? '+' : '-'} {formatRupiah(Number(item.amount))}
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {item.user?.name || 'Sistem'}
                      </td>
                      <td className="p-4">
                        {isPosSale ? (
                          <span className="text-xs text-muted-foreground px-2 py-1 rounded-md bg-white/5 border border-white/10 select-none">
                            Otomatis
                          </span>
                        ) : (
                          <button 
                            onClick={() => setDeleteTargetId(item.id)}
                            className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Hapus Catatan"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CashFlowModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          fetchCashFlow();
        }}
        storeId={storeId}
      />

      <ConfirmModal
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={confirmDelete}
        isLoading={isDeleting}
        title="Hapus Catatan Pembukuan"
        message="Apakah Anda yakin ingin menghapus catatan pembukuan manual ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Ya, Hapus"
        cancelText="Batal"
      />
    </div>
  );
};
