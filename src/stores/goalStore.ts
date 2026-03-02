import { create } from 'zustand';
import type { Goal } from '../types/goal';
import { goalService, type CreateGoalData } from '../services/goalService';

interface GoalStore {
  goals: Goal[];
  loading: boolean;
  error: string | null;
  fetchGoals: () => Promise<void>;
  addGoal: (goal: CreateGoalData) => Promise<Goal>;
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  completeGoal: (id: string) => Promise<{ goal: Goal; coinsEarned: number }>;
  getGoalById: (id: string) => Goal | undefined;
}

export const useGoalStore = create<GoalStore>((set, get) => ({
  goals: [],
  loading: false,
  error: null,

  fetchGoals: async () => {
    console.log('[goalStore] Fetching goals...');
    set({ loading: true, error: null });
    try {
      const goals = await goalService.getAllGoals();
      console.log('[goalStore] Fetched', goals.length, 'goals');
      set({ goals, loading: false });
    } catch (error: any) {
      console.error('[goalStore] Error:', error);
      set({ error: error.message, loading: false });
    }
  },

  addGoal: async (goal) => {
    console.log('[goalStore] Adding goal:', goal.title);
    set({ loading: true, error: null });
    try {
      const newGoal = await goalService.createGoal(goal);
      console.log('[goalStore] Goal added successfully:', newGoal._id);
      set((state) => ({
        goals: [...state.goals, newGoal],
        loading: false,
      }));
      return newGoal;
    } catch (error: any) {
      console.error('[goalStore] Error adding goal:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateGoal: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      const updatedGoal = await goalService.updateGoal(id, updates);
      set((state) => ({
        goals: state.goals.map((goal) =>
          (goal._id || goal.id) === id ? updatedGoal : goal
        ),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteGoal: async (id) => {
    set({ loading: true, error: null });
    try {
      await goalService.deleteGoal(id);
      set((state) => ({
        goals: state.goals.filter((goal) => (goal._id || goal.id) !== id),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  completeGoal: async (id) => {
    set({ loading: true, error: null });
    try {
      const result = await goalService.completeGoal(id);
      set((state) => ({
        goals: state.goals.map((goal) =>
          (goal._id || goal.id) === id ? result.goal : goal
        ),
        loading: false,
      }));
      return result;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  getGoalById: (id) =>
    get().goals.find((goal) => (goal._id || goal.id) === id),
}));
