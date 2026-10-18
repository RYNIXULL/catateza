import { create } from 'zustand';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'OWNER' | 'CASHIER';
  storeId: string | null;
  store?: {
    name: string;
    address: string | null;
    phone: string | null;
  } | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

// Check local storage for initial state
const storedToken = localStorage.getItem('token');
const storedUser = localStorage.getItem('user');

export const useAuthStore = create<AuthState>((set) => ({
  user: storedUser ? JSON.parse(storedUser) : null,
  token: storedToken || null,
  isAuthenticated: !!storedToken,
  
  setAuth: (user, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null, isAuthenticated: false });
  },
}));
