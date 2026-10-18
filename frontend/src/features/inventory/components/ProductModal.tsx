import React, { useState, useEffect } from 'react';
import { X, Loader2, PackagePlus, Camera, Pencil } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { productApi, type Product } from '../api/productApi';
import { useToast } from '../../../hooks/useToast';
import { ScannerModal } from '../../../components/ui/ScannerModal';

const productSchema = z.object({
  sku: z.string().min(3, { message: "SKU minimal 3 karakter" }),
  barcode: z.string().optional(),
  name: z.string().min(3, { message: "Nama Produk minimal 3 karakter" }),
  buyPrice: z.coerce.number().min(0, { message: "Harga beli tidak valid" }),
  sellPrice: z.coerce.number().min(0, { message: "Harga jual tidak valid" }),
  initialStock: z.coerce.number().min(0, { message: "Stok awal tidak valid" }),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  storeId: string;
  initialData?: Product | null;
}

export const ProductModal = ({ isOpen, onClose, onSuccess, storeId, initialData }: ProductModalProps) => {
  const { success, error } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const isEdit = !!initialData;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      sku: '',
      barcode: '',
      name: '',
      buyPrice: 0,
      sellPrice: 0,
      initialStock: 0,
    }
  });

  useEffect(() => {
    if (initialData) {
      reset({
        sku: initialData.sku,
        barcode: initialData.barcode || '',
        name: initialData.name,
        buyPrice: Number(initialData.buyPrice),
        sellPrice: Number(initialData.sellPrice),
        initialStock: initialData.stocks?.reduce((acc, s) => acc + s.quantity, 0) || 0,
      });
    } else {
      reset({
        sku: '',
        barcode: '',
        name: '',
        buyPrice: 0,
        sellPrice: 0,
        initialStock: 0,
      });
    }
  }, [initialData, isOpen, reset]);

  if (!isOpen) return null;

  const onSubmit = async (data: ProductFormValues) => {
    setIsSubmitting(true);
    try {
      if (isEdit && initialData) {
        await productApi.update({
          id: initialData.id,
          data: {
            sku: data.sku,
            barcode: data.barcode || null as any,
            name: data.name,
            buyPrice: data.buyPrice,
            sellPrice: data.sellPrice,
          }
        });
        success("Produk Berhasil Diperbarui", `Perubahan untuk ${data.name} berhasil disimpan.`);
      } else {
        await productApi.create({ ...data, storeId });
        success("Produk Berhasil Ditambahkan", `${data.name} telah masuk ke dalam Inventaris.`);
      }
      reset();
      onSuccess();
    } catch (err: any) {
      error(
        isEdit ? "Gagal Memperbarui Produk" : "Gagal Menambahkan Produk", 
        err.response?.data?.message || err.response?.data?.error || "Terjadi kesalahan pada server."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 transition-opacity"
        onClick={!isSubmitting ? onClose : undefined}
      ></div>

      {/* Modal Content */}
      <div className="glass relative z-10 w-full max-w-lg rounded-2xl animate-in zoom-in-95 duration-300 flex flex-col overflow-hidden border border-white/20 shadow-2xl">
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/40 dark:bg-black/40">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            {isEdit ? (
              <>
                <Pencil className="w-5 h-5 text-primary" />
                Edit Data Produk
              </>
            ) : (
              <>
                <PackagePlus className="w-5 h-5 text-primary" />
                Tambah Produk Baru
              </>
            )}
          </h2>
          <button 
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg hover:bg-white/50 dark:hover:bg-white/10 transition-colors disabled:opacity-50 text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-foreground mb-1.5">SKU / Kode Barang</label>
              <input
                {...register('sku')}
                placeholder="Mis: PRD-001"
                className={`w-full px-4 py-2 rounded-xl border bg-white/50 dark:bg-black/50 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm ${errors.sku ? 'border-red-500/50' : 'border-white/30'}`}
              />
              {errors.sku && <p className="mt-1 text-xs text-red-500">{errors.sku.message}</p>}
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-foreground mb-1.5">Barcode</label>
              <div className="relative">
                <input
                  {...register('barcode')}
                  placeholder="Ketik / tembak barcode"
                  className={`w-full pl-4 pr-10 py-2 rounded-xl border bg-white/50 dark:bg-black/50 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm ${errors.barcode ? 'border-red-500/50' : 'border-white/30'}`}
                />
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-primary transition-colors bg-white/50 dark:bg-black/50 rounded-lg border border-white/20"
                  title="Gunakan Kamera"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              {errors.barcode && <p className="mt-1 text-xs text-red-500">{errors.barcode?.message as string}</p>}
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-foreground mb-1.5">
                {isEdit ? 'Total Stok' : 'Stok Awal'}
              </label>
              <input
                {...register('initialStock')}
                type="number"
                disabled={isEdit}
                placeholder="0"
                className={`w-full px-4 py-2 rounded-xl border bg-white/50 dark:bg-black/50 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm ${isEdit ? 'opacity-60 cursor-not-allowed bg-white/20' : ''} ${errors.initialStock ? 'border-red-500/50' : 'border-white/30'}`}
              />
              {isEdit ? (
                <p className="mt-1 text-[11px] text-muted-foreground">Stok dikelola melalui transaksi kasir.</p>
              ) : errors.initialStock && (
                <p className="mt-1 text-xs text-red-500">{errors.initialStock.message}</p>
              )}
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-foreground mb-1.5">Nama Produk</label>
              <input
                {...register('name')}
                placeholder="Mis: Kopi Susu Aren"
                className={`w-full px-4 py-2 rounded-xl border bg-white/50 dark:bg-black/50 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm ${errors.name ? 'border-red-500/50' : 'border-white/30'}`}
              />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-foreground mb-1.5">Harga Beli / Modal</label>
              <input
                {...register('buyPrice')}
                type="number"
                placeholder="0"
                className={`w-full px-4 py-2 rounded-xl border bg-white/50 dark:bg-black/50 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm ${errors.buyPrice ? 'border-red-500/50' : 'border-white/30'}`}
              />
              {errors.buyPrice && <p className="mt-1 text-xs text-red-500">{errors.buyPrice.message}</p>}
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-foreground mb-1.5">Harga Jual</label>
              <input
                {...register('sellPrice')}
                type="number"
                placeholder="0"
                className={`w-full px-4 py-2 rounded-xl border bg-white/50 dark:bg-black/50 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm ${errors.sellPrice ? 'border-red-500/50' : 'border-white/30'}`}
              />
              {errors.sellPrice && <p className="mt-1 text-xs text-red-500">{errors.sellPrice.message}</p>}
            </div>
          </div>

          <div className="pt-6 border-t border-white/10 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl font-medium text-muted-foreground hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEdit ? 'Simpan Perubahan' : 'Simpan Produk'}
            </button>
          </div>
        </form>
      </div>

      {/* Ensure ScannerModal is at a higher z-index (60) and does not close this one */}
      <ScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={(decodedText) => {
          setValue('barcode', decodedText);
          setIsScannerOpen(false);
          success("Barcode Ditemukan", `Kode: ${decodedText}`);
        }}
      />
    </div>
  );
};
