import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, WalletCards, CalendarDays, Building2, Download, FileText, Loader2 } from 'lucide-react';
import api from '../../../lib/axios';
import { useToast } from '../../../hooks/useToast';
import { exportFinancialReportExcel } from '../../../utils/excelExport';

import { motion } from 'framer-motion';

const formatRupiah = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value || 0);
};

export const ReportsPage = () => {
  const { success, error } = useToast();
  const [period, setPeriod] = useState('all');
  const [storeId, setStoreId] = useState('all');
  const [stores, setStores] = useState<any[]>([]);
  const [reportData, setReportData] = useState({
    revenue: 0, discounts: 0, netRevenue: 0, cogs: 0, grossProfit: 0, expenses: 0,
  });
  const [cashFlowData, setCashFlowData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    api.get('/store').then(r => setStores(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const cfPromise = api.get(`/cashflow/${storeId}`).then(r => setCashFlowData(r.data.data || [])).catch(() => {});
    let plUrl = `/reports/profit-loss?period=${period}`;
    if (storeId !== 'all') plUrl += `&storeId=${storeId}`;
    const plPromise = api.get(plUrl).then(r => setReportData(r.data)).catch(() => {});
    Promise.all([cfPromise, plPromise]).finally(() => setLoading(false));
  }, [period, storeId]);

  const LabaKotor = reportData.grossProfit;
  const LabaBersih = LabaKotor - (reportData.expenses || 0);

  const handleDownload = async () => {
    try {
      setIsExporting(true);
      const selectedStore = stores.find(s => s.id === storeId);
      const currentStoreName = storeId === 'all' ? 'Semua Cabang' : (selectedStore?.name || 'Cabang Terpilih');
      
      await exportFinancialReportExcel({
        reportData: {
          ...reportData,
          grossProfit: LabaKotor,
          netProfit: LabaBersih
        },
        cashFlowData,
        period,
        storeName: currentStoreName,
      });

      success("Export Excel Berhasil", "Laporan keuangan profesional telah tersimpan.");
    } catch (err: any) {
      console.error("Export error:", err);
      error("Gagal Export Excel", err.message || "Terjadi kesalahan saat mengekspor laporan.");
    } finally {
      setIsExporting(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="text-2xl font-bold text-foreground">Laporan Keuangan</h1>
          <p className="text-muted-foreground mt-1">Ringkasan pendapatan, pengeluaran, dan laba bersih.</p>
        </motion.div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleDownload}
          disabled={isExporting}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
        >
          {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
          <span>{isExporting ? 'Mengekspor...' : 'Export Excel'}</span>
        </motion.button>
      </div>

      <div className="bg-card/50  border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-2 flex-1">
          <CalendarDays className="text-muted-foreground" size={18} />
          <select 
            value={period} 
            onChange={(e) => setPeriod(e.target.value)}
            className="flex-1 bg-background/50 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="today">Hari Ini</option>
            <option value="week">Minggu Ini</option>
            <option value="month">Bulan Ini</option>
            <option value="year">Tahun Ini</option>
            <option value="all">Semua Waktu</option>
          </select>
        </div>
        
        <div className="flex items-center gap-2 flex-1">
          <Building2 className="text-muted-foreground" size={18} />
          <select 
            value={storeId} 
            onChange={(e) => setStoreId(e.target.value)}
            className="flex-1 bg-background/50 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="all">Semua Cabang</option>
            {stores.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="glass rounded-2xl border border-white/20 p-6 shadow-sm relative overflow-hidden group hover:shadow-lg hover:shadow-primary/5 transition-all">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/10 rounded-full  group-hover:bg-primary/20 transition-colors"></div>
          <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-white/50 dark:bg-black/50 flex items-center justify-center ring-1 ring-white/30 shadow-sm group-hover:scale-110 transition-transform duration-300">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Pendapatan</p>
              <h3 className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">{formatRupiah(reportData.revenue)}</h3>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="glass rounded-2xl border border-white/20 p-6 shadow-sm relative overflow-hidden group hover:shadow-lg hover:shadow-red-500/5 transition-all">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-red-500/10 rounded-full  group-hover:bg-red-500/20 transition-colors"></div>
          <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-white/50 dark:bg-black/50 flex items-center justify-center ring-1 ring-white/30 shadow-sm group-hover:scale-110 transition-transform duration-300">
              <TrendingDown className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Pengeluaran</p>
              <h3 className="text-2xl font-bold text-foreground group-hover:text-red-500 transition-colors">{formatRupiah(reportData.expenses || 0)}</h3>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="glass rounded-2xl border border-white/20 p-6 shadow-sm relative overflow-hidden group hover:shadow-lg hover:shadow-emerald-500/5 transition-all">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/10 rounded-full  group-hover:bg-emerald-500/20 transition-colors"></div>
          <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-white/50 dark:bg-black/50 flex items-center justify-center ring-1 ring-white/30 shadow-sm group-hover:scale-110 transition-transform duration-300">
              <WalletCards className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Laba Bersih</p>
              <h3 className={`text-2xl font-bold transition-colors ${LabaBersih >= 0 ? 'text-foreground group-hover:text-emerald-500' : 'text-foreground group-hover:text-rose-500'}`}>
                {formatRupiah(LabaBersih)}
              </h3>
            </div>
          </div>
        </motion.div>
        </motion.div>

          <div className="bg-card/50  border border-white/10 rounded-2xl overflow-hidden mt-6">
            <div className="p-4 border-b border-white/10 flex items-center gap-3">
              <FileText className="text-primary" size={20} />
              <h3 className="font-semibold text-foreground">Detail Transaksi Kas</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10">
                    <th className="px-4 py-3 font-semibold text-muted-foreground">Tanggal</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground">Keterangan</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground">Tipe</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground text-right">Nominal</th>
                  </tr>
                </thead>
                <tbody>
                  {cashFlowData.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-muted-foreground">Belum ada transaksi</td>
                    </tr>
                  ) : (
                    cashFlowData.map((item, idx) => (
                      <tr 
                        key={item.id} 
                        className="border-b border-white/5 transition-colors cursor-pointer hover:bg-white/5"
                      >
                        <td className="p-4">{new Date(item.date).toLocaleDateString('id-ID')}</td>
                        <td className="p-4">{item.description}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${item.type === 'INCOME' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                            {item.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran'}
                          </span>
                        </td>
                        <td className={`p-4 font-bold text-right ${item.type === 'INCOME' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {item.type === 'INCOME' ? '+' : '-'}{formatRupiah(Number(item.amount))}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
