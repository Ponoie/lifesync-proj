import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CoinState {
  totalCoins: number;
  addCoins: (amount: number, reason?: string) => void;
  spendCoins: (amount: number, reason?: string) => boolean;
  setCoins: (amount: number) => void;
  transactionHistory: Array<{ amount: number; reason: string; timestamp: Date }>;
}

export const useCoinStore = create<CoinState>()(
  persist(
    (set, get) => ({
      totalCoins: 250,
      transactionHistory: [],

      addCoins: (amount, reason = 'Coins earned') =>
        set((state) => ({
          totalCoins: state.totalCoins + amount,
          transactionHistory: [
            ...state.transactionHistory,
            { amount, reason, timestamp: new Date() },
          ],
        })),

      spendCoins: (amount, reason = 'Coins spent') => {
        const { totalCoins } = get();
        if (totalCoins < amount) return false;

        set((state) => ({
          totalCoins: state.totalCoins - amount,
          transactionHistory: [
            ...state.transactionHistory,
            { amount: -amount, reason, timestamp: new Date() },
          ],
        }));
        return true;
      },

      setCoins: (amount) => set({ totalCoins: amount }),
    }),
    {
      name: 'coin-storage',
    }
  )
);
