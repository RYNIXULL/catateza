import { create } from 'zustand';
import type { Product } from '../features/inventory/api/productApi';

export interface CartItem extends Product {
  cartQuantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getTax: () => number;
  getTotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  
  addItem: (product) => set((state) => {
    const existingItem = state.items.find((item) => item.id === product.id);
    if (existingItem) {
      return {
        items: state.items.map((item) =>
          item.id === product.id ? { ...item, cartQuantity: item.cartQuantity + 1 } : item
        ),
      };
    }
    return { items: [...state.items, { ...product, cartQuantity: 1 }] };
  }),

  removeItem: (productId) => set((state) => ({
    items: state.items.filter((item) => item.id !== productId),
  })),

  updateQuantity: (productId, quantity) => set((state) => ({
    items: state.items.map((item) =>
      item.id === productId ? { ...item, cartQuantity: Math.max(1, quantity) } : item
    ),
  })),

  clearCart: () => set({ items: [] }),

  getSubtotal: () => {
    return get().items.reduce((total, item) => total + (Number(item.sellPrice) * item.cartQuantity), 0);
  },

  getTax: () => {
    return 0; // Tax removed as requested
  },

  getTotal: () => {
    return get().getSubtotal() + get().getTax();
  },
}));
