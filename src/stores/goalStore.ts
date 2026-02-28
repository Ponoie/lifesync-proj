import { create } from 'zustand';
import type { Goal } from '../types/goal';

interface GoalStore {
  goals: Goal[];
  addGoal: (goal: Omit<Goal, 'id'>) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  getGoalById: (id: string) => Goal | undefined;
}

export const useGoalStore = create<GoalStore>((set, get) => ({
  goals: [
    {
      id: '1',
      title: 'Learn React',
      description: 'Master React fundamentals including hooks, state management, and component lifecycle',
      completed: false,
      progress: 60,
    },
    {
      id: '2',
      title: 'Build Portfolio',
      description: 'Create a personal portfolio website to showcase projects',
      completed: true,
      progress: 100,
    },
    {
      id: '3',
      title: 'Learn TypeScript',
      description: 'Master TypeScript for type-safe React development',
      completed: false,
      progress: 40,
    },
  ],

  addGoal: (goal) =>
    set((state) => ({
      goals: [
        ...state.goals,
        { ...goal, id: Date.now().toString() },
      ],
    })),

  updateGoal: (id, updates) =>
    set((state) => ({
      goals: state.goals.map((goal) =>
        goal.id === id ? { ...goal, ...updates } : goal
      ),
    })),

  deleteGoal: (id) =>
    set((state) => ({
      goals: state.goals.filter((goal) => goal.id !== id),
    })),

  getGoalById: (id) => get().goals.find((goal) => goal.id === id),
}));
