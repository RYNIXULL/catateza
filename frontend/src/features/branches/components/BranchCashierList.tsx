import React, { useState, useEffect } from 'react';
import { UsersRound, Mail, PlusCircle, Edit2, Trash, ShieldCheck, X, ChevronDown } from 'lucide-react';
import api from '../../../lib/axios';
import { employeeApi } from '../../employees/api/employeeApi';
import type { Employee } from '../../employees/api/employeeApi';
import { ConfirmModal } from '../../../components/ui/ConfirmModal';
import { useToast } from '../../../hooks/useToast';

export const BranchCashierList: React.FC<{ storeId: string }> = ({ storeId }) => {
  const [cashiers, setCashiers] = useState<Employee[]>([]);
  const [availableEmployees, setAvailableEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [unassignTargetId, setUnassignTargetId] = useState<string | null>(null);
  const [isUnassigning, setIsUnassigning] = useState(false);
  
  const { success, error } = useToast();

  const fetchCashiers = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/store/${storeId}/cashiers`);
      setCashiers(data);
    } catch (error) {
      console.error('Failed to fetch cashiers', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableEmployees = async () => {
    try {
      const data = await employeeApi.getAll();
      // Only show employees that are not assigned to this store currently
      // It can show employees with no store, or employees assigned to other stores
      setAvailableEmployees(data.filter(emp => emp.storeId !== storeId));
    } catch (error) {
      console.error('Failed to fetch available employees', error);
    }
  };

  useEffect(() => {
    fetchCashiers();
  }, [storeId]);

  const handleAdd = () => {
    fetchAvailableEmployees();
    setSelectedEmployeeId('');
    setIsFormOpen(true);
  };

  const handleCancel = () => {
    setIsFormOpen(false);
  };

  const confirmUnassign = async () => {
    if (!unassignTargetId) return;
    try {
      setIsUnassigning(true);
      await employeeApi.assignStore(unassignTargetId, null);
      success('Berhasil', 'Akses kasir dicabut dari cabang ini');
      setUnassignTargetId(null);
      fetchCashiers();
    } catch (err) {
      console.error(err);
      error('Gagal', 'Gagal mencabut akses kasir');
    } finally {
      setIsUnassigning(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId) {
      error('Gagal', 'Silakan pilih karyawan terlebih dahulu');
      return;
    }

    try {
      setFormLoading(true);
      await employeeApi.assignStore(selectedEmployeeId, storeId);
      success('Berhasil', 'Karyawan ditugaskan ke cabang ini');
      setIsFormOpen(false);
      fetchCashiers();
    } catch (err: any) {
      error('Gagal', err.response?.data?.message || 'Terjadi kesalahan saat menugaskan karyawan');
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return <div className="h-40 flex items-center justify-center animate-pulse text-muted-foreground">Memuat data kasir...</div>;
  }

  return (
    <div className="space-y-6 relative">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <UsersRound className="w-5 h-5 text-primary" />
          Akses Kasir Cabang
        </h3>
        {!isFormOpen && (
          <button 
            onClick={handleAdd}
            className="text-sm bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" /> Tambah Akses Kasir
          </button>
        )}
      </div>

      {isFormOpen ? (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 animate-in fade-in slide-in-from-top-2">
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-semibold text-foreground flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              Tugaskan Karyawan ke Cabang
            </h4>
            <button onClick={handleCancel} className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Pilih Karyawan</label>
              <div className="relative">
                <select
                  required
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-background border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground appearance-none"
                >
                  <option value="" disabled>-- Pilih Karyawan --</option>
                  {availableEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.email}) {emp.store ? ` - Dari: ${emp.store.name}` : ''}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-muted-foreground">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Pilih karyawan yang akan diberikan akses kasir di cabang ini. Karyawan yang dipilih akan dipindahkan dari cabangnya saat ini (jika ada).
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-white/10 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={formLoading || !selectedEmployeeId}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-md disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {formLoading ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : null}
                Tugaskan Kasir
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cashiers.length === 0 ? (
            <div className="col-span-full py-8 text-center border border-dashed border-white/20 rounded-xl bg-white/5">
              <p className="text-muted-foreground text-sm">Belum ada kasir yang ditugaskan ke cabang ini.</p>
            </div>
          ) : (
            cashiers.map((cashier, i) => (
              <div key={cashier.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex justify-between items-center group hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-blue-400 flex items-center justify-center text-white font-bold shadow-sm">
                    {cashier.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">{cashier.name}</h4>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                      <Mail className="w-3 h-3" /> {cashier.email}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => setUnassignTargetId(cashier.id)}
                    className="p-1.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-md transition-colors text-xs flex items-center gap-1"
                    title="Cabut Akses Cabang"
                  >
                    <Trash className="w-3.5 h-3.5" /> Cabut
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <ConfirmModal
        isOpen={!!unassignTargetId}
        onClose={() => setUnassignTargetId(null)}
        onConfirm={confirmUnassign}
        isLoading={isUnassigning}
        title="Cabut Akses Kasir"
        message="Cabut akses kasir ini dari cabang? Kasir tetap ada di menu Karyawan dan dapat ditugaskan kembali kapan saja."
        confirmText="Cabut Akses"
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
};
