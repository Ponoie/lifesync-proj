import { useState, useEffect, useMemo } from "react";
import type { Habit } from "../types/habit";
import { calculateHabitCoins } from "../services/habitService";
import { HabitCoinRewardDialog } from "./HabitCoinRewardDialog";
import { useHabitStore } from "../stores/habitStore";
import { useNavigate } from "react-router-dom";

interface HabitItemProps {
  habit: Habit;
  onClaimSuccess?: () => void;
  showStrikethrough?: boolean;
}

export function HabitItem({ habit: habitProp, onClaimSuccess, showStrikethrough = true }: HabitItemProps) {
  const [showCoinReward, setShowCoinReward] = useState(false);
  const [claimedCoinsForHabit, setClaimedCoinsForHabit] = useState<Set<string>>(
    new Set(),
  );
  const toggleHabitStore = useHabitStore((state) => state.toggleHabit);
  const claimHabitCoins = useHabitStore((state) => state.claimHabitCoins);
  const habits = useHabitStore((state) => state.habits);
  const navigate = useNavigate();

  // Get the most up-to-date habit from the store
  const habit = useMemo(() => {
    const habitId = habitProp._id || habitProp.id;
    const updatedHabit = habits.find((h) => (h._id || h.id) === habitId);
    return updatedHabit || habitProp;
  }, [habitProp, habits]);

  // Sync local state with habit prop changes
  useEffect(() => {
    console.log("[HabitItem] Habit updated:", habit.name, habit.completedToday, habit.streak);
  }, [habit]);

  const handleComplete = async () => {
    const habitId = habit._id || habit.id;
    console.log("[HabitItem] handleComplete called, habitId:", habitId, "completedToday:", habit.completedToday);

    if (!habitId) {
      console.error("[HabitItem] No habit ID found!");
      return;
    }

    const wasPreviouslyCompleted = habit.completedToday;
    console.log("[HabitItem] wasPreviouslyCompleted:", wasPreviouslyCompleted);

    try {
      // Call API to toggle habit
      console.log("[HabitItem] Calling toggleHabitStore...");
      const updatedHabit = await toggleHabitStore(habitId);

      console.log("[HabitItem] Habit toggled successfully:", updatedHabit);

      // Show coin reward if just completed (works for all frequencies)
      if (!wasPreviouslyCompleted && updatedHabit.completedToday) {
        console.log("[HabitItem] Showing coin reward dialog...");
        setTimeout(() => {
          setShowCoinReward(true);
        }, 500);
      }
    } catch (error) {
      console.error("[HabitItem] Error toggling habit:", error);
    }
  };

  const handleClaimCoins = async (_newTotalCoins: number) => {
    const habitId = habit._id || habit.id;
    if (habitId) {
      setClaimedCoinsForHabit((prev) => new Set([...prev, habitId]));

      try {
        await claimHabitCoins(habitId, habit.frequency, habit.streak);

        setShowCoinReward(false);

        // Trigger refresh callback
        if (onClaimSuccess) {
          onClaimSuccess();
        }

        // Navigate to dashboard after claiming
        setTimeout(() => {
          navigate("/dashboard");
        }, 300);
      } catch (error) {
        console.error("Failed to claim coins:", error);
      }
    }
  };

  const getFrequencyColor = (frequency: Habit["frequency"]) => {
    switch (frequency) {
      case "daily":
        return "bg-blue-100 text-blue-800";
      case "weekly":
        return "bg-purple-100 text-purple-800";
      case "monthly":
        return "bg-orange-100 text-orange-800";
    }
  };

  // Calculate coins for display
  const calculation = calculateHabitCoins(habit.frequency, habit.streak);
  const habitId = habit._id || habit.id;

  return (
    <>
      <div
        className={`p-3 border rounded-lg flex items-center gap-3 transition-colors ${
          habit.completedToday
            ? "bg-green-50 border-green-300"
            : "bg-white border-gray-200"
        }`}
      >
        <button
          onClick={handleComplete}
          disabled={habit.coinsClaimed}
          className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
            habit.completedToday
              ? "bg-green-500 border-green-500 text-white"
              : "border-gray-300 hover:border-green-500"
          } ${habit.coinsClaimed ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {habit.completedToday && <span className="text-sm">✓</span>}
        </button>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            {habit.icon && <span className="text-lg">{habit.icon}</span>}
            <span
              className={`font-medium ${
                showStrikethrough && habit.completedToday ? "line-through text-gray-500" : "text-gray-800"
              }`}
            >
              {habit.name}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded ${getFrequencyColor(
                habit.frequency,
              )}`}
            >
              {habit.frequency}
            </span>
            {habit.coinsClaimed && (
              <span className="text-xs px-2 py-0.5 rounded bg-yellow-100 text-yellow-800">
                Coins claimed ✓
              </span>
            )}
          </div>

          {habit.streak > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <span className="text-orange-500">🔥</span>
              <span className="text-sm text-gray-600">
                {habit.streak} day streak!
              </span>
            </div>
          )}

          {habit.completedToday && !habit.coinsClaimed && (
            <p className="text-sm text-green-600 mt-1">
              Great job! Keep it up! 💪
            </p>
          )}
        </div>
      </div>

      <HabitCoinRewardDialog
        isOpen={showCoinReward && !claimedCoinsForHabit.has(habitId || "")}
        onClose={() => setShowCoinReward(false)}
        habitName={habit.name}
        frequency={habit.frequency}
        streak={habit.streak}
        calculation={calculation}
        onClaimSuccess={handleClaimCoins}
      />
    </>
  );
}
