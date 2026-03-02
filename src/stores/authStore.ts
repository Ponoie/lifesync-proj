import { create } from "zustand";
import type { User, UserRole } from "../types/auth";
import { authService } from "../services/authService";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
  logout: () => void;
  updateUserCoins: (amount: number) => void;
  hasRole: (roles: UserRole[]) => boolean;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,

  // Initialize auth from stored token
  initializeAuth: async () => {
    const token = authService.getToken();
    const storedUser = authService.getUser();

    if (token && storedUser) {
      try {
        // Verify token is still valid by fetching current user
        const currentUser = await authService.getCurrentUser();
        set({ user: currentUser, isAuthenticated: true, isLoading: false });
      } catch (error) {
        // Token is invalid, clear stored data
        authService.logout();
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } else {
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const user = await authService.login({ email, password });
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (email, password, username) => {
    set({ isLoading: true });
    try {
      const user = await authService.register({ email, password, username });
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    authService.logout();
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
