import React, { useState, useEffect } from 'react';
import { Banknote, Boxes, ShoppingBag, TrendingUp } from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../../../lib/axios';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

const formatRupiah = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0
  }).format(value || 0);
};

export const DashboardPage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  const [report, setReport] = useState({ revenue: 0, expenses: 0 });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [period, setPeriod] = useState('week');
  const [allActivities, setAllActivities] = useState<any[]>([]);

  useEffect(() => {
    // Fetch Profit/Loss for selected period
    api.get(`/reports/profit-loss?period=${period}`).then(r => setReport(r.data)).catch(() => {});
  }, [period]);

  useEffect(() => {
    // Fetch cashflow and transactions, then merge them
    Promise.all([
      api.get('/cashflow/all').catch(() => ({ data: { data: [] } })),
      api.get('/transactions').catch(() => ({ data: [] }))
    ]).then(([cashflowRes, txRes]) => {
      const cashflows = cashflowRes.data.data || [];
      const transactions = txRes.data || [];
      
      // Map transactions to a common format
      const txActivities = transactions.map((tx: any) => ({
        id: tx.id,
        type: 'INCOME',
        amount: tx.subtotal, // using subtotal as income
        date: tx.createdAt,
        description: `Penjualan ${tx.invoiceNumber}`,
      }));

      // Filter out transactions that are already recorded in cashflow
      const existingInvoices = new Set(
        cashflows
          .filter((cf: any) => cf.category === 'PENJUALAN' || cf.description?.includes('INV-'))
          .map((cf: any) => {
            const match = cf.description?.match(/INV-[A-Za-z0-9-]+/);
            return match ? match[0] : null;
          })
          .filter(Boolean)
      );

      const uniqueTxActivities = txActivities.filter((tx: any) => {
        const match = tx.description?.match(/INV-[A-Za-z0-9-]+/);
        return match ? !existingInvoices.has(match[0]) : true;
      });

      // Combine and sort descending by date
      const combined = [...cashflows, ...uniqueTxActivities].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      setAllActivities(combined);
      setRecentActivities(combined.slice(0, 5));
    });
  }, []);

  useEffect(() => {
    if (!allActivities.length) return;
    
    let filtered = allActivities;
    const now = new Date();
    let startDate = new Date(now);
    
    if (period === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else if (period === 'month') {
      startDate.setDate(now.getDate() - 30);
    } else if (period === '3months') {
      startDate.setMonth(now.getMonth() - 3);
    } else if (period === 'year') {
      startDate.setFullYear(now.getFullYear() - 1);
    } else {
      startDate = new Date(0); // all
    }
    
    filtered = allActivities.filter(c => new Date(c.date) >= startDate);
    
    const grouped: Record<string, number> = {};
    filtered.forEach((item: any) => {
      if (item.type === 'INCOME') {
        const d = new Date(item.date);
        let key = '';
        if (period === 'year' || period === 'all' || period === '3months') {
           key = d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
        } else {
           key = d.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
        }
        grouped[key] = (grouped[key] || 0) + Number(item.amount);
      }
    });
    
    // Sort chronologically
    const sortedKeys = Object.keys(grouped).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    const cData = sortedKeys.map(k => ({ name: k, total: grouped[k] }));
    
    if (cData.length === 0) {
      setChartData([{ name: 'Belum ada data', total: 0 }]); // Dummy if no data
    } else if (cData.length === 1) {
      setChartData([{ name: 'Sebelumnya', total: 0 }, ...cData]); // Add a starting point to draw the line
    } else {
      setChartData(cData);
    }
  }, [allActivities, period]);

  const periodLabels: Record<string, string> = { week: '7 Hari', month: '1 Bulan', '3months': '3 Bulan', year: '1 Tahun', all: 'Semua' };
  const stats = [
    { title: `Total Pendapatan (${periodLabels[period] || 'Bulan Ini'})`, value: formatRupiah(report.revenue), icon: Banknote, route: '/reports' },
    { title: `Total Pengeluaran (${periodLabels[period] || 'Bulan Ini'})`, value: formatRupiah(report.expenses), icon: ShoppingBag, route: '/reports' },
    { title: 'Manajemen Inventaris', value: 'Lihat Stok', icon: Boxes, route: '/inventory' },
    { title: 'Kelola Cabang', value: 'Daftar Cabang', icon: TrendingUp, route: '/branches' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Ringkasan performa bisnis Anda hari ini.</p>
        </motion.div>
      </div>

      {/* Stats Grid */}
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div 
            key={idx} 
            variants={itemVariants}
            whileHover={{ scale: 1.02, translateY: -4 }}
            onClick={() => navigate(stat.route)}
            className="glass p-6 rounded-2xl border border-white/20 shadow-sm relative overflow-hidden group cursor-pointer transition-shadow hover:shadow-lg hover:shadow-primary/10"
          >
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-all duration-500"></div>
            
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="w-12 h-12 rounded-xl bg-white/50 dark:bg-black/50 flex items-center justify-center ring-1 ring-white/30 shadow-sm group-hover:scale-110 transition-transform duration-300">
                <stat.icon className="w-6 h-6 text-primary" />
              </div>
            </div>
            
            <div className="relative z-10">
              <h3 className="text-sm font-medium text-muted-foreground">{stat.title}</h3>
              <p className="text-xl font-bold text-foreground mt-1 group-hover:text-primary transition-colors">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Placeholder for Charts / Recent TrendingUp */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass rounded-2xl border border-white/20 p-6 shadow-sm min-h-[400px]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Grafik Pemasukan</h2>
            <select 
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-white/50 dark:bg-black/50 border border-border rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
            >
              <option value="week">7 Hari Terakhir</option>
              <option value="month">1 Bulan Terakhir</option>
              <option value="3months">3 Bulan Terakhir</option>
              <option value="year">1 Tahun Terakhir</option>
              <option value="all">Semua Waktu</option>
            </select>
          </div>
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(221.2 83.2% 53.3%)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="hsl(221.2 83.2% 53.3%)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `Rp ${value / 1000}k`} />
                <Tooltip 
                  formatter={(value: number) => formatRupiah(value)}
                  contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                <Area type="monotone" dataKey="total" stroke="hsl(221.2 83.2% 53.3%)" fillOpacity={1} fill="url(#colorTotal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="glass rounded-2xl border border-white/20 p-6 shadow-sm min-h-[400px]">
          <h2 className="text-lg font-bold mb-4">Aktivitas Terkini</h2>
          <div className="space-y-4">
            {recentActivities.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-8">Belum ada aktivitas.</div>
            ) : (
              recentActivities.map((act) => (
                <div key={act.id} onClick={() => navigate('/reports')} className="flex items-center gap-4 p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ring-1 ${act.type === 'INCOME' ? 'bg-emerald-500/10 text-emerald-500 ring-emerald-500/20' : 'bg-rose-500/10 text-rose-500 ring-rose-500/20'}`}>
                    {act.type === 'INCOME' ? 'IN' : 'OUT'}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-medium truncate">{act.description}</p>
                    <p className="text-xs text-muted-foreground">{new Date(act.date).toLocaleDateString('id-ID')}</p>
                  </div>
                  <div className={`text-sm font-bold ${act.type === 'INCOME' ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {act.type === 'INCOME' ? '+' : '-'}{formatRupiah(Number(act.amount))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
