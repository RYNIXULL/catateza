import React, { useState, useEffect } from 'react';
import { ArrowLeft, SearchCode, ShoppingBag, PlusCircle, Minus, Trash, Boxes, Loader2, Camera, Building2, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../store/authStore';
import { useCartStore } from '../../../store/cartStore';
import { productApi } from '../../inventory/api/productApi';
import { PaymentModal } from '../components/PaymentModal';
import { ProductModal } from '../../inventory/components/ProductModal';
import { ScannerModal } from '../../../components/ui/ScannerModal';
import { ConfirmModal } from '../../../components/ui/ConfirmModal';
import { useToast } from '../../../hooks/useToast';
import api from '../../../lib/axios';

interface StoreData {
  id: string;
  name: string;
}

export const POSPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const cart = useCartStore();
  const { success, error } = useToast();
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = () => {
    cart.clearCart();
    logout();
    navigate('/login');
    success('Berhasil', 'Anda telah keluar dari aplikasi');
  };

  const [stores, setStores] = useState<StoreData[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');

  useEffect(() => {
    if (user?.role === 'OWNER') {
      const fetchStores = async () => {
        try {
          const { data } = await api.get('/store');
          setStores(data);
          if (data.length > 0 && !selectedStoreId) {
            setSelectedStoreId(data[0].id);
          }
        } catch (error) {
          console.error("Failed to fetch stores", error);
        }
      };
      fetchStores();
    } else if (user?.role === 'CASHIER' && user?.storeId) {
      setSelectedStoreId(user.storeId);
    }
  }, [user]);

  const { data: products, isLoading, refetch } = useQuery({
    queryKey: ['products', selectedStoreId],
    queryFn: () => productApi.getAll(selectedStoreId),
    enabled: !!selectedStoreId
  });

  const filteredProducts = products?.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.barcode?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      {/* Decorative background elements for glassmorphism */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[40rem] h-[40rem] bg-primary/5 rounded-full mix-blend-multiply filter blur-3xl opacity-70"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[35rem] h-[35rem] bg-blue-300/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/20 bg-white/40 dark:bg-black/40  shadow-sm p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {user?.role === 'OWNER' ? (
            <button 
              onClick={() => navigate('/dashboard')}
              className="p-2 rounded-xl bg-white/50 hover:bg-white/80 dark:bg-black/50 dark:hover:bg-black/80 border border-white/30 transition-all text-foreground"
              title="Kembali ke Dashboard"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
          ) : (
            <button 
              onClick={() => setIsLogoutOpen(true)}
              className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 transition-all"
              title="Keluar / Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold text-foreground">Kasir (Point of Sale)</h1>
            <p className="text-xs text-muted-foreground">Sesi aktif: {user?.name || 'Kasir'} ({user?.role === 'OWNER' ? 'Owner' : 'Kasir'})</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {user?.role === 'OWNER' && (
            <div className="relative mr-2">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              <select
                value={selectedStoreId}
                onChange={(e) => {
                  setSelectedStoreId(e.target.value);
                  if (cart.items.length > 0) {
                    cart.clearCart();
                  }
                }}
                className="pl-9 pr-8 py-2 bg-white/40 dark:bg-black/40 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground font-medium appearance-none shadow-sm  text-sm"
              >
                {stores.map(store => (
                  <option key={store.id} value={store.id} className="bg-background text-foreground">
                    {store.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (!searchQuery.trim()) return;
              
              // Barcode scanner usually sends Enter after the barcode
              const exactMatch = products?.find(p => 
                p.barcode?.toLowerCase() === searchQuery.toLowerCase() || 
                p.sku.toLowerCase() === searchQuery.toLowerCase()
              );
              
              if (exactMatch) {
                const totalStock = exactMatch.stocks?.reduce((acc, s) => acc + s.quantity, 0) || 0;
                if (totalStock > 0) {
                  cart.addItem(exactMatch);
                  setSearchQuery(''); // Clear after scan
                }
              }
            }}
            className="relative hidden sm:block"
          >
            <SearchCode className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari atau scan barcode..." 
              className="pl-9 pr-4 py-2 rounded-xl bg-white/50 dark:bg-black/50 border border-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm w-48 lg:w-64"
            />
          </form>
          <button 
            onClick={() => setIsScannerOpen(true)}
            className="p-2 rounded-xl bg-white/50 hover:bg-white/80 dark:bg-black/50 dark:hover:bg-black/80 border border-white/30 transition-all text-foreground"
            title="Scan Barcode dengan Kamera"
          >
            <Camera className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            disabled={!selectedStoreId}
            className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white px-3 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-1 disabled:opacity-50"
          >
            <PlusCircle className="w-4 h-4" /> <span className="hidden sm:inline">Tambah Produk</span>
          </button>
          <button 
            onClick={() => setIsLogoutOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 text-sm font-medium transition-colors"
            title="Keluar / Logout"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 relative z-10 flex flex-col lg:flex-row p-4 gap-4 overflow-hidden">
        {/* Products Area */}
        <div className="flex-1 bg-white/40 dark:bg-black/40  border border-white/40 shadow-sm rounded-2xl p-4 overflow-y-auto flex flex-col">
          <h2 className="text-lg font-semibold mb-4 text-foreground">Daftar Produk</h2>
          
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground space-y-4">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="font-medium">Memuat data produk...</p>
            </div>
          ) : !selectedStoreId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground space-y-4">
              <Building2 className="w-12 h-12 opacity-50" />
              <p className="font-medium">Pilih cabang terlebih dahulu.</p>
            </div>
          ) : filteredProducts.length === 0 ? (
             <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground space-y-4">
               <Boxes className="w-12 h-12 opacity-50" />
               <p className="font-medium">Produk tidak ditemukan di cabang ini.</p>
             </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredProducts.map((product) => {
                const totalStock = product.stocks?.reduce((acc, s) => acc + s.quantity, 0) || 0;
                const isOutOfStock = totalStock <= 0;

                return (
                  <button 
                    key={product.id}
                    onClick={() => !isOutOfStock && cart.addItem(product)}
                    disabled={isOutOfStock}
                    className={`bg-white/60 dark:bg-black/60 border border-white/30 rounded-xl p-3 transition-all flex flex-col items-center text-center gap-2 relative overflow-hidden ${
                      isOutOfStock ? 'opacity-50 cursor-not-allowed' : 'hover:ring-2 hover:ring-primary/50 hover:shadow-lg cursor-pointer'
                    }`}
                  >
                    {isOutOfStock && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10">
                        Habis
                      </div>
                    )}
                    <div className="w-full aspect-square bg-white/50 dark:bg-white/5 rounded-lg flex items-center justify-center text-primary/40 border border-white/20">
                      <Boxes className="w-8 h-8" />
                    </div>
                    <div className="w-full">
                      <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
                      <p className="text-xs font-bold text-primary mt-1">Rp {Number(product.sellPrice).toLocaleString('id-ID')}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Cart Area */}
        <div className="w-full lg:w-96 bg-white/40 dark:bg-black/40  border border-white/40 shadow-sm rounded-2xl flex flex-col overflow-hidden shrink-0">
          <div className="p-4 border-b border-white/20 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" /> Keranjang
            </h2>
            {cart.items.length > 0 && (
              <span className="bg-primary text-white text-xs font-bold px-2.5 py-1 rounded-full">
                {cart.items.reduce((acc, item) => acc + item.cartQuantity, 0)} item
              </span>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-3 opacity-70">
                <ShoppingBag className="w-12 h-12" />
                <p className="text-sm font-medium">Keranjang masih kosong</p>
              </div>
            ) : (
              cart.items.map((item) => (
                <div key={item.id} className="flex gap-3 bg-white/50 dark:bg-black/50 border border-white/30 p-3 rounded-xl animate-in slide-in-from-right-4 duration-300">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                    <p className="text-xs text-primary font-semibold mt-0.5">Rp {Number(item.sellPrice).toLocaleString('id-ID')}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="flex items-center gap-2 bg-white/50 dark:bg-white/10 rounded-lg border border-white/20 p-1">
                      <button 
                        onClick={() => item.cartQuantity > 1 ? cart.updateQuantity(item.id, item.cartQuantity - 1) : cart.removeItem(item.id)}
                        className="p-1 hover:bg-white/50 dark:hover:bg-white/20 rounded text-foreground"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-semibold w-4 text-center text-foreground">{item.cartQuantity}</span>
                      <button 
                        onClick={() => cart.updateQuantity(item.id, item.cartQuantity + 1)}
                        className="p-1 hover:bg-white/50 dark:hover:bg-white/20 rounded text-foreground"
                      >
                        <PlusCircle className="w-3 h-3" />
                      </button>
                    </div>
                    <button 
                      onClick={() => cart.removeItem(item.id)}
                      className="text-red-500 hover:text-red-600 p-1"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t border-white/20 bg-white/50 dark:bg-black/50 space-y-3">
            <div className="flex justify-between text-sm text-foreground">
              <span>Subtotal</span>
              <span className="font-semibold">Rp {cart.getSubtotal().toLocaleString('id-ID')}</span>
            </div>

            <div className="flex justify-between text-lg font-bold text-foreground pt-2 border-t border-white/20">
              <span>Total</span>
              <span className="text-primary">Rp {cart.getTotal().toLocaleString('id-ID')}</span>
            </div>
            <button 
              onClick={() => setIsPaymentOpen(true)}
              disabled={cart.items.length === 0}
              className="w-full py-3 bg-primary text-white rounded-xl font-bold shadow-md hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]"
            >
              Bayar Sekarang
            </button>
          </div>
        </div>
      </div>

      <PaymentModal 
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        storeId={selectedStoreId}
        onSuccess={() => {
          setIsPaymentOpen(false);
          refetch();
        }}
      />

      {isAddModalOpen && selectedStoreId && (
        <ProductModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={() => {
            setIsAddModalOpen(false);
            refetch();
          }}
          storeId={selectedStoreId}
        />
      )}

      <ScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        continuous={true}
        onScan={(decodedText) => {
          const exactMatch = products?.find(p => 
            p.barcode?.toLowerCase() === decodedText.toLowerCase() || 
            p.sku.toLowerCase() === decodedText.toLowerCase()
          );
          
          if (exactMatch) {
            const totalStock = exactMatch.stocks?.reduce((acc, s) => acc + s.quantity, 0) || 0;
            if (totalStock > 0) {
              cart.addItem(exactMatch);
              success("Berhasil", `${exactMatch.name} masuk keranjang!`);
            } else {
              error("Stok Habis", `${exactMatch.name} sedang kosong.`);
            }
          } else {
            error("Tidak Ditemukan", `Barcode ${decodedText} tidak ada di sistem.`);
          }
        }}
      />

      <ConfirmModal
        isOpen={isLogoutOpen}
        onClose={() => setIsLogoutOpen(false)}
        onConfirm={handleLogout}
        title="Konfirmasi Keluar"
        message="Apakah Anda yakin ingin mengakhiri sesi kasir dan keluar dari aplikasi?"
        confirmText="Keluar"
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
};
