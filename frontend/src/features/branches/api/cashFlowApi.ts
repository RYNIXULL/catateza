import api from '../../../lib/axios';

export interface CashFlow {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number | string;
  description: string;
  category?: string;
  date: string;
  storeId: string;
  userId: string;
  user?: { name: string };
}

export interface CashFlowSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export interface CashFlowData {
  data: CashFlow[];
  summary: CashFlowSummary;
}

export const cashFlowApi = {
  getByStore: async (storeId: string): Promise<CashFlowData> => {
    const response = await api.get(`/cashflow/${storeId}`);
    return response.data;
  },
  
  create: async (data: Omit<CashFlow, 'id' | 'userId' | 'user'>): Promise<CashFlow> => {
    const response = await api.post('/cashflow', data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/cashflow/${id}`);
  }
};
