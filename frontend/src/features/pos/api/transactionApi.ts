import api from '../../../lib/axios';

export interface CreateTransactionPayload {
  storeId?: string;
  items: {
    productId: string;
    quantity: number;
    price: number;
    discount?: number;
  }[];
  subtotal: number;
  tax: number;
  discount: number;
  grandTotal: number;
  paymentMethod: 'CASH' | 'QRIS' | 'TRANSFER' | 'DEBIT' | 'KREDIT' | 'EWALLET';
  amountPaid: number;
}

export const transactionApi = {
  create: async (data: CreateTransactionPayload) => {
    const response = await api.post('/transactions', data);
    return response.data;
  },

  getAll: async () => {
    const response = await api.get('/transactions');
    return response.data;
  }
};
