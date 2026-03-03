import { useAuthStore } from "../stores/authStore";
import type { HabitCoinCalculation } from "../services/habitService";

interface HabitCoinRewardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  habitName: string;
  frequency: "daily" | "weekly" | "monthly";
  streak: number;
  calculation: HabitCoinCalculation;
  onClaimSuccess: (newTotalCoins: number) => void;
}

export function HabitCoinRewardDialog({
  isOpen,
  onClose,
  habitName,
  frequency,
  streak,
  calculation,
  onClaimSuccess,
}: HabitCoinRewardDialogProps) {
  const { updateUserCoins } = useAuthStore();

  if (!isOpen) return null;

  const handleClaim = async () => {
    // Update user's coins in auth store
    updateUserCoins(calculation.totalCoins);

    // Call success callback
    onClaimSuccess(calculation.totalCoins);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="text-center">
          {/* Coin Icon Animation */}
          <div className="text-6xl mb-4 animate-bounce">🪙</div>

          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Habit Completed!
          </h2>
          <p className="text-gray-600 mb-6">
            Great job on completing: <strong>{habitName}</strong>
          </p>

          {/* Stats Card */}
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-4 mb-6 border-2 border-yellow-200">
            <div className="text-4xl font-bold text-yellow-600 mb-2">
              +{calculation.totalCoins}
            </div>
            <p className="text-sm text-gray-600 mb-4">Coins Earned</p>

            {/* Breakdown */}
            <div className="text-left space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">
                  Base Reward ({frequency}):
                </span>
                <span className="font-semibold">+{calculation.baseReward}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">
                  Streak Bonus ({streak} day streak):
                </span>
                <span className="font-semibold">
                  +{calculation.streakBonus}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Frequency Multiplier:</span>
                <span className="font-semibold">
                  x{calculation.frequencyMultiplier}
                </span>
              </div>
              <div className="border-t border-yellow-300 pt-2 mt-2">
                <div className="flex justify-between font-bold">
                  <span className="text-gray-800">Total:</span>
                  <span className="text-yellow-600">
                    +{calculation.totalCoins}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Encouragement Message */}
          {streak >= 7 && (
            <div className="mb-4 p-3 bg-orange-100 rounded-lg">
              <p className="text-orange-800 font-medium">
                🔥 Amazing! {streak} day streak!
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleClaim}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-colors font-semibold shadow-md"
            >
              Claim Coins!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
