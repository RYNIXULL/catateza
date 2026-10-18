import api from '../../../lib/axios';

export type CostingMethod = 'FIFO' | 'LIFO' | 'AVERAGE' | 'DEFAULT';

export interface StoreSettings {
  costingMethod: CostingMethod;
}

export const getStoreSettings = async (): Promise<StoreSettings> => {
  const response = await api.get('/store/settings');
  return response.data;
};

export const updateStoreSettings = async (costingMethod: CostingMethod): Promise<{message: string, settings: StoreSettings}> => {
  const response = await api.put('/store/settings', { costingMethod });
  return response.data;
};
