import React, { useState, useRef } from 'react';
import { X, Upload, Loader2, FileSpreadsheet, Download } from 'lucide-react';
import * as xlsx from 'xlsx';
import { useToast } from '../../../hooks/useToast';
import { productApi } from '../api/productApi';

interface ImportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  storeId: string;
}

export const ImportExcelModal = ({ isOpen, onClose, onSuccess, storeId }: ImportExcelModalProps) => {
  const { success, error } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        SKU: 'PRD-001',
        Barcode: '123456789012',
        Nama: 'Kopi Susu Aren',
        HargaBeli: 10000,
        HargaJual: 15000,
        Stok: 50,
      },
      {
        SKU: 'PRD-002',
        Barcode: '',
        Nama: 'Teh Manis',
        HargaBeli: 3000,
        HargaJual: 5000,
        Stok: 100,
      }
    ];

    const ws = xlsx.utils.json_to_sheet(templateData);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Template Produk');
    xlsx.writeFile(wb, 'Template_Import_Produk.xlsx');
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = xlsx.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      const jsonData = xlsx.utils.sheet_to_json<any>(worksheet);
      
      if (jsonData.length === 0) {
        throw new Error('File Excel kosong atau format tidak sesuai.');
      }

      const productsData = jsonData.map((row: any) => ({
        sku: String(row.SKU || row.sku || '').trim(),
        barcode: row.Barcode || row.barcode ? String(row.Barcode || row.barcode).trim() : undefined,
        name: String(row.Nama || row.name || row.NamaProduk || '').trim(),
        buyPrice: Number(row.HargaBeli || row.buyPrice || 0),
        sellPrice: Number(row.HargaJual || row.sellPrice || 0),
        initialStock: Number(row.Stok || row.initialStock || row.stock || 0),
        storeId,
      }));

      // Validate required fields
      const invalidRows = productsData.filter(p => !p.sku || !p.name);
      if (invalidRows.length > 0) {
        throw new Error(`Ada ${invalidRows.length} baris yang tidak memiliki SKU atau Nama.`);
      }

      await productApi.createBulk(productsData);
      success('Import Berhasil', `${productsData.length} produk berhasil ditambahkan ke inventaris.`);
      onSuccess();
    } catch (err: any) {
      console.error(err);
      error('Gagal Import Excel', err.response?.data?.message || err.message || 'Terjadi kesalahan saat memproses file.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv')) {
        processFile(file);
      } else {
        error('Format File Tidak Sesuai', 'Harap unggah file Excel (.xlsx, .xls) atau CSV.');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60  transition-opacity"
        onClick={!isProcessing ? onClose : undefined}
      ></div>

      {/* Modal Content */}
      <div className="glass relative z-10 w-full max-w-lg rounded-2xl animate-in zoom-in-95 duration-300 flex flex-col overflow-hidden border border-white/20 shadow-2xl">
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/40 dark:bg-black/40">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
            Import dari Excel
          </h2>
          <button 
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 rounded-lg hover:bg-white/50 dark:hover:bg-white/10 transition-colors disabled:opacity-50 text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl">
            <div className="text-sm">
              <p className="font-semibold text-foreground">Butuh format standar?</p>
              <p className="text-muted-foreground mt-0.5">Unduh template Excel agar data mudah dibaca oleh sistem.</p>
            </div>
            <button 
              onClick={handleDownloadTemplate}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/50 dark:bg-black/50 hover:bg-white/80 dark:hover:bg-black/80 border border-white/30 rounded-lg text-sm font-medium transition-colors"
            >
              <Download className="w-4 h-4" /> Template
            </button>
          </div>

          <div 
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
              isDragging 
                ? 'border-primary bg-primary/5' 
                : 'border-white/30 bg-white/10 hover:bg-white/20 dark:bg-black/10 dark:hover:bg-black/20'
            }`}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".xlsx, .xls, .csv"
              onChange={handleFileSelect}
              disabled={isProcessing}
            />
            
            {isProcessing ? (
              <div className="flex flex-col items-center gap-3 text-primary">
                <Loader2 className="w-10 h-10 animate-spin" />
                <p className="font-medium">Memproses file Excel...</p>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Upload className="w-8 h-8" />
                </div>
                <p className="font-semibold text-foreground mb-1">Klik atau Tarik file ke sini</p>
                <p className="text-sm text-muted-foreground">Mendukung file .xlsx, .xls, dan .csv</p>
              </>
            )}
          </div>
        </div>

        <div className="p-5 border-t border-white/10 bg-white/40 dark:bg-black/40 flex justify-end">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 rounded-xl font-medium text-muted-foreground hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
