import React, { useState, useEffect } from 'react';
import { 
  Boxes, 
  PlusCircle, 
  SearchCode, 
  Filter, 
  Loader2, 
  RefreshCw, 
  Building2, 
  Pencil, 
  Trash2, 
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Download
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { productApi, type Product } from '../api/productApi';
import { ProductModal } from '../components/ProductModal';
import { ImportExcelModal } from '../components/ImportExcelModal';
import { ConfirmModal } from '../../../components/ui/ConfirmModal';
import { useAuthStore } from '../../../store/authStore';
import { useToast } from '../../../hooks/useToast';
import api from '../../../lib/axios';
import { exportInventoryExcel } from '../../../utils/excelExport';

interface StoreData {
  id: string;
  name: string;
}

export const InventoryPage = () => {
  const { user } = useAuthStore();
  const { success, error } = useToast();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);

  const [stores, setStores] = useState<StoreData[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');

  // Fetch stores for owner
  useEffect(() => {
    if (user?.role === 'OWNER') {
      const fetchStores = async () => {
        try {
          const { data } = await api.get('/store');
          setStores(data);
          if (data.length > 0 && !selectedStoreId) {
            setSelectedStoreId(data[0].id);
          }
        } catch (err) {
          console.error("Failed to fetch stores", err);
        }
      };
      fetchStores();
    } else if (user?.role === 'CASHIER' && user?.storeId) {
      setSelectedStoreId(user.storeId);
    }
  }, [user]);

  // Reset to first page when search query or branch changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedStoreId]);

  const { data: products, isLoading, isError, refetch } = useQuery({
    queryKey: ['products', selectedStoreId],
    queryFn: () => productApi.getAll(selectedStoreId),
    enabled: !!selectedStoreId // Only fetch if we have a storeId selected
  });

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsAddModalOpen(true);
  };

  const handleDelete = (product: Product) => {
    setDeletingProduct(product);
  };

  const confirmDelete = async () => {
    if (!deletingProduct) return;
    setIsDeleting(true);
    try {
      await productApi.delete(deletingProduct.id);
      success("Berhasil", `Produk "${deletingProduct.name}" berhasil dihapus.`);
      setDeletingProduct(null);
      refetch();
    } catch (err: any) {
      error(
        "Gagal Menghapus Produk",
        err.response?.data?.message || err.response?.data?.error || "Terjadi kesalahan saat menghapus produk."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportInventory = async () => {
    if (!products || products.length === 0) {
      error("Tidak Ada Data", "Tidak ada produk di cabang ini untuk diekspor.");
      return;
    }
    try {
      setIsExporting(true);
      const currentStore = stores.find(s => s.id === selectedStoreId);
      await exportInventoryExcel(products, currentStore?.name || 'Cabang Terpilih');
      success("Export Berhasil", "Daftar inventaris berhasil diekspor ke Excel profesional.");
    } catch (err: any) {
      console.error("Export inventory error:", err);
      error("Gagal Export", err.message || "Terjadi kesalahan saat mengekspor inventaris.");
    } finally {
      setIsExporting(false);
    }
  };

  const filteredProducts = products?.filter((product) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      product.name.toLowerCase().includes(query) ||
      product.sku.toLowerCase().includes(query) ||
      (product.barcode && product.barcode.toLowerCase().includes(query)) ||
      (product.category?.name && product.category.name.toLowerCase().includes(query))
    );
  }) || [];

  // Calculate pagination
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Inventaris</h1>
          <p className="text-muted-foreground mt-1">Kelola stok produk per cabang.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {user?.role === 'OWNER' && (
            <div className="relative mr-2">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              <select
                value={selectedStoreId}
                onChange={(e) => setSelectedStoreId(e.target.value)}
                className="pl-9 pr-8 py-2 bg-white/40 dark:bg-black/40 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground font-medium appearance-none shadow-sm"
              >
                {stores.map(store => (
                  <option key={store.id} value={store.id} className="bg-background text-foreground">
                    {store.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button 
            onClick={() => refetch()}
            className="p-2 border border-white/20 bg-white/40 dark:bg-black/40 shadow-sm rounded-xl hover:bg-white/60 transition-all text-muted-foreground hover:text-foreground cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={handleExportInventory}
            disabled={!products || products.length === 0 || isExporting}
            className="bg-blue-500/10 text-blue-600 border border-blue-500/20 hover:bg-blue-600 hover:text-white px-4 py-2 rounded-xl font-medium shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            title="Export data inventaris ke Excel"
          >
            {isExporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            <span>Export Excel</span>
          </button>
          <button 
            onClick={() => setIsImportModalOpen(true)}
            disabled={!selectedStoreId}
            className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-600 hover:text-white px-4 py-2 rounded-xl font-medium shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <FileSpreadsheet className="w-5 h-5" /> Import Excel
          </button>
          <button 
            onClick={() => {
              setEditingProduct(null);
              setIsAddModalOpen(true);
            }}
            disabled={!selectedStoreId}
            className="bg-primary text-white px-4 py-2 rounded-xl font-medium shadow-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <PlusCircle className="w-5 h-5" /> Tambah Produk
          </button>
        </div>
      </div>

      {/* Glass Panel */}
      <div className="bg-white/40 dark:bg-black/40 border border-white/40 shadow-sm rounded-2xl p-6 min-h-[400px] flex flex-col">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6">
          <div className="relative w-full sm:w-72">
            <SearchCode className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari produk berdasarkan nama / SKU..." 
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/50 dark:bg-black/50 border border-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
            />
          </div>
          <button className="px-4 py-2 bg-white/50 dark:bg-black/50 border border-white/30 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-white/80 dark:hover:bg-black/80 transition-all">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>

        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="font-medium">Memuat data produk...</p>
          </div>
        ) : isError ? (
          <div className="flex-1 flex flex-col items-center justify-center text-red-500 space-y-2">
            <p className="font-medium">Gagal memuat data produk.</p>
            <button onClick={() => refetch()} className="text-sm underline hover:text-red-400">Coba lagi</button>
          </div>
        ) : !selectedStoreId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground space-y-4 py-12">
            <div className="w-16 h-16 rounded-2xl bg-white/50 dark:bg-black/50 flex items-center justify-center border border-white/30">
              <Building2 className="w-8 h-8 opacity-50" />
            </div>
            <p className="font-medium">Pilih cabang terlebih dahulu untuk melihat produk.</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground space-y-4 py-12">
            <div className="w-16 h-16 rounded-2xl bg-white/50 dark:bg-black/50 flex items-center justify-center border border-white/30">
              <Boxes className="w-8 h-8 opacity-50" />
            </div>
            <p className="font-medium">
              {searchQuery ? 'Tidak ada produk yang cocok dengan pencarian.' : 'Belum ada produk yang ditambahkan di cabang ini.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="pb-3 px-4 font-semibold text-muted-foreground">SKU / Barcode</th>
                  <th className="pb-3 px-4 font-semibold text-muted-foreground">Nama Produk</th>
                  <th className="pb-3 px-4 font-semibold text-muted-foreground">Kategori</th>
                  <th className="pb-3 px-4 font-semibold text-muted-foreground text-right">Harga Beli</th>
                  <th className="pb-3 px-4 font-semibold text-muted-foreground text-right">Harga Jual</th>
                  <th className="pb-3 px-4 font-semibold text-muted-foreground text-center">Stok</th>
                  <th className="pb-3 px-4 font-semibold text-muted-foreground text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProducts.map((product) => {
                  const totalStock = product.stocks?.reduce((acc, stock) => acc + stock.quantity, 0) || 0;
                  return (
                    <tr key={product.id} className="border-b border-white/10 hover:bg-white/20 dark:hover:bg-white/5 transition-colors">
                      <td className="py-4 px-4 text-muted-foreground font-mono text-xs">
                        <div>{product.sku}</div>
                        {product.barcode && <div className="text-[10px] opacity-75">{product.barcode}</div>}
                      </td>
                      <td className="py-4 px-4 font-medium text-foreground flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                          <Boxes className="w-4 h-4" />
                        </div>
                        <span className="font-semibold">{product.name}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="px-2.5 py-1 rounded-full bg-white/50 dark:bg-white/10 text-xs font-medium border border-white/20">
                          {product.category?.name || 'Tanpa Kategori'}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-medium text-right text-muted-foreground">
                        Rp {Number(product.buyPrice).toLocaleString('id-ID')}
                      </td>
                      <td className="py-4 px-4 font-medium text-right text-foreground">
                        Rp {Number(product.sellPrice).toLocaleString('id-ID')}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="inline-flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${totalStock <= 5 ? 'bg-red-500' : totalStock <= 15 ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                          <span className="font-semibold">{totalStock}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button 
                            onClick={() => handleEdit(product)}
                            className="px-2.5 py-1.5 rounded-lg text-primary hover:bg-primary/10 border border-primary/20 transition-all flex items-center gap-1.5 text-xs font-medium active:scale-95 shadow-xs"
                            title="Edit Produk"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button 
                            onClick={() => handleDelete(product)}
                            className="px-2.5 py-1.5 rounded-lg text-red-500 hover:bg-red-500/10 border border-red-500/20 transition-all flex items-center gap-1.5 text-xs font-medium active:scale-95 shadow-xs"
                            title="Hapus Produk"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Hapus</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        
        {products && products.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-auto text-sm text-muted-foreground border-t border-white/20 pt-4">
            <div className="flex flex-wrap items-center gap-3">
              <p>
                Menampilkan <span className="font-semibold text-foreground">{filteredProducts.length === 0 ? 0 : startIndex + 1}</span> - <span className="font-semibold text-foreground">{Math.min(startIndex + itemsPerPage, filteredProducts.length)}</span> dari total <span className="font-semibold text-foreground">{filteredProducts.length}</span> produk
              </p>
              <div className="hidden sm:flex items-center gap-1.5 text-xs ml-2">
                <span>Baris:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-white/40 dark:bg-black/40 border border-white/20 rounded-lg px-2 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 text-xs"
                >
                  <option value={5} className="bg-background text-foreground">5</option>
                  <option value={6} className="bg-background text-foreground">6</option>
                  <option value={10} className="bg-background text-foreground">10</option>
                  <option value={20} className="bg-background text-foreground">20</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs mr-2 font-medium">
                Halaman {safeCurrentPage} dari {totalPages}
              </span>
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={safeCurrentPage <= 1}
                className="px-3 py-1.5 rounded-lg border border-white/20 bg-white/30 dark:bg-black/30 hover:bg-white/50 dark:hover:bg-black/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 font-medium text-foreground text-xs shadow-xs"
                title="Halaman Sebelumnya"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Sebelumnya</span>
              </button>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={safeCurrentPage >= totalPages}
                className="px-3 py-1.5 rounded-lg border border-white/20 bg-white/30 dark:bg-black/30 hover:bg-white/50 dark:hover:bg-black/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 font-medium text-foreground text-xs shadow-xs"
                title="Halaman Selanjutnya"
              >
                <span>Lanjut</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {isAddModalOpen && selectedStoreId && (
        <ProductModal
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingProduct(null);
          }}
          onSuccess={() => {
            setIsAddModalOpen(false);
            setEditingProduct(null);
            refetch();
          }}
          storeId={selectedStoreId}
          initialData={editingProduct}
        />
      )}
      
      {isImportModalOpen && selectedStoreId && (
        <ImportExcelModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onSuccess={() => {
            setIsImportModalOpen(false);
            refetch();
          }}
          storeId={selectedStoreId}
        />
      )}

      <ConfirmModal
        isOpen={!!deletingProduct}
        onClose={() => setDeletingProduct(null)}
        onConfirm={confirmDelete}
        isLoading={isDeleting}
        title="Hapus Produk"
        message={`Apakah Anda yakin ingin menghapus produk "${deletingProduct?.name}"? Tindakan ini akan menghapus produk dari inventaris cabang.`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
      />
    </div>
  );
};
