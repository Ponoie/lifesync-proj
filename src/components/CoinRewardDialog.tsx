import { useEffect, useState } from "react";
import { coinService } from "../services/coinService";
import { useAuthStore } from "../stores/authStore";
import { useGoalStore } from "../stores/goalStore";

interface CoinCalculation {
  baseReward: number;
  timeBonus: number;
  speedMultiplier: number;
  totalCoins: number;
}

interface CoinRewardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  goalId: string;
  subtasks: Array<{
    title: string;
    dueDate: string;
    completedAt?: string;
  }>;
  goalTargetDate: string;
  onClaimSuccess?: (newTotalCoins: number) => void;
}

export function CoinRewardDialog({
  isOpen,
  onClose,
  goalId,
  subtasks,
  goalTargetDate,
  onClaimSuccess,
}: CoinRewardDialogProps) {
  const [calculation, setCalculation] = useState<CoinCalculation | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [error, setError] = useState("");
  const { user } = useAuthStore();
  const updateGoalInStore = useGoalStore((state) => state.updateGoalInStore);

  useEffect(() => {
    if (isOpen && !claimed) {
      // Calculate coins when dialog opens
      const calc = coinService.calculateCoinsEarned(subtasks, goalTargetDate);
      setCalculation(calc);
      setError("");
    }
  }, [isOpen, subtasks, goalTargetDate, claimed]);

  const handleClaim = async () => {
    if (!calculation || isClaiming || claimed) return;

    setIsClaiming(true);
    setError("");

    try {
      const response = await coinService.claimCoins({
        goalId,
        subtasks,
        goalTargetDate,
      });

      if (response.success && response.data) {
        setClaimed(true);

        // Update local auth store with new coin balance
        const coinsEarned = response.data.coinsEarned;
        const newTotalCoins = response.data.newTotalCoins;

        // Update user coins in auth store
        useAuthStore.getState().updateUserCoins(coinsEarned);

        // Update goal in store with coinsClaimed = true
        if (response.data.goal) {
          updateGoalInStore(response.data.goal);
        }

        // Call success callback (will navigate to dashboard)
        onClaimSuccess?.(newTotalCoins);

        // Close dialog after a short delay to show success
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to claim coins";
      setError(errorMessage);
    } finally {
      setIsClaiming(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-bounce-in">
        {!claimed ? (
          <>
            {/* Header */}
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Congratulations!
              </h2>
              <p className="text-gray-600">
                You've completed all subtasks! Claim your reward now.
              </p>
            </div>

            {/* Coin Calculation */}
            {calculation && (
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4 mb-6 border-2 border-yellow-200">
                <div className="text-center mb-4">
                  <p className="text-sm text-gray-600 mb-1">
                    Total Coins Earned
                  </p>
                  <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-orange-600">
                    {calculation.totalCoins}
                  </p>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center py-2 border-b border-yellow-200">
                    <span className="text-gray-600">Base Reward</span>
                    <span className="font-semibold text-gray-800">
                      +{calculation.baseReward}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-yellow-200">
                    <span className="text-gray-600">Time Bonus</span>
                    <span className="font-semibold text-green-600">
                      +{calculation.timeBonus}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">Speed Multiplier</span>
                    <span className="font-semibold text-blue-600">
                      x{calculation.speedMultiplier}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleClaim}
                disabled={isClaiming || !calculation}
                className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold py-3 px-6 rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {isClaiming ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Claiming...
                  </span>
                ) : (
                  "Claim Coins 🪙"
                )}
              </button>
              <button
                onClick={onClose}
                disabled={isClaiming}
                className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Later
              </button>
            </div>
          </>
        ) : (
          // Success State
          <div className="text-center py-8">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">
              Coins Claimed!
            </h2>
            <p className="text-gray-600 mb-4">
              {calculation?.totalCoins} coins have been added to your balance.
            </p>
            {user && (
              <div className="bg-gray-100 rounded-lg p-4 inline-block">
                <p className="text-sm text-gray-600">Your Balance</p>
                <p className="text-2xl font-bold text-gray-800">
                  🪙 {user.totalCoins}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
