import React, { useState, useRef } from 'react';
import { X, Upload, Loader2, FileSpreadsheet, Download } from 'lucide-react';
import * as xlsx from 'xlsx';
import { useToast } from '../../../hooks/useToast';
import { productApi } from '../api/productApi';
import { exportProductTemplateExcel } from '../../../utils/excelExport';

interface ImportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  storeId: string;
}

export const ImportExcelModal = ({ isOpen, onClose, onSuccess, storeId }: ImportExcelModalProps) => {
  const { success, error } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = async () => {
    try {
      setIsDownloadingTemplate(true);
      await exportProductTemplateExcel();
      success('Berhasil', 'Template Excel produk berhasil diunduh.');
    } catch (err: any) {
      console.error('Download template error:', err);
      error('Gagal Mengunduh', err.message || 'Terjadi kesalahan saat mengunduh template.');
    } finally {
      setIsDownloadingTemplate(false);
    }
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
        sku: String(row.SKU || row.sku || row['SKU *'] || row['Kode Barang'] || '').trim(),
        barcode: (row.Barcode || row.barcode || row['Kode Barcode']) 
          ? String(row.Barcode || row.barcode || row['Kode Barcode']).trim() 
          : undefined,
        name: String(row.Nama || row.name || row.NamaProduk || row['Nama Produk'] || row['Nama Produk *'] || '').trim(),
        buyPrice: Number(row.HargaBeli || row.buyPrice || row['Harga Beli'] || row['Harga Beli (Rp)'] || row['Harga Beli (Rp) *'] || 0),
        sellPrice: Number(row.HargaJual || row.sellPrice || row['Harga Jual'] || row['Harga Jual (Rp)'] || row['Harga Jual (Rp) *'] || 0),
        initialStock: Number(row.Stok || row.initialStock || row.stock || row['Stok Awal'] || row['Stok Awal *'] || row['Stok'] || 0),
        storeId,
      }));

      // Filter out empty rows or header description rows
      const validRows = productsData.filter(p => p.sku && p.name && !p.sku.toLowerCase().includes('petunjuk'));

      if (validRows.length === 0) {
        throw new Error('Tidak ditemukan baris data produk yang valid. Pastikan kolom SKU dan Nama Produk terisi.');
      }

      await productApi.createBulk(validRows);
      success('Import Berhasil', `${validRows.length} produk berhasil ditambahkan ke inventaris.`);
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
              disabled={isDownloadingTemplate}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/50 dark:bg-black/50 hover:bg-white/80 dark:hover:bg-black/80 border border-white/30 rounded-lg text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
            >
              {isDownloadingTemplate ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span>{isDownloadingTemplate ? 'Mengunduh...' : 'Unduh Template'}</span>
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
