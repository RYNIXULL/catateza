import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Building2, 
  Receipt, 
  CreditCard, 
  Bell, 
  Shield, 
  Save, 
  Boxes, 
  Loader2, 
  PlaySquare, 
  Eye, 
  BellRing, 
  Volume2, 
  VolumeX,
  KeyRound,
  Clock,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  Info
} from 'lucide-react';
import { getStoreSettings, updateStoreSettings, type CostingMethod, type StoreSettings } from '../api/storeApi';
import { useToast } from '../../../hooks/useToast';
import { useNotificationStore } from '../../../store/notificationStore';
import { soundManager } from '../../../lib/sound';
import api from '../../../lib/axios';
import { useAutoLogout } from '../../../components/providers/AutoLogoutProvider';

export const SettingsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'Profil Toko';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isAudioEnabled, setIsAudioEnabled] = useState(soundManager.isEnabled());

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (tabName: string) => {
    setActiveTab(tabName);
    setSearchParams({ tab: tabName });
  };
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { success, error } = useToast();

  const [selectedCosting, setSelectedCosting] = useState<CostingMethod>('DEFAULT');

  // Receipt Preview States
  const [headerText, setHeaderText] = useState("Selamat Datang di Toko Kami");
  const [footerText, setFooterText] = useState("Terima kasih telah berbelanja di toko kami! Barang yang sudah dibeli tidak dapat ditukar.");
  const [showLogo, setShowLogo] = useState(true);
  const [showCashier, setShowCashier] = useState(true);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setLogoUrl(url);
    }
  };

  // Payment States
  const [acceptQris, setAcceptQris] = useState(true);
  const [qrisUrl, setQrisUrl] = useState<string | null>(null);
  
  const [acceptTransfer, setAcceptTransfer] = useState(false);
  const [bankName, setBankName] = useState("BCA");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");

  const handleQrisUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setQrisUrl(url);
    }
  };

  // Security States
  const { settings: autoLogoutSettings, updateSettings: updateAutoLogoutSettings } = useAutoLogout();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const [selectedTimeout, setSelectedTimeout] = useState(autoLogoutSettings.timeoutMinutes);
  const [showWarningModalToggle, setShowWarningModalToggle] = useState(autoLogoutSettings.showWarning);
  const [rememberEmailToggle, setRememberEmailToggle] = useState(autoLogoutSettings.rememberEmail);
  const [passwordHintInput, setPasswordHintInput] = useState(autoLogoutSettings.passwordHint);
  const [isSavingSecuritySettings, setIsSavingSecuritySettings] = useState(false);

  useEffect(() => {
    setSelectedTimeout(autoLogoutSettings.timeoutMinutes);
    setShowWarningModalToggle(autoLogoutSettings.showWarning);
    setRememberEmailToggle(autoLogoutSettings.rememberEmail);
    setPasswordHintInput(autoLogoutSettings.passwordHint);
  }, [autoLogoutSettings]);

  const handleChangePassword = async () => {
    if (!currentPassword.trim()) {
      error("Validasi Gagal", "Kata sandi saat ini harus diisi.");
      return;
    }
    if (newPassword.length < 6) {
      error("Validasi Gagal", "Kata sandi baru minimal 6 karakter.");
      return;
    }
    if (newPassword !== confirmPassword) {
      error("Validasi Gagal", "Konfirmasi kata sandi tidak cocok dengan kata sandi baru.");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: currentPassword.trim(),
        newPassword: newPassword.trim(),
      });
      success("Kata Sandi Berhasil Diperbarui", "Kata sandi akun Anda telah berhasil diubah di database.");
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error("Change password error:", err);
      error(
        "Gagal Mengubah Kata Sandi",
        err.response?.data?.message || "Kata sandi saat ini tidak sesuai atau terjadi kendala."
      );
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleSaveSecuritySettings = () => {
    setIsSavingSecuritySettings(true);
    updateAutoLogoutSettings({
      timeoutMinutes: selectedTimeout,
      showWarning: showWarningModalToggle,
      rememberEmail: rememberEmailToggle,
      passwordHint: passwordHintInput.trim(),
    });
    success("Pengaturan Disimpan", "Preferensi logout otomatis dan pengingat kata sandi telah aktif.");
    setIsSavingSecuritySettings(false);
  };

  useEffect(() => {
    if (activeTab === 'Pengaturan Stok') {
      fetchSettings();
    }
  }, [activeTab]);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const data = await getStoreSettings();
      setSettings(data);
      setSelectedCosting(data.costingMethod);
    } catch (err) {
      error("Gagal memuat pengaturan", "Terjadi kesalahan saat memuat pengaturan toko.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveStockSettings = async () => {
    setIsSaving(true);
    try {
      await updateStoreSettings(selectedCosting);
      success("Berhasil disimpan", "Pengaturan stok berhasil diperbarui.");
    } catch (err) {
      error("Gagal menyimpan", "Terjadi kesalahan saat menyimpan pengaturan.");
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { icon: Building2, label: 'Profil Toko' },
    { icon: Boxes, label: 'Pengaturan Stok' },
    { icon: Receipt, label: 'Struk Digital' },
    { icon: CreditCard, label: 'Pembayaran' },
    { icon: Bell, label: 'Notifikasi' },
    { icon: Shield, label: 'Keamanan' },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Pengaturan</h1>
        <p className="text-muted-foreground mt-1">Konfigurasi toko, struk, dan preferensi sistem Anda.</p>
      </div>

      {/* Tabs / Categories using Glassmorphism */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Navigation Sidebar */}
        <div className="md:col-span-1 flex flex-col gap-2">
          {tabs.map((item, idx) => (
            <button 
              key={idx}
              onClick={() => handleTabChange(item.label)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium w-full text-left
                ${activeTab === item.label 
                  ? 'bg-primary text-white shadow-md' 
                  : 'bg-white/40 dark:bg-black/40  border border-white/40 text-muted-foreground hover:bg-white/60 dark:hover:bg-white/10 hover:text-foreground'
                }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="md:col-span-3 bg-white/40 dark:bg-black/40  border border-white/40 shadow-sm rounded-2xl p-6 relative overflow-hidden min-h-[400px]">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
          
          <div className="relative z-10 space-y-6">
            
            {activeTab === 'Profil Toko' && (
              <>
                <div className="border-b border-white/20 pb-4 mb-6">
                  <h2 className="text-xl font-bold text-foreground">Profil Toko</h2>
                  <p className="text-sm text-muted-foreground mt-1">Perbarui informasi dasar toko Anda yang akan ditampilkan pada struk.</p>
                </div>
                
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-semibold text-foreground">Nama Toko</label>
                    <input 
                      type="text" 
                      defaultValue="Catat Eza"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/50 dark:bg-black/50 border border-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <label className="text-sm font-semibold text-foreground">Nomor Telepon</label>
                    <input 
                      type="text" 
                      defaultValue="+62 812-3456-7890"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/50 dark:bg-black/50 border border-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <label className="text-sm font-semibold text-foreground">Alamat Lengkap</label>
                    <textarea 
                      rows={3}
                      defaultValue="Jl. Sudirman No. 123, Jakarta Selatan, 12345"
                      className="w-full px-4 py-2.5 rounded-xl bg-white/50 dark:bg-black/50 border border-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                    />
                  </div>
                  
                  <div className="pt-4 border-t border-white/20 flex justify-end">
                    <button className="bg-primary text-white px-6 py-2.5 rounded-xl font-medium shadow-md hover:bg-primary/90 transition-all flex items-center gap-2">
                      <Save className="w-4 h-4" /> Simpan Perubahan
                    </button>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'Pengaturan Stok' && (
              <>
                <div className="border-b border-white/20 pb-4 mb-6">
                  <h2 className="text-xl font-bold text-foreground">Pengaturan stok</h2>
                  <p className="text-sm text-foreground/80 mt-1">Bagaimana nantinya Anda mengelola stok dan harga dasar barang?</p>
                </div>

                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      {/* FIFO */}
                      <label className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/50 dark:hover:bg-black/50 transition-colors cursor-pointer border border-transparent">
                        <div className="pt-1">
                          <input 
                            type="radio" 
                            name="costingMethod"
                            checked={selectedCosting === 'FIFO'}
                            onChange={() => setSelectedCosting('FIFO')}
                            className="w-5 h-5 text-primary focus:ring-primary accent-primary" 
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground text-base">FIFO (First In First Out)</span>
                            <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs px-2 py-0.5 rounded-md font-medium">Rekomendasi</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5">Harga dasar barang yang terjual diambil dari barang yang pertama kali masuk.</p>
                        </div>
                      </label>

                      {/* LIFO */}
                      <label className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/50 dark:hover:bg-black/50 transition-colors cursor-pointer border border-transparent">
                        <div className="pt-1">
                          <input 
                            type="radio" 
                            name="costingMethod"
                            checked={selectedCosting === 'LIFO'}
                            onChange={() => setSelectedCosting('LIFO')}
                            className="w-5 h-5 text-primary focus:ring-primary accent-primary" 
                          />
                        </div>
                        <div className="flex-1">
                          <span className="font-semibold text-foreground text-base block">LIFO (Last In Last Out)</span>
                          <p className="text-sm text-muted-foreground mt-0.5">Harga dasar barang yang terjual diambil dari barang yang terakhir kali masuk.</p>
                        </div>
                      </label>

                      {/* Average */}
                      <label className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/50 dark:hover:bg-black/50 transition-colors cursor-pointer border border-transparent">
                        <div className="pt-1">
                          <input 
                            type="radio" 
                            name="costingMethod"
                            checked={selectedCosting === 'AVERAGE'}
                            onChange={() => setSelectedCosting('AVERAGE')}
                            className="w-5 h-5 text-primary focus:ring-primary accent-primary" 
                          />
                        </div>
                        <div className="flex-1">
                          <span className="font-semibold text-foreground text-base block">Average</span>
                          <p className="text-sm text-muted-foreground mt-0.5">Harga dasar barang yang terjual diambil dari rata-rata pergerakan harga dasar.</p>
                        </div>
                      </label>

                      {/* Default */}
                      <label className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/50 dark:hover:bg-black/50 transition-colors cursor-pointer border border-transparent">
                        <div className="pt-1">
                          <input 
                            type="radio" 
                            name="costingMethod"
                            checked={selectedCosting === 'DEFAULT'}
                            onChange={() => setSelectedCosting('DEFAULT')}
                            className="w-5 h-5 text-primary focus:ring-primary accent-primary" 
                          />
                        </div>
                        <div className="flex-1">
                          <span className="font-semibold text-foreground text-base block">Default</span>
                          <p className="text-sm text-muted-foreground mt-0.5">Harga dasar ditentukan owner di database barang</p>
                        </div>
                      </label>
                    </div>



                    <div className="pt-4 flex">
                      <button 
                        onClick={handleSaveStockSettings}
                        disabled={isSaving}
                        className="w-full bg-[#0CB47F] text-white py-3.5 rounded-full font-bold shadow-md hover:bg-[#0aa373] active:scale-[0.99] transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                      >
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : "OK, LANJUT !"}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === 'Keamanan' && (
              <>
                <div className="border-b border-white/20 pb-4 mb-6">
                  <h2 className="text-xl font-bold text-foreground">Keamanan</h2>
                  <p className="text-sm text-muted-foreground mt-1">Kelola kata sandi akun dan kebijakan logout otomatis.</p>
                </div>
                
                <div className="space-y-8">
                  {/* Ubah Password Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <KeyRound className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground text-lg">Ubah Kata Sandi</h3>
                        <p className="text-xs text-muted-foreground">Perbarui kata sandi akun Anda secara berkala demi keamanan.</p>
                      </div>
                    </div>

                    <div className="grid gap-4 max-w-2xl bg-white/30 dark:bg-black/30 border border-white/20 rounded-2xl p-5 shadow-xs">
                      <div className="grid gap-2">
                        <label className="text-sm font-semibold text-foreground">Kata Sandi Saat Ini</label>
                        <input 
                          type="password" 
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Masukkan kata sandi saat ini"
                          className="w-full px-4 py-2.5 rounded-xl bg-white/50 dark:bg-black/50 border border-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <label className="text-sm font-semibold text-foreground">Kata Sandi Baru</label>
                          <input 
                            type="password" 
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Minimal 6 karakter"
                            className="w-full px-4 py-2.5 rounded-xl bg-white/50 dark:bg-black/50 border border-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground text-sm"
                          />
                        </div>
                        <div className="grid gap-2">
                          <label className="text-sm font-semibold text-foreground">Konfirmasi Kata Sandi</label>
                          <input 
                            type="password" 
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Ulangi kata sandi baru"
                            className="w-full px-4 py-2.5 rounded-xl bg-white/50 dark:bg-black/50 border border-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground text-sm"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end pt-2">
                        <button 
                          type="button"
                          onClick={handleChangePassword}
                          disabled={isUpdatingPassword}
                          className="bg-primary text-white px-6 py-2.5 rounded-xl font-medium shadow-md hover:bg-primary/90 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60 text-sm"
                        >
                          {isUpdatingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                          <span>{isUpdatingPassword ? 'Memperbarui...' : 'Perbarui Kata Sandi'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-white/20"></div>

                  {/* Pengaturan Logout Otomatis & Keamanan Sesi */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground text-lg">Logout Otomatis & Keamanan Sesi</h3>
                        <p className="text-xs text-muted-foreground">Kelola waktu istirahat kasir dan opsi bantuan pengingat kata sandi.</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4 max-w-2xl">
                      {/* Durasi Logout */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-white/30 dark:bg-black/30 border border-white/20 hover:bg-white/40 transition-colors">
                        <div>
                          <h4 className="font-medium text-foreground text-sm">Durasi Tidak Aktif</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">Sesi kasir akan otomatis keluar jika tidak ada aktivitas mouse / keyboard.</p>
                        </div>
                        <select 
                          value={selectedTimeout}
                          onChange={(e) => setSelectedTimeout(e.target.value)}
                          className="px-3.5 py-2 rounded-xl bg-white/70 dark:bg-black/70 border border-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-medium text-foreground cursor-pointer"
                        >
                          <option value="never">Tidak pernah (Tetap Aktif)</option>
                          <option value="15">15 Menit Tidak Aktif</option>
                          <option value="30">30 Menit Tidak Aktif</option>
                          <option value="60">1 Jam Tidak Aktif</option>
                          <option value="120">2 Jam Tidak Aktif</option>
                          <option value="240">4 Jam Tidak Aktif</option>
                          <option value="480">8 Jam (1 Shift Kerja)</option>
                        </select>
                      </div>

                      {/* Peringatan 60 Detik Sebelum Logout */}
                      <div className="flex items-center justify-between p-4 rounded-xl bg-white/30 dark:bg-black/30 border border-white/20 hover:bg-white/40 transition-colors">
                        <div>
                          <h4 className="font-medium text-foreground text-sm">Peringatan 60 Detik Sebelum Logout</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">Tampilkan dialog hitung mundur dengan tombol "Tetap Masuk" sebelum sesi ditutup.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                          <input 
                            type="checkbox" 
                            checked={showWarningModalToggle}
                            onChange={(e) => setShowWarningModalToggle(e.target.checked)}
                            className="sr-only peer" 
                          />
                          <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                        </label>
                      </div>

                      {/* Ingat Email Akun di Halaman Login */}
                      <div className="flex items-center justify-between p-4 rounded-xl bg-white/30 dark:bg-black/30 border border-white/20 hover:bg-white/40 transition-colors">
                        <div>
                          <h4 className="font-medium text-foreground text-sm">Ingat Email Akun di Halaman Login</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">Otomatis mengisi email Anda pada layar login sehingga Anda hanya perlu memasukkan sandi.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                          <input 
                            type="checkbox" 
                            checked={rememberEmailToggle}
                            onChange={(e) => setRememberEmailToggle(e.target.checked)}
                            className="sr-only peer" 
                          />
                          <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                        </label>
                      </div>

                      {/* Petunjuk Kata Sandi Pribadi */}
                      <div className="p-4 rounded-xl bg-white/30 dark:bg-black/30 border border-white/20 space-y-2">
                        <div className="flex items-center gap-1.5">
                          <HelpCircle className="w-4 h-4 text-primary" />
                          <h4 className="font-medium text-foreground text-sm">Petunjuk Kata Sandi Pribadi (Password Hint)</h4>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Tuliskan petunjuk pribadi agar Anda tidak lupa kata sandi akun jika sesi keluar (contoh: "nama toko + tahun" atau "tgl lahir"). Petunjuk ini dapat dilihat di layar login tanpa membocorkan kata sandi asli Anda.
                        </p>
                        <input 
                          type="text"
                          value={passwordHintInput}
                          onChange={(e) => setPasswordHintInput(e.target.value)}
                          placeholder="Misal: Nama toko + 2 digit tahun"
                          className="w-full px-4 py-2.5 rounded-xl bg-white/50 dark:bg-black/50 border border-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground text-sm"
                        />
                      </div>

                      <div className="flex justify-end pt-2">
                        <button 
                          type="button"
                          onClick={handleSaveSecuritySettings}
                          disabled={isSavingSecuritySettings}
                          className="bg-primary text-white px-6 py-2.5 rounded-xl font-medium shadow-md hover:bg-primary/90 transition-all flex items-center gap-2 cursor-pointer text-sm"
                        >
                          <Save className="w-4 h-4" />
                          <span>Simpan Pengaturan Keamanan</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'Struk Digital' && (
              <>
                <div className="border-b border-white/20 pb-4 mb-6">
                  <h2 className="text-xl font-bold text-foreground">Struk Digital & Printer</h2>
                  <p className="text-sm text-muted-foreground mt-1">Sesuaikan tampilan struk dan konfigurasi printer thermal Anda.</p>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column: Form SlidersHorizontal */}
                  <div className="space-y-6">
                    <div className="space-y-4">
                      
                      {/* Header */}
                      <div className="grid gap-2">
                        <label className="text-sm font-semibold text-foreground">Pesan Pembuka (Header)</label>
                        <textarea 
                          rows={2}
                          value={headerText}
                          onChange={(e) => setHeaderText(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl bg-white/50 dark:bg-black/50 border border-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                        />
                      </div>

                      {/* Footer */}
                      <div className="grid gap-2">
                        <label className="text-sm font-semibold text-foreground">Pesan Catatan Kaki (Footer)</label>
                        <textarea 
                          rows={3}
                          value={footerText}
                          onChange={(e) => setFooterText(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl bg-white/50 dark:bg-black/50 border border-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                        />
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 rounded-xl bg-white/30 dark:bg-black/30 border border-white/20 hover:bg-white/40 transition-colors">
                          <div>
                            <h4 className="font-medium text-foreground">Tampilkan Logo Toko</h4>
                            <p className="text-sm text-muted-foreground mt-0.5">Cetak logo toko di bagian atas struk.</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={showLogo} onChange={(e) => setShowLogo(e.target.checked)} className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                          </label>
                        </div>

                        {showLogo && (
                          <div className="p-4 rounded-xl bg-white/20 dark:bg-black/20 border border-white/20 flex items-center gap-4">
                            <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center overflow-hidden border border-gray-200 shrink-0">
                              {logoUrl ? (
                                <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                              ) : (
                                <Building2 className="w-8 h-8 text-gray-400" />
                              )}
                            </div>
                            <div className="flex-1">
                              <label className="cursor-pointer bg-white/50 dark:bg-black/50 hover:bg-white/70 text-foreground px-4 py-2 rounded-lg text-sm font-medium border border-white/30 inline-block transition-colors shadow-sm">
                                Unggah Logo
                                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                              </label>
                              <p className="text-xs text-muted-foreground mt-2">Format: JPG, PNG (Maks 1MB). Kotak disarankan.</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-xl bg-white/30 dark:bg-black/30 border border-white/20 hover:bg-white/40 transition-colors">
                        <div>
                          <h4 className="font-medium text-foreground">Tampilkan Nama Kasir</h4>
                          <p className="text-sm text-muted-foreground mt-0.5">Cetak nama kasir yang melayani pada struk.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={showCashier} onChange={(e) => setShowCashier(e.target.checked)} className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                        </label>
                      </div>

                      {/* Printer Configuration */}
                      <div className="border-t border-white/20 pt-6 mt-6">
                        <h3 className="font-semibold text-foreground text-lg mb-4">Konfigurasi Printer Thermal</h3>
                        <div className="space-y-4">
                          <div className="grid gap-2">
                            <label className="text-sm font-semibold text-foreground">Pilih Printer Thermal</label>
                            <select className="w-full px-4 py-2.5 rounded-xl bg-white/50 dark:bg-black/50 border border-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-medium">
                              <option>Simpan sebagai PDF (Sistem)</option>
                              <option>POS-58 (USB)</option>
                              <option>POS-80 (Bluetooth)</option>
                              <option>Cari Printer Lain...</option>
                            </select>
                          </div>
                          
                          <div className="grid gap-2">
                            <label className="text-sm font-semibold text-foreground">Ukuran Kertas</label>
                            <select className="w-full px-4 py-2.5 rounded-xl bg-white/50 dark:bg-black/50 border border-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-medium">
                              <option>58mm</option>
                              <option>80mm</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-white/20 flex justify-end gap-3 mt-6">
                        <button 
                          onClick={() => success("Print Test", "Mengirim data ke printer...")}
                          className="bg-white/50 dark:bg-black/50 text-foreground px-4 py-2.5 rounded-xl font-medium shadow-sm hover:bg-white/70 transition-all border border-white/30"
                        >
                          Test Print
                        </button>
                        <button 
                          onClick={() => success("Berhasil", "Pengaturan struk & printer berhasil disimpan")}
                          className="bg-primary text-white px-6 py-2.5 rounded-xl font-medium shadow-md hover:bg-primary/90 transition-all flex items-center gap-2"
                        >
                          <Save className="w-4 h-4" /> Simpan
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Live Preview */}
                  <div className="hidden lg:flex justify-center border-l border-white/20 pl-8">
                    <div className="w-[320px] bg-white text-black p-6 shadow-xl relative min-h-[450px] font-mono text-sm before:content-[''] before:absolute before:-top-2 before:left-0 before:right-0 before:h-2 before:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSI4Ij48cGF0aCBkPSJNMCAwIEwxMCA4IEwyMCAwIFoiIGZpbGw9IiNmZmYiLz48L3N2Zz4=')] before:bg-repeat-x after:content-[''] after:absolute after:-bottom-2 after:left-0 after:right-0 after:h-2 after:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSI4Ij48cGF0aCBkPSJNMCA4IEwxMCAwIEwyMCA4IFoiIGZpbGw9IiNmZmYiLz48L3N2Zz4=')] after:bg-repeat-x">
                      <div className="text-center mb-4 space-y-1">
                        {showLogo && (
                          <div className="mb-2 flex justify-center">
                            {logoUrl ? (
                              <img src={logoUrl} alt="Logo Toko" className="w-12 h-12 object-contain grayscale" />
                            ) : (
                              <Building2 className="w-10 h-10 text-black" />
                            )}
                          </div>
                        )}
                        <h3 className="font-bold text-lg">Catat Eza</h3>
                        <p className="text-xs">Jl. Sudirman No. 123</p>
                        <p className="text-xs">+62 812-3456-7890</p>
                      </div>
                      
                      {headerText && (
                        <div className="text-center text-xs mb-4 pb-4 border-b border-dashed border-gray-400 whitespace-pre-wrap">
                          <p>{headerText}</p>
                        </div>
                      )}
                      
                      <div className="text-xs mb-4 space-y-1">
                        <div className="flex justify-between">
                          <span>01/08/2026</span>
                          <span>23:45</span>
                        </div>
                        <div className="flex justify-between">
                          {showCashier && <span>Kasir: Eza</span>}
                          <span className={!showCashier ? 'ml-auto' : ''}>No: INV-001</span>
                        </div>
                      </div>

                      <div className="border-b border-dashed border-gray-400 mb-4 pb-4 space-y-2">
                        <div className="flex justify-between text-xs">
                          <div className="flex-1">
                            <div>Kopi Susu Gula Aren</div>
                            <div className="text-gray-500">2 x 18.000</div>
                          </div>
                          <div className="self-end">36.000</div>
                        </div>
                        <div className="flex justify-between text-xs">
                          <div className="flex-1">
                            <div>Roti Bakar Coklat</div>
                            <div className="text-gray-500">1 x 15.000</div>
                          </div>
                          <div className="self-end">15.000</div>
                        </div>
                      </div>

                      <div className="space-y-1 mb-6 text-xs">
                        <div className="flex justify-between font-bold">
                          <span>Total</span>
                          <span>51.000</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tunai</span>
                          <span>100.000</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Kembali</span>
                          <span>49.000</span>
                        </div>
                      </div>

                      {footerText && (
                        <div className="text-center text-xs pt-4 border-t border-dashed border-gray-400 mt-auto whitespace-pre-wrap">
                          <p>{footerText}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'Pembayaran' && (
              <>
                <div className="border-b border-white/20 pb-4 mb-6">
                  <h2 className="text-xl font-bold text-foreground">Metode Pembayaran</h2>
                  <p className="text-sm text-muted-foreground mt-1">Kelola metode pembayaran yang diterima di toko Anda.</p>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/30 dark:bg-black/30 border border-white/20 hover:bg-white/40 transition-colors">
                      <div>
                        <h4 className="font-medium text-foreground">Terima Uang Tunai (Cash)</h4>
                        <p className="text-sm text-muted-foreground mt-0.5">Metode pembayaran standar dengan uang tunai.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                      </label>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 rounded-xl bg-white/30 dark:bg-black/30 border border-white/20 hover:bg-white/40 transition-colors">
                        <div>
                          <h4 className="font-medium text-foreground">Terima QRIS / E-WalletCards</h4>
                          <p className="text-sm text-muted-foreground mt-0.5">Terima pembayaran via GoPay, OVO, Dana, dll.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={acceptQris} onChange={(e) => setAcceptQris(e.target.checked)} className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                        </label>
                      </div>

                      {acceptQris && (
                        <div className="p-4 rounded-xl bg-white/20 dark:bg-black/20 border border-white/20 flex flex-col md:flex-row items-center gap-6">
                          <div className="w-32 h-32 bg-white rounded-xl flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300 shrink-0">
                            {qrisUrl ? (
                              <img src={qrisUrl} alt="QRIS" className="w-full h-full object-contain" />
                            ) : (
                              <div className="text-center text-gray-400">
                                <CreditCard className="w-8 h-8 mx-auto mb-1 opacity-50" />
                                <span className="text-xs">Preview QRIS</span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 w-full text-center md:text-left">
                            <h4 className="font-semibold text-foreground mb-1">Unggah Kode QRIS</h4>
                            <p className="text-sm text-muted-foreground mb-4">Pelanggan bisa langsung scan kode ini jika memilih metode pembayaran QRIS.</p>
                            <label className="cursor-pointer bg-primary text-white hover:bg-primary/90 px-6 py-2.5 rounded-xl text-sm font-medium shadow-md transition-all inline-block">
                              Pilih File QRIS
                              <input type="file" accept="image/*" className="hidden" onChange={handleQrisUpload} />
                            </label>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 rounded-xl bg-white/30 dark:bg-black/30 border border-white/20 hover:bg-white/40 transition-colors">
                        <div>
                          <h4 className="font-medium text-foreground">Terima Transfer Bank</h4>
                          <p className="text-sm text-muted-foreground mt-0.5">Tampilkan opsi transfer rekening saat checkout.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={acceptTransfer} onChange={(e) => setAcceptTransfer(e.target.checked)} className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                        </label>
                      </div>

                      {acceptTransfer && (
                        <div className="p-5 rounded-xl bg-white/20 dark:bg-black/20 border border-white/20 space-y-4">
                          <h4 className="font-semibold text-foreground mb-2">Informasi Rekening Bank</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                              <label className="text-sm font-semibold text-foreground">Nama Bank</label>
                              <select 
                                value={bankName}
                                onChange={(e) => setBankName(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl bg-white/50 dark:bg-black/50 border border-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-medium"
                              >
                                <option value="BCA">BCA</option>
                                <option value="Mandiri">Mandiri</option>
                                <option value="BNI">BNI</option>
                                <option value="BRI">BRI</option>
                                <option value="BSI">BSI</option>
                                <option value="Lainnya">Lainnya...</option>
                              </select>
                            </div>
                            <div className="grid gap-2">
                              <label className="text-sm font-semibold text-foreground">Nomor Rekening</label>
                              <input 
                                type="text" 
                                value={accountNumber}
                                onChange={(e) => setAccountNumber(e.target.value)}
                                placeholder="Contoh: 1234567890"
                                className="w-full px-4 py-2.5 rounded-xl bg-white/50 dark:bg-black/50 border border-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50"
                              />
                            </div>
                            <div className="grid gap-2 md:col-span-2">
                              <label className="text-sm font-semibold text-foreground">Atas Nama (Pemilik Rekening)</label>
                              <input 
                                type="text" 
                                value={accountName}
                                onChange={(e) => setAccountName(e.target.value)}
                                placeholder="Contoh: Budi Santoso"
                                className="w-full px-4 py-2.5 rounded-xl bg-white/50 dark:bg-black/50 border border-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="pt-4 border-t border-white/20 flex justify-end">
                      <button 
                        onClick={() => success("Berhasil", "Metode pembayaran berhasil disimpan")}
                        className="bg-primary text-white px-6 py-2.5 rounded-xl font-medium shadow-md hover:bg-primary/90 transition-all flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" /> Simpan Pengaturan
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'Notifikasi' && (
              <>
                <div className="border-b border-white/20 pb-4 mb-6">
                  <h2 className="text-xl font-bold text-foreground">Pengaturan Notifikasi</h2>
                  <p className="text-sm text-muted-foreground mt-1">Atur peringatan, suara audio sistem, dan pemberitahuan operasional.</p>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-4">
                    {/* Audio Sound Toggle */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/30 dark:bg-black/30 border border-white/20 hover:bg-white/40 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-xl mt-0.5 ${isAudioEnabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                          {isAudioEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground">Efek Suara Notifikasi & Kasir</h4>
                          <p className="text-sm text-muted-foreground mt-0.5">Putar suara lonceng saat ada notifikasi masuk dan melodi sukses saat kasir menyelesaikan transaksi.</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer ml-4">
                        <input 
                          type="checkbox" 
                          checked={isAudioEnabled} 
                          onChange={(e) => {
                            const val = e.target.checked;
                            setIsAudioEnabled(val);
                            soundManager.setEnabled(val);
                            if (val) {
                              soundManager.playNotification();
                            }
                          }}
                          className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                      </label>
                    </div>

                    {/* Sound Test Panel */}
                    <div className="p-4 rounded-xl bg-white/20 dark:bg-white/5 border border-white/20 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h4 className="font-semibold text-sm text-foreground">Uji Coba Suara Audio</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">Dengarkan pratinjau efek suara untuk memastikan audio perangkat Anda aktif.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => soundManager.playNotification()}
                          className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/50 dark:bg-black/40 hover:bg-white/70 text-foreground border border-white/30 transition-all flex items-center gap-1.5 shadow-sm"
                        >
                          <Bell className="w-3.5 h-3.5 text-primary" />
                          Suara Lonceng
                        </button>
                        <button
                          type="button"
                          onClick={() => soundManager.playSuccess()}
                          className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-primary text-white hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-sm"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          Suara Kasir Sukses
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/30 dark:bg-black/30 border border-white/20 hover:bg-white/40 transition-colors">
                      <div>
                        <h4 className="font-medium text-foreground">Peringatan Stok Menipis</h4>
                        <p className="text-sm text-muted-foreground mt-0.5">Tampilkan notifikasi penting saat stok barang di bawah batas minimum.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/30 dark:bg-black/30 border border-white/20 hover:bg-white/40 transition-colors">
                      <div>
                        <h4 className="font-medium text-foreground">Kirim Notifikasi Simulasi</h4>
                        <p className="text-sm text-muted-foreground mt-0.5">Kirim notifikasi uji coba bersama suara lonceng ke navbar atas.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          useNotificationStore.getState().addNotification({
                            title: 'Uji Coba Notifikasi & Suara',
                            message: 'Suara notifikasi Smart POS berbunyi normal dan siap digunakan.',
                            type: 'system',
                            badge: 'Tes Suara',
                            link: '/settings?tab=Notifikasi'
                          });
                          success('Notifikasi & Suara Terkirim', 'Lonceng notifikasi berbunyi dan lencana telah diperbarui');
                        }}
                        className="bg-white/50 dark:bg-white/10 hover:bg-white/70 text-foreground px-4 py-2 rounded-xl text-xs font-semibold border border-white/30 transition-all flex items-center gap-1.5 shadow-sm"
                      >
                        <BellRing className="w-3.5 h-3.5 text-primary" />
                        Kirim Notifikasi Uji
                      </button>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/20 flex justify-end">
                    <button 
                      onClick={() => success("Berhasil", "Pengaturan notifikasi berhasil disimpan")}
                      className="bg-primary text-white px-6 py-2.5 rounded-xl font-medium shadow-md hover:bg-primary/90 transition-all flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" /> Simpan Pengaturan
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Other tabs placeholder */}
            {!['Profil Toko', 'Pengaturan Stok', 'Keamanan', 'Struk Digital', 'Pembayaran', 'Notifikasi'].includes(activeTab) && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Building2 className="w-8 h-8 text-primary/50" />
                </div>
                <h3 className="text-lg font-medium text-foreground">Segera Hadir</h3>
                <p className="text-muted-foreground text-sm max-w-sm mt-2">Pengaturan untuk {activeTab} sedang dalam tahap pengembangan.</p>
              </div>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
};
