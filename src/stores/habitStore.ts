import { create } from "zustand";
import type { Habit } from "../types/habit";
import {
  claimHabitCoins,
  toggleHabit,
  fetchHabits as fetchHabitsAPI,
  fetchAllHabits as fetchAllHabitsAPI,
  createHabit as createHabitAPI,
} from "../services/habitService";

interface HabitStore {
  habits: Habit[];
  loading: boolean;
  error: string | null;
  setHabits: (habits: Habit[]) => void;
  updateHabitInStore: (habit: Habit) => void;
  fetchHabits: () => Promise<void>;
  fetchAllHabits: () => Promise<Habit[]>;
  createHabit: (data: {
    name: string;
    description?: string;
    frequency: "daily" | "weekly" | "monthly";
    icon?: string;
  }) => Promise<Habit>;
  toggleHabit: (habitId: string) => Promise<Habit>;
  claimHabitCoins: (
    habitId: string,
    frequency: "daily" | "weekly" | "monthly",
    streak: number,
  ) => Promise<number>;
}

export const useHabitStore = create<HabitStore>((set) => ({
  habits: [],
  loading: false,
  error: null,

  setHabits: (habits) => set({ habits }),

  updateHabitInStore: (habit) => {
    set((state) => ({
      habits: state.habits.map((h) =>
        (h._id || h.id) === (habit._id || habit.id) ? habit : h,
      ),
    }));
  },

  fetchHabits: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetchHabitsAPI();
      const habits = response.data.map((h) => ({
        ...h,
        id: h._id || h.id,
      })) as Habit[];
      set({ habits, loading: false });
    } catch (error: any) {
      console.error("[habitStore] Error fetching habits:", error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  fetchAllHabits: async () => {
    try {
      const response = await fetchAllHabitsAPI();
      const habits = response.data.map((h) => ({
        ...h,
        id: h._id || h.id,
      })) as Habit[];
      return habits;
    } catch (error: any) {
      console.error("[habitStore] Error fetching all habits:", error);
      throw error;
    }
  },

  createHabit: async (data) => {
    set({ loading: true, error: null });
    try {
      const response = await createHabitAPI(data);
      const newHabit = {
        ...response.data,
        id: response.data._id || response.data.id,
      } as Habit;

      // Add new habit to store
      set((state) => ({
        habits: [...state.habits, newHabit],
        loading: false,
      }));

      return newHabit;
    } catch (error: any) {
      console.error("[habitStore] Error creating habit:", error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  toggleHabit: async (habitId) => {
    console.log("[habitStore] toggleHabit called with habitId:", habitId);
    set({ loading: true, error: null });
    try {
      console.log("[habitStore] Calling toggleHabit API...");
      const response = await toggleHabit(habitId);
      console.log("[habitStore] API response:", response);

      const updatedHabit = {
        ...response.data,
        id: response.data._id || response.data.id,
      } as Habit;

      console.log("[habitStore] Updated habit:", updatedHabit);

      // Update habit in store
      set((state) => {
        console.log("[habitStore] Previous habits:", state.habits);
        const newHabits = state.habits.map((h) =>
          (h._id || h.id) === habitId ? updatedHabit : h,
        );
        console.log("[habitStore] New habits:", newHabits);
        return {
          habits: newHabits,
          loading: false,
        };
      });

      return updatedHabit;
    } catch (error: any) {
      console.error("[habitStore] Error toggling habit:", error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  claimHabitCoins: async (habitId, frequency, streak) => {
    set({ loading: true, error: null });
    try {
      const response = await claimHabitCoins(habitId, frequency, streak);

      // Remove habit from store (it will be hidden until next cycle)
      set((state) => ({
        habits: state.habits.filter((h) => (h._id || h.id) !== habitId),
        loading: false,
      }));

      return response.data.newTotalCoins;
    } catch (error: any) {
      console.error("[habitStore] Error claiming coins:", error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },
}));
