import React, { useState, useEffect } from 'react';
import { UsersRound, PlusCircle, Mail, Phone, MapPin, MoreVertical, Edit2, Trash } from 'lucide-react';
import { employeeApi } from '../api/employeeApi';
import type { Employee } from '../api/employeeApi';
import { EmployeeModal } from '../components/EmployeeModal';
import { ConfirmModal } from '../../../components/ui/ConfirmModal';
import { useToast } from '../../../hooks/useToast';

export const EmployeePage = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { success, error } = useToast();

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const data = await employeeApi.getAll();
      setEmployees(data);
    } catch (err) {
      console.error('Failed to fetch employees', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleAdd = () => {
    setEditingEmployee(null);
    setIsModalOpen(true);
  };

  const handleEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      setIsDeleting(true);
      await employeeApi.delete(deleteTargetId);
      success('Berhasil', 'Karyawan telah dihapus');
      setDeleteTargetId(null);
      fetchEmployees();
    } catch (err) {
      console.error(err);
      error('Gagal', 'Gagal menghapus karyawan');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Karyawan</h1>
          <p className="text-muted-foreground mt-1">Kelola data dan akses staf Anda.</p>
        </div>
        <button 
          onClick={handleAdd}
          className="bg-primary text-white px-4 py-2 rounded-xl font-medium shadow-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
        >
          <PlusCircle className="w-5 h-5" /> Tambah Karyawan
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {employees.length === 0 ? (
            <div className="col-span-full py-12 text-center border border-dashed border-white/20 rounded-2xl bg-white/5">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <UsersRound className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-1">Belum ada Karyawan</h3>
              <p className="text-muted-foreground">Silakan tambah karyawan baru menggunakan tombol di atas.</p>
            </div>
          ) : (
            employees.map((emp) => (
              <div key={emp.id} className="bg-white/5 border border-white/10 shadow-sm rounded-2xl p-6 relative group overflow-hidden hover:bg-white/10 transition-colors">
                <div className="absolute -right-6 -top-6 w-32 h-32 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all duration-500"></div>
                
                <div className="relative z-10 flex justify-between items-start mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-primary to-blue-400 flex items-center justify-center text-white text-xl font-bold shadow-md border-2 border-white/10">
                      {emp.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground text-lg">{emp.name}</h3>
                      <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full mt-1 bg-blue-500/10 text-blue-500 border border-blue-500/20">
                        {emp.role}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(emp)} className="text-blue-500 hover:bg-blue-500/10 p-1.5 rounded-lg transition-colors" title="Edit">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteTargetId(emp.id)} className="text-red-500 hover:bg-red-500/10 p-1.5 rounded-lg transition-colors" title="Hapus">
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="relative z-10 space-y-3 mt-6 pt-4 border-t border-white/10">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
                      <Mail className="w-4 h-4" />
                    </div>
                    <span>{emp.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <span className="truncate">
                      {emp.store ? `Ditugaskan di: ${emp.store.name}` : <span className="text-yellow-500">Belum Ditugaskan</span>}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <EmployeeModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          fetchEmployees();
          success('Berhasil', 'Data karyawan disimpan');
        }}
        initialData={editingEmployee}
      />

      <ConfirmModal
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={confirmDelete}
        isLoading={isDeleting}
        title="Hapus Karyawan"
        message="Apakah Anda yakin ingin menghapus akun karyawan ini secara permanen?"
        confirmText="Hapus Karyawan"
        variant="danger"
      />
    </div>
  );
};
