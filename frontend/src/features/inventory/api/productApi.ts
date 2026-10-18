

import api from '../../../lib/axios';

export interface Product {
  id: string;
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  buyPrice: number;
  sellPrice: number;
  isActive: boolean;
  categoryId?: string;
  createdAt: string;
  category?: {
    id: string;
    name: string;
  };
  stocks?: Array<{
    quantity: number;
    storeId: string;
  }>;
}

export const productApi = {
  getAll: async (storeId?: string) => {
    const params = storeId ? { storeId } : {};
    const { data } = await api.get<Product[]>('/products', { params });
    return data;
  },
  
  getById: async (id: string) => {
    const { data } = await api.get<Product>(`/products/${id}`);
    return data;
  },

  create: async (productData: Partial<Product> & { initialStock?: number; storeId?: string }) => {
    const { data } = await api.post<Product>('/products', productData);
    return data;
  },

  createBulk: async (productsData: Array<Partial<Product> & { initialStock?: number; storeId?: string }>) => {
    const { data } = await api.post<Product[]>('/products/bulk', productsData);
    return data;
  },

  update: async ({ id, data }: { id: string; data: Partial<Product> }) => {
    const { data: responseData } = await api.put<Product>(`/products/${id}`, data);
    return responseData;
  },

  delete: async (id: string) => {
    await api.delete(`/products/${id}`);
  }
};
