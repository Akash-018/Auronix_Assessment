import { create } from 'zustand';
import { User } from '../types';
import { api } from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  fetchCurrentUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('pixeltest_token'),
  isAuthenticated: false,
  isLoading: true,

  login: (token: string, user: User) => {
    localStorage.setItem('pixeltest_token', token);
    set({ token, user, isAuthenticated: true, isLoading: false });
  },

  logout: () => {
    localStorage.removeItem('pixeltest_token');
    set({ token: null, user: null, isAuthenticated: false, isLoading: false });
  },

  fetchCurrentUser: async () => {
    const token = localStorage.getItem('pixeltest_token');
    if (!token) {
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      return;
    }
    try {
      const response = await api.get<User>('/auth/me');
      set({ user: response.data, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.removeItem('pixeltest_token');
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
