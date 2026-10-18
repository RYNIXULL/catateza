import React, { useState, useEffect } from 'react';
import { Building2, PlusCircle, UsersRound, MapPin, Phone, SlidersHorizontal, ChevronRight, TrendingUp, ArrowUpRight, SearchCode } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../../lib/axios';

interface Building2 {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  _count: {
    users: number;
    transactions: number;
  };
}

import { BranchModal } from '../components/BranchModal';

export const BranchesPage = () => {
  const [stores, setStores] = useState<Building2[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/store');
      setStores(data);
    } catch (error) {
      console.error('Failed to fetch stores', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStores = stores.filter(store => 
    store.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 pb-24 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Building2 className="w-8 h-8 text-primary" />
            Manajemen Cabang
          </h1>
          <p className="text-muted-foreground mt-1">Pantau dan kelola seluruh cabang toko dari satu tempat</p>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <SearchCode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Cari cabang..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 dark:bg-black/20 border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
            />
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-medium shadow-md hover:bg-primary/90 transition-all flex items-center gap-2 whitespace-nowrap"
          >
            <PlusCircle className="w-4 h-4" /> <span className="hidden sm:inline">Tambah Cabang</span>
          </button>
        </div>
      </div>

      <BranchModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={fetchStores} 
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="glass p-6 rounded-2xl h-48 animate-pulse bg-white/5"></div>
          ))
        ) : (
          filteredStores.map((store) => (
            <div key={store.id} onClick={() => navigate(`/branches/${store.id}`)} className="glass p-6 rounded-2xl relative overflow-hidden group cursor-pointer hover:shadow-lg transition-all duration-300 border border-white/10 hover:border-primary/30">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
              
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div className="bg-green-500/10 text-green-500 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    Aktif
                  </div>
                </div>

                <h3 className="text-xl font-bold text-foreground mb-1 group-hover:text-primary transition-colors">{store.name}</h3>
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-4">
                  <MapPin className="w-4 h-4" />
                  <span className="truncate">{store.address || 'Alamat belum diatur'}</span>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-white/10">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Karyawan</p>
                    <p className="font-semibold text-foreground flex items-center gap-1.5">
                      <UsersRound className="w-4 h-4 text-primary" /> {store._count.users}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Total Transaksi</p>
                    <p className="font-semibold text-foreground flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-primary" /> {store._count.transactions}
                    </p>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-md">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
