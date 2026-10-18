import React, { useState } from 'react';
import { X, CreditCard, Banknote, QrCode, Loader2, CheckCircle2, Building2, Receipt } from 'lucide-react';
import { useCartStore } from '../../../store/cartStore';
import { transactionApi } from '../api/transactionApi';
import { useToast } from '../../../hooks/useToast';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  storeId?: string;
}

export const PaymentModal = ({ isOpen, onClose, onSuccess, storeId }: PaymentModalProps) => {
  const { items, getSubtotal, getTax, getTotal, clearCart } = useCartStore();
  const { success, error } = useToast();
  
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'QRIS' | 'DEBIT'>('CASH');
  const [amountPaid, setAmountPaid] = useState<string>('');
  const [debitBank, setDebitBank] = useState<string>('BCA');
  const [debitCardNumber, setDebitCardNumber] = useState<string>('');
  const [debitReference, setDebitReference] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const total = getTotal();
  const change = paymentMethod === 'CASH' && amountPaid ? Math.max(0, parseInt(amountPaid) - total) : 0;
  
  const rawDebitCard = debitCardNumber.replace(/\s/g, '');
  const isAmountValid = 
    paymentMethod === 'CASH' 
      ? Boolean(amountPaid && parseInt(amountPaid) >= total)
      : paymentMethod === 'DEBIT'
      ? Boolean(rawDebitCard.length >= 4)
      : true;

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.match(/.{1,4}/g)?.join(' ') || raw;
    setDebitCardNumber(formatted);
  };

  const handlePayment = async () => {
    if (!storeId) {
      error('Cabang Belum Dipilih', 'Silakan pilih cabang toko terlebih dahulu sebelum memproses transaksi.');
      return;
    }

    setIsProcessing(true);
    try {
      await transactionApi.create({
        storeId,
        items: items.map(item => ({
          productId: item.id,
          quantity: item.cartQuantity,
          price: Number(item.sellPrice),
        })),
        subtotal: getSubtotal(),
        tax: getTax(),
        discount: 0,
        grandTotal: total,
        paymentMethod,
        amountPaid: paymentMethod === 'CASH' ? parseInt(amountPaid) : total,
      });

      success('Pembayaran Berhasil', `Transaksi sebesar Rp ${total.toLocaleString('id-ID')} telah diproses.`);
      clearCart();
      setAmountPaid('');
      setDebitCardNumber('');
      setDebitReference('');
      onSuccess();
    } catch (err: any) {
      error('Pembayaran Gagal', err.response?.data?.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 transition-opacity"
        onClick={!isProcessing ? onClose : undefined}
      ></div>

      {/* Modal Content */}
      <div className="glass relative z-10 w-full max-w-lg rounded-2xl animate-in zoom-in-95 duration-300 flex flex-col overflow-hidden border border-white/20 shadow-2xl max-h-[90vh]">
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/40 dark:bg-black/40">
          <h2 className="text-xl font-bold text-foreground">Pembayaran</h2>
          <button 
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 rounded-lg hover:bg-white/50 dark:hover:bg-white/10 transition-colors disabled:opacity-50 text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {/* Summary Box */}
          <div className="bg-primary/10 rounded-xl p-4 border border-primary/20 flex flex-col items-center justify-center text-center">
            <p className="text-sm text-primary font-medium mb-1">Total Tagihan</p>
            <p className="text-3xl font-bold text-foreground">Rp {total.toLocaleString('id-ID')}</p>
          </div>

          {/* Payment Methods */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-foreground">Metode Pembayaran</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'CASH', icon: Banknote, label: 'Tunai' },
                { id: 'QRIS', icon: QrCode, label: 'QRIS' },
                { id: 'DEBIT', icon: CreditCard, label: 'Debit' },
              ].map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentMethod(method.id as any)}
                  className={`flex flex-col items-center justify-center p-3 gap-2 rounded-xl border transition-all ${
                    paymentMethod === method.id 
                      ? 'bg-primary text-white border-primary shadow-md scale-[1.02]' 
                      : 'bg-white/30 dark:bg-black/30 border-white/20 text-muted-foreground hover:bg-white/50 dark:hover:bg-white/10'
                  }`}
                >
                  <method.icon className="w-6 h-6" />
                  <span className="text-xs font-semibold">{method.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Cash Input */}
          {paymentMethod === 'CASH' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-foreground">Uang Diterima (Rp)</label>
                <input
                  type="number"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  placeholder="Masukkan jumlah..."
                  className="w-full px-4 py-3 text-lg font-medium rounded-xl bg-white/50 dark:bg-black/50 border border-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                />
              </div>
              
              <div className="flex justify-between items-center p-4 rounded-xl bg-white/30 dark:bg-black/30 border border-white/20">
                <span className="text-sm font-medium text-muted-foreground">Kembalian</span>
                <span className={`text-lg font-bold ${change > 0 ? 'text-emerald-500' : 'text-foreground'}`}>
                  Rp {change.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          )}

          {/* QRIS View */}
          {paymentMethod === 'QRIS' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
              <div className="bg-white/80 dark:bg-slate-900/80 border border-white/40 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col items-center text-center">
                {/* QRIS Header */}
                <div className="flex items-center justify-between w-full pb-3 mb-2 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-lg tracking-wider text-rose-600">QRIS</span>
                    <span className="text-[10px] bg-rose-500/10 text-rose-600 px-2 py-0.5 rounded-full font-bold border border-rose-500/20">
                      Standar Pembayaran Nasional
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 tracking-wide">
                    GPN
                  </span>
                </div>

                {/* QR Code Graphic */}
                <div className="relative p-3 bg-white rounded-xl shadow-md border border-slate-200 my-2">
                  <svg
                    className="w-44 h-44"
                    viewBox="0 0 160 160"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect width="160" height="160" fill="white" />
                    
                    {/* Top-Left Finder */}
                    <rect x="10" y="10" width="38" height="38" rx="4" fill="black" />
                    <rect x="16" y="16" width="26" height="26" rx="2" fill="white" />
                    <rect x="22" y="22" width="14" height="14" rx="2" fill="black" />

                    {/* Top-Right Finder */}
                    <rect x="112" y="10" width="38" height="38" rx="4" fill="black" />
                    <rect x="118" y="16" width="26" height="26" rx="2" fill="white" />
                    <rect x="124" y="22" width="14" height="14" rx="2" fill="black" />

                    {/* Bottom-Left Finder */}
                    <rect x="10" y="112" width="38" height="38" rx="4" fill="black" />
                    <rect x="16" y="118" width="26" height="26" rx="2" fill="white" />
                    <rect x="22" y="124" width="14" height="14" rx="2" fill="black" />

                    {/* Alignment Pattern */}
                    <rect x="116" y="116" width="22" height="22" rx="2" fill="black" />
                    <rect x="121" y="121" width="12" height="12" fill="white" />
                    <rect x="125" y="125" width="4" height="4" fill="black" />

                    {/* Timing & Data Matrix Dots */}
                    <g fill="black">
                      <rect x="52" y="22" width="6" height="6" />
                      <rect x="64" y="22" width="6" height="6" />
                      <rect x="76" y="22" width="6" height="6" />
                      <rect x="88" y="22" width="6" height="6" />
                      <rect x="100" y="22" width="6" height="6" />
                      <rect x="22" y="52" width="6" height="6" />
                      <rect x="22" y="64" width="6" height="6" />
                      <rect x="22" y="76" width="6" height="6" />
                      <rect x="22" y="88" width="6" height="6" />
                      <rect x="22" y="100" width="6" height="6" />

                      <rect x="56" y="10" width="8" height="8" />
                      <rect x="72" y="10" width="8" height="8" />
                      <rect x="88" y="10" width="8" height="8" />
                      <rect x="10" y="56" width="8" height="8" />
                      <rect x="10" y="72" width="8" height="8" />
                      <rect x="10" y="88" width="8" height="8" />
                      <rect x="36" y="56" width="6" height="6" />
                      <rect x="44" y="64" width="6" height="6" />
                      <rect x="36" y="72" width="6" height="6" />
                      <rect x="44" y="80" width="6" height="6" />
                      <rect x="56" y="52" width="6" height="6" />
                      <rect x="64" y="52" width="6" height="6" />
                      <rect x="92" y="52" width="6" height="6" />
                      <rect x="100" y="52" width="6" height="6" />
                      <rect x="56" y="100" width="6" height="6" />
                      <rect x="64" y="100" width="6" height="6" />
                      <rect x="92" y="100" width="6" height="6" />
                      <rect x="100" y="100" width="6" height="6" />
                      <rect x="52" y="112" width="8" height="8" />
                      <rect x="68" y="112" width="8" height="8" />
                      <rect x="84" y="112" width="8" height="8" />
                      <rect x="52" y="128" width="8" height="8" />
                      <rect x="68" y="128" width="8" height="8" />
                      <rect x="84" y="128" width="8" height="8" />
                      <rect x="52" y="144" width="8" height="8" />
                      <rect x="68" y="144" width="8" height="8" />
                      <rect x="84" y="144" width="8" height="8" />
                      <rect x="112" y="56" width="8" height="8" />
                      <rect x="128" y="56" width="8" height="8" />
                      <rect x="144" y="56" width="8" height="8" />
                      <rect x="112" y="72" width="8" height="8" />
                      <rect x="128" y="72" width="8" height="8" />
                      <rect x="144" y="72" width="8" height="8" />
                      <rect x="112" y="88" width="8" height="8" />
                      <rect x="128" y="88" width="8" height="8" />
                      <rect x="144" y="88" width="8" height="8" />
                    </g>

                    {/* QRIS Center Badge */}
                    <rect x="62" y="62" width="36" height="36" rx="6" fill="#dc2626" />
                    <rect x="64" y="64" width="32" height="32" rx="4" fill="white" />
                    <text x="80" y="83" textAnchor="middle" fill="#dc2626" fontSize="9" fontWeight="900" fontFamily="sans-serif">
                      QRIS
                    </text>
                  </svg>
                </div>

                {/* Merchant & Tagihan Info */}
                <div className="w-full mt-2 space-y-1.5">
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>NMID</span>
                    <span className="font-mono font-semibold text-foreground">ID1020240981726</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>Merchant</span>
                    <span className="font-semibold text-foreground">Catat Eza SmartPOS</span>
                  </div>
                </div>

                {/* Status Indicator */}
                <div className="mt-3 flex items-center justify-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Menunggu Pelanggan Memindai QRIS</span>
                </div>
              </div>

              {/* Supported Apps List */}
              <div className="p-3 bg-white/30 dark:bg-black/30 border border-white/20 rounded-xl text-center">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Mendukung BCA, Mandiri, BRI, BNI, GoPay, OVO, DANA, ShopeePay & seluruh aplikasi perbankan nasional.
                </p>
              </div>
            </div>
          )}

          {/* Debit Card Input */}
          {paymentMethod === 'DEBIT' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
              {/* Virtual Debit Card Mockup */}
              <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-5 shadow-lg border border-white/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-6 -mt-6 w-28 h-28 bg-indigo-500/20 rounded-full blur-xl"></div>
                <div className="relative z-10 flex justify-between items-start mb-6">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-6 h-6 text-indigo-400" />
                    <span className="text-xs uppercase tracking-wider text-slate-300 font-semibold">Debit Card EDC</span>
                  </div>
                  <span className="text-sm font-extrabold tracking-widest text-indigo-300">{debitBank}</span>
                </div>

                <div className="relative z-10 space-y-4">
                  {/* Card Number Display */}
                  <div className="font-mono text-lg tracking-widest text-white drop-shadow">
                    {debitCardNumber || '•••• •••• •••• ••••'}
                  </div>

                  <div className="flex justify-between items-end text-xs text-slate-300">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase">Pemegang Kartu</p>
                      <p className="font-semibold text-white tracking-wide">NASABAH BANK</p>
                    </div>
                    {debitReference && (
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400 uppercase">No. Ref EDC</p>
                        <p className="font-mono text-xs text-indigo-300 font-semibold">{debitReference}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bank Selection */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-primary" />
                  Pilih Bank Mesin EDC
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['BCA', 'Mandiri', 'BRI', 'BNI', 'CIMB Niaga', 'Lainnya'].map((bank) => (
                    <button
                      key={bank}
                      type="button"
                      onClick={() => setDebitBank(bank)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        debitBank === bank
                          ? 'bg-primary text-white border-primary shadow-sm'
                          : 'bg-white/40 dark:bg-black/40 border-white/20 text-foreground hover:bg-white/60 dark:hover:bg-white/10'
                      }`}
                    >
                      {bank}
                    </button>
                  ))}
                </div>
              </div>

              {/* Card Number Input */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground flex items-center justify-between">
                  <span>Nomor Kartu Debit</span>
                  <span className="text-xs text-muted-foreground font-normal">Min. 4 digit</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={debitCardNumber}
                    onChange={handleCardNumberChange}
                    placeholder="4000 1234 5678 9010"
                    maxLength={19}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/50 dark:bg-black/50 border border-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground font-mono text-base"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted-foreground">
                    <CreditCard className="w-4 h-4" />
                  </div>
                </div>
                {rawDebitCard.length > 0 && rawDebitCard.length < 4 ? (
                  <p className="text-xs text-amber-500 font-medium">Masukkan minimal 4 digit nomor kartu.</p>
                ) : rawDebitCard.length >= 4 ? (
                  <p className="text-xs text-emerald-500 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Siap diproses melalui EDC {debitBank}
                  </p>
                ) : null}
              </div>

              {/* EDC Reference / Approval Code Input */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground flex items-center justify-between">
                  <span>Nomor Referensi / Approval Code</span>
                  <span className="text-xs text-muted-foreground font-normal">Opsional (Struk EDC)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={debitReference}
                    onChange={(e) => setDebitReference(e.target.value.toUpperCase())}
                    placeholder="Contoh: REF-839201 / TRACE-123"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/50 dark:bg-black/50 border border-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground font-mono text-sm"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted-foreground">
                    <Receipt className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-white/10 bg-white/40 dark:bg-black/40">
          <button
            onClick={handlePayment}
            disabled={!isAmountValid || isProcessing}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
          >
            {isProcessing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Proses Pembayaran'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
