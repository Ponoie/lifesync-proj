import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useHabitStore } from "../stores/habitStore";
import { useThemeStore } from "../stores/themeStore";
import { useAuthStore } from "../stores/authStore";

const ICONS = [
  "⭐",
  "🏃",
  "📚",
  "💪",
  "🧘",
  "💧",
  "🍎",
  "😴",
  "🧠",
  "✍️",
  "🎨",
  "🎵",
];

export function HabitCreationPage() {
  const theme = useThemeStore((state) => state.theme);
  const createHabit = useHabitStore((state) => state.createHabit);
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "monthly">(
    "daily",
  );
  const [icon, setIcon] = useState("⭐");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if user is authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!name.trim()) {
      setError("Habit name is required");
      return;
    }

    if (name.length < 2) {
      setError("Habit name must be at least 2 characters");
      return;
    }

    if (name.length > 50) {
      setError("Habit name cannot exceed 50 characters");
      return;
    }

    setIsSubmitting(true);

    try {
      await createHabit({
        name: name.trim(),
        description: description.trim() || undefined,
        frequency,
        icon,
      });

      // Navigate back to dashboard
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to create habit");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate("/dashboard")}
          className={`text-sm mb-4 inline-flex items-center gap-1 ${
            theme === "dark"
              ? "text-gray-400 hover:text-white"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          ← Back to Dashboard
        </button>
        <h1
          className={`text-2xl font-bold ${
            theme === "dark" ? "text-white" : "text-gray-800"
          }`}
        >
          Create New Habit
        </h1>
        <p
          className={`text-sm mt-1 ${
            theme === "dark" ? "text-gray-400" : "text-gray-600"
          }`}
        >
          Start building better habits today! 🎯
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className={`p-6 rounded-lg border ${
          theme === "dark"
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-gray-200"
        }`}
      >
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Habit Name */}
        <div className="mb-4">
          <label
            className={`block text-sm font-medium mb-2 ${
              theme === "dark" ? "text-gray-300" : "text-gray-700"
            }`}
          >
            Habit Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Morning Exercise, Read 30 minutes"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              theme === "dark"
                ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
            }`}
            maxLength={50}
          />
          <p className="text-xs text-gray-500 mt-1">
            {name.length}/50 characters
          </p>
        </div>

        {/* Description */}
        <div className="mb-4">
          <label
            className={`block text-sm font-medium mb-2 ${
              theme === "dark" ? "text-gray-300" : "text-gray-700"
            }`}
          >
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description to remind yourself why this habit matters..."
            rows={3}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
              theme === "dark"
                ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
            }`}
            maxLength={200}
          />
          <p className="text-xs text-gray-500 mt-1">
            {description.length}/200 characters
          </p>
        </div>

        {/* Frequency */}
        <div className="mb-4">
          <label
            className={`block text-sm font-medium mb-2 ${
              theme === "dark" ? "text-gray-300" : "text-gray-700"
            }`}
          >
            Frequency *
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(["daily", "weekly", "monthly"] as const).map((freq) => (
              <button
                key={freq}
                type="button"
                onClick={() => setFrequency(freq)}
                className={`px-4 py-3 rounded-lg border-2 transition-colors capitalize ${
                  frequency === freq
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : theme === "dark"
                      ? "border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500"
                      : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                }`}
              >
                {freq}
              </button>
            ))}
          </div>
        </div>

        {/* Icon */}
        <div className="mb-6">
          <label
            className={`block text-sm font-medium mb-2 ${
              theme === "dark" ? "text-gray-300" : "text-gray-700"
            }`}
          >
            Choose Icon
          </label>
          <div className="grid grid-cols-6 gap-2">
            {ICONS.map((iconOption) => (
              <button
                key={iconOption}
                type="button"
                onClick={() => setIcon(iconOption)}
                className={`p-3 text-2xl rounded-lg border-2 transition-colors ${
                  icon === iconOption
                    ? "border-blue-500 bg-blue-50"
                    : theme === "dark"
                      ? "border-gray-600 bg-gray-700 hover:border-gray-500"
                      : "border-gray-300 bg-white hover:border-gray-400"
                }`}
              >
                {iconOption}
              </button>
            ))}
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
              theme === "dark"
                ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                : "border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold transition-colors hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isSubmitting ? "Creating..." : "Create Habit"}
          </button>
        </div>
      </form>
    </div>
  );
}
