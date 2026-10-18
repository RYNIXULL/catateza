import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Building2, ArrowLeft, Boxes, UsersRound, AreaChart, TrendingUp, TrendingDown, Clock, MapPin, SearchCode, SlidersHorizontal, Pencil } from 'lucide-react';
import api from '../../../lib/axios';

import { BranchModal } from '../components/BranchModal';
import { BranchCashierList } from '../components/BranchCashierList';
import { BranchBookkeeping } from '../components/BranchBookkeeping';

const formatRupiah = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

export const BranchDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'cashier' | 'bookkeeping'>('overview');

  const fetchDashboard = async () => {
    try {
      const response = await api.get(`/store/${id}/dashboard`);
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch store dashboard', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [id]);

  if (loading) {
    return (
      <div className="p-8 pb-24 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 pb-24 text-center">
        <h2 className="text-2xl font-bold text-foreground">Cabang Tidak Ditemukan</h2>
        <button onClick={() => navigate('/branches')} className="mt-4 text-primary hover:underline">Kembali ke Daftar Cabang</button>
      </div>
    );
  }

  const { store, stockCount, todayRevenue, totalRevenue, transactionCount } = data;

  return (
    <div className="p-8 pb-24 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/branches')}
            className="w-10 h-10 glass rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              {store.name}
            </h1>
            <p className="text-muted-foreground mt-1 flex items-center gap-2">
              <MapPin className="w-4 h-4" /> {store.address || 'Alamat tidak tersedia'}
            </p>
          </div>
        </div>
        
        <button 
          onClick={() => setIsEditModalOpen(true)}
          className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2"
        >
          <Pencil className="w-4 h-4" /> Edit Info Cabang
        </button>
      </div>

      <BranchModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        onSuccess={fetchDashboard}
        initialData={store}
      />

      {/* TABS */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-white/10">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-t-xl font-medium text-sm transition-all flex items-center gap-2 ${
            activeTab === 'overview' 
              ? 'bg-white/10 text-foreground border-b-2 border-primary' 
              : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
          }`}
        >
          <AreaChart className="w-4 h-4" /> Overview
        </button>
        <button 
          onClick={() => setActiveTab('cashier')}
          className={`px-4 py-2 rounded-t-xl font-medium text-sm transition-all flex items-center gap-2 ${
            activeTab === 'cashier' 
              ? 'bg-white/10 text-foreground border-b-2 border-primary' 
              : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
          }`}
        >
          <UsersRound className="w-4 h-4" /> Manajemen Kasir
        </button>
        <button 
          onClick={() => setActiveTab('bookkeeping')}
          className={`px-4 py-2 rounded-t-xl font-medium text-sm transition-all flex items-center gap-2 ${
            activeTab === 'bookkeeping' 
              ? 'bg-white/10 text-foreground border-b-2 border-primary' 
              : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
          }`}
        >
          <TrendingUp className="w-4 h-4" /> Pembukuan
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass p-6 rounded-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
              <div className="relative">
                <div className="w-12 h-12 bg-primary/20 text-primary rounded-xl flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Pendapatan Hari Ini</p>
                <h3 className="text-2xl font-bold text-foreground">{formatRupiah(todayRevenue)}</h3>
              </div>
            </div>

            <div className="glass p-6 rounded-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
              <div className="relative">
                <div className="w-12 h-12 bg-blue-500/20 text-blue-500 rounded-xl flex items-center justify-center mb-4">
                  <AreaChart className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Pendapatan</p>
                <h3 className="text-2xl font-bold text-foreground">{formatRupiah(totalRevenue)}</h3>
              </div>
            </div>

            <div className="glass p-6 rounded-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
              <div className="relative">
                <div className="w-12 h-12 bg-orange-500/20 text-orange-500 rounded-xl flex items-center justify-center mb-4">
                  <Boxes className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Item Stok</p>
                <h3 className="text-2xl font-bold text-foreground">{stockCount} <span className="text-sm font-normal text-muted-foreground">Macam Produk</span></h3>
              </div>
            </div>

            <div className="glass p-6 rounded-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
              <div className="relative">
                <div className="w-12 h-12 bg-green-500/20 text-green-500 rounded-xl flex items-center justify-center mb-4">
                  <UsersRound className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Karyawan</p>
                <h3 className="text-2xl font-bold text-foreground">{store._count.users} <span className="text-sm font-normal text-muted-foreground">Orang</span></h3>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="glass rounded-2xl overflow-hidden border border-white/10 shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    Aktivitas Transaksi Terakhir
                  </h2>
                  <button 
                    onClick={() => navigate('/reports')}
                    className="text-sm text-primary font-medium hover:underline"
                  >
                    Lihat Laporan Lengkap
                  </button>
                </div>
                
                <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-white/20 rounded-xl bg-white/5">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <AreaChart className="w-8 h-8 text-primary/50" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground">Grafik Transaksi</h3>
                  <p className="text-muted-foreground text-sm max-w-sm mt-2">Data transaksi lebih rinci dapat dilihat di menu Laporan Keuangan.</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="glass rounded-2xl overflow-hidden border border-white/10 shadow-lg p-6">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-6">
                  <SlidersHorizontal className="w-5 h-5 text-primary" />
                  Tindakan Cepat
                </h2>
                
                <div className="space-y-3">
                  <button 
                    onClick={() => navigate('/inventory')}
                    className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-500/20 text-orange-500 rounded-lg">
                        <Boxes className="w-5 h-5" />
                      </div>
                      <span className="font-medium text-foreground">Kelola Stok Cabang</span>
                    </div>
                    <ArrowLeft className="w-4 h-4 text-muted-foreground group-hover:text-foreground rotate-180 transition-transform group-hover:translate-x-1" />
                  </button>
                  
                  <button 
                    onClick={() => navigate('/employees')}
                    className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-500/20 text-green-500 rounded-lg">
                        <UsersRound className="w-5 h-5" />
                      </div>
                      <span className="font-medium text-foreground">Kelola Karyawan</span>
                    </div>
                    <ArrowLeft className="w-4 h-4 text-muted-foreground group-hover:text-foreground rotate-180 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'cashier' && (
        <div className="animate-in fade-in zoom-in-95 duration-300">
          <div className="glass rounded-2xl overflow-hidden border border-white/10 shadow-lg p-6">
            <BranchCashierList storeId={id as string} />
          </div>
        </div>
      )}

      {activeTab === 'bookkeeping' && (
        <div className="animate-in fade-in zoom-in-95 duration-300">
          <div className="glass rounded-2xl overflow-hidden border border-white/10 shadow-lg p-6">
            <BranchBookkeeping storeId={id as string} />
          </div>
        </div>
      )}
    </div>
  );
};
