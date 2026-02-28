import { create } from 'zustand';
import type { User, UserRole } from '../types/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUserCoins: (amount: number) => void;
  hasRole: (roles: UserRole[]) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,

  login: async (email, password) => {
    set({ isLoading: true });
    // Mock login - in real app, this would call an API
    await new Promise((resolve) => setTimeout(resolve, 500));

    const mockUser: User = {
      id: '4',
      username: 'You',
      email,
      role: email.includes('admin') ? 'admin' : 'user',
      totalCoins: 250,
      avatar: '😎',
      joinedAt: new Date(),
    };

    set({ user: mockUser, isAuthenticated: true, isLoading: false });
  },

  logout: () => {
    set({ user: null, isAuthenticated: false });
  },

  updateUserCoins: (amount) =>
    set((state) => ({
      user: state.user
        ? { ...state.user, totalCoins: state.user.totalCoins + amount }
        : null,
    })),

  hasRole: (roles) => {
    const { user } = get();
    return user ? roles.includes(user.role) : false;
  },
}));
