import api from '../../../lib/axios';

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  storeId: string | null;
  store?: { name: string };
}

export const employeeApi = {
  getAll: async (): Promise<Employee[]> => {
    const response = await api.get('/users/employees');
    return response.data;
  },

  create: async (data: any): Promise<Employee> => {
    // Reusing the cashier creation endpoint without storeId
    const response = await api.post('/auth/cashier', data);
    return response.data.user;
  },

  update: async (id: string, data: any): Promise<Employee> => {
    const response = await api.put(`/auth/cashier/${id}`, data);
    return response.data.user;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/auth/cashier/${id}`);
  },

  assignStore: async (id: string, storeId: string | null): Promise<Employee> => {
    const response = await api.put(`/users/${id}/assign`, { storeId });
    return response.data.user;
  }
};
