import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useGoalStore } from "../stores/goalStore";
import { useThemeStore } from "../stores/themeStore";

type Step = 1 | 2 | 3;

interface GoalFormData {
  title: string;
  description: string;
  targetDate: string;
  subtasks: Array<{
    title: string;
    description: string;
    dueDate: string;
  }>;
}

export function GoalCreationPage() {
  const navigate = useNavigate();
  const theme = useThemeStore((state) => state.theme);
  const addGoal = useGoalStore((state) => state.addGoal);

  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [formData, setFormData] = useState<GoalFormData>({
    title: "",
    description: "",
    targetDate: "",
    subtasks: [],
  });

  const [currentSubtask, setCurrentSubtask] = useState({
    title: "",
    description: "",
    dueDate: "",
  });
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [dateError, setDateError] = useState("");

  const handleNext = () => {
    if (currentStep === 1) {
      if (!formData.title || !formData.description) {
        setError("Please fill in all fields");
        return;
      }
      if (formData.title.length < 3) {
        setError("Title must be at least 3 characters");
        return;
      }
      if (formData.description.length < 10) {
        setError("Description must be at least 10 characters");
        return;
      }
      setError("");
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!formData.targetDate) {
        setError("Please select a target date");
        return;
      }
      setError("");
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step);
    }
  };

  const handleAddSubtask = () => {
    if (!currentSubtask.title) {
      setError("Please fill in subtask title");
      return;
    }

    // Validate due date if provided
    if (currentSubtask.dueDate) {
      const validationError = validateSubtaskDueDate(currentSubtask.dueDate);
      if (validationError) {
        setDateError(validationError);
        return;
      }
    }

    if (editingIndex !== null) {
      // Update existing subtask
      setFormData({
        ...formData,
        subtasks: formData.subtasks.map((st, i) =>
          i === editingIndex ? { ...currentSubtask } : st,
        ),
      });
      setEditingIndex(null);
    } else {
      // Add new subtask
      setFormData({
        ...formData,
        subtasks: [
          ...formData.subtasks,
          {
            ...currentSubtask,
          },
        ],
      });
    }

    setCurrentSubtask({ title: "", description: "", dueDate: "" });
    setIsAddingSubtask(false);
    setError("");
    setDateError("");
  };

  // Validate subtask due date based on constraints
  const validateSubtaskDueDate = (dueDateStr: string): string => {
    const newDueDate = new Date(dueDateStr);
    newDueDate.setHours(0, 0, 0, 0);

    // Check if goal has a target date
    if (!formData.targetDate) {
      return "Please set a goal target date first (Step 2)";
    }

    const goalTargetDate = new Date(formData.targetDate);
    goalTargetDate.setHours(0, 0, 0, 0);

    // Check if due date is after goal's target date
    if (newDueDate > goalTargetDate) {
      return `Subtask due date cannot be after goal's target date (${formatDate(goalTargetDate)})`;
    }

    // Check if due date is before today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (newDueDate < today) {
      return "Subtask due date cannot be in the past";
    }

    // Get existing subtasks (excluding the one being edited)
    const existingSubtasks = editingIndex !== null
      ? formData.subtasks.filter((_, i) => i !== editingIndex)
      : formData.subtasks;

    // Sort by due date
    const sortedSubtasks = [...existingSubtasks].sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

    // If there are existing subtasks with due dates, validate against them
    const subtasksWithDates = sortedSubtasks.filter(st => st.dueDate);

    if (subtasksWithDates.length > 0) {
      const lastSubtask = subtasksWithDates[subtasksWithDates.length - 1];
      if (lastSubtask.dueDate) {
        const lastSubtaskDueDate = new Date(lastSubtask.dueDate);
        lastSubtaskDueDate.setHours(0, 0, 0, 0);

        // New subtask must be after the last subtask
        if (newDueDate <= lastSubtaskDueDate) {
          return `Subtask due date must be after the last subtask (${formatDate(lastSubtaskDueDate)})`;
        }
      }
    }

    return "";
  };

  // Helper to format date for display
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Get min and max dates for the date picker
  const getDateConstraints = () => {
    if (!formData.targetDate) return { minDate: "", maxDate: "" };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const goalTargetDate = new Date(formData.targetDate);
    goalTargetDate.setHours(0, 0, 0, 0);

    // Get existing subtasks (excluding the one being edited)
    const existingSubtasks = editingIndex !== null
      ? formData.subtasks.filter((_, i) => i !== editingIndex)
      : formData.subtasks;

    // Sort by due date and filter those with due dates
    const sortedSubtasks = [...existingSubtasks]
      .filter(st => st.dueDate)
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());

    let minDate = today.toISOString().split('T')[0];
    let maxDate = goalTargetDate.toISOString().split('T')[0];

    // If there are existing subtasks with due dates, min date should be after the last one
    if (sortedSubtasks.length > 0) {
      const lastSubtask = sortedSubtasks[sortedSubtasks.length - 1];
      if (lastSubtask.dueDate) {
        const lastSubtaskDueDate = new Date(lastSubtask.dueDate);
        lastSubtaskDueDate.setDate(lastSubtaskDueDate.getDate() + 1); // Add 1 day
        minDate = lastSubtaskDueDate.toISOString().split('T')[0];
      }
    }

    return { minDate, maxDate };
  };

  const { minDate, maxDate } = getDateConstraints();

  const handleEditSubtask = (index: number) => {
    const subtask = formData.subtasks[index];
    setCurrentSubtask({
      title: subtask.title,
      description: subtask.description,
      dueDate: subtask.dueDate,
    });
    setEditingIndex(index);
    setIsAddingSubtask(true);
    setError("");
    setDateError("");
  };

  const handleRemoveSubtask = (index: number) => {
    setFormData({
      ...formData,
      subtasks: formData.subtasks.filter((_, i) => i !== index),
    });
    // If we're editing the removed subtask, reset the form
    if (editingIndex === index) {
      setCurrentSubtask({ title: "", description: "", dueDate: "" });
      setEditingIndex(null);
      setIsAddingSubtask(false);
    }
  };

  const calculateSubtaskDates = () => {
    if (!formData.targetDate || formData.subtasks.length === 0) return [];

    const startDate = new Date();
    const endDate = new Date(formData.targetDate);
    const totalDuration = endDate.getTime() - startDate.getTime();
    const interval = totalDuration / (formData.subtasks.length + 1);

    return formData.subtasks.map((subtask, index) => {
      const subtaskStartDate = new Date(startDate.getTime() + interval * index);
      const subtaskEndDate = new Date(
        startDate.getTime() + interval * (index + 1),
      );

      return {
        ...subtask,
        startDate: subtaskStartDate.toISOString().split("T")[0],
        dueDate: subtaskEndDate.toISOString().split("T")[0],
      };
    });
  };

  const handleSubmit = async () => {
    try {
      console.log("[GoalCreationPage] Submitting goal...");
      const subtasksWithDates = calculateSubtaskDates();

      console.log("[GoalCreationPage] Subtasks with dates:", subtasksWithDates);

      const goalData = {
        title: formData.title,
        description: formData.description,
        targetDate: formData.targetDate,
        subtasks: subtasksWithDates.map((st) => ({
          title: st.title,
          description: st.description,
          startDate: st.startDate,
          dueDate: st.dueDate,
          completed: false,
        })),
      };

      console.log("[GoalCreationPage] Creating goal with data:", goalData);

      const newGoal = await addGoal(goalData);

      console.log("[GoalCreationPage] Goal created successfully!", newGoal);

      // Show success alert
      alert("✅ Goal created successfully!");

      // Navigate to dashboard
      navigate("/dashboard");
    } catch (err: any) {
      console.error("[GoalCreationPage] Error creating goal:", err);
      setError(err.message || "Failed to create goal");
      alert("❌ Failed to create goal: " + (err.message || "Unknown error"));
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h2
          className={`text-xl font-semibold mb-4 ${
            theme === "dark" ? "text-white" : "text-gray-800"
          }`}
        >
          Step 1: Goal Information
        </h2>
        <p
          className={`text-sm mb-6 ${
            theme === "dark" ? "text-gray-400" : "text-gray-600"
          }`}
        >
          Tell us about your goal. What do you want to achieve?
        </p>
      </div>

      <div>
        <label
          className={`block text-sm font-medium mb-2 ${
            theme === "dark" ? "text-white" : "text-gray-700"
          }`}
        >
          Goal Title *
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className={`w-full px-4 py-2 rounded-lg border ${
            theme === "dark"
              ? "bg-gray-700 border-gray-600 text-white"
              : "bg-white border-gray-300"
          }`}
          placeholder="e.g., Learn Tennis"
        />
      </div>

      <div>
        <label
          className={`block text-sm font-medium mb-2 ${
            theme === "dark" ? "text-white" : "text-gray-700"
          }`}
        >
          Description *
        </label>
        <textarea
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          rows={4}
          className={`w-full px-4 py-2 rounded-lg border ${
            theme === "dark"
              ? "bg-gray-700 border-gray-600 text-white"
              : "bg-white border-gray-300"
          }`}
          placeholder="Describe your goal in detail..."
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h2
          className={`text-xl font-semibold mb-4 ${
            theme === "dark" ? "text-white" : "text-gray-800"
          }`}
        >
          Step 2: Timeline
        </h2>
        <p
          className={`text-sm mb-6 ${
            theme === "dark" ? "text-gray-400" : "text-gray-600"
          }`}
        >
          When do you want to achieve this goal?
        </p>
      </div>

      <div>
        <label
          className={`block text-sm font-medium mb-2 ${
            theme === "dark" ? "text-white" : "text-gray-700"
          }`}
        >
          Target Completion Date *
        </label>
        <input
          type="date"
          value={formData.targetDate}
          onChange={(e) =>
            setFormData({ ...formData, targetDate: e.target.value })
          }
          min={new Date().toISOString().split("T")[0]}
          className={`w-full px-4 py-2 rounded-lg border ${
            theme === "dark"
              ? "bg-gray-700 border-gray-600 text-white"
              : "bg-white border-gray-300"
          }`}
        />
      </div>

      <div
        className={`p-4 rounded-lg border ${
          theme === "dark"
            ? "bg-gray-800 border-gray-700"
            : "bg-blue-50 border-blue-200"
        }`}
      >
        <h3
          className={`font-semibold mb-2 ${
            theme === "dark" ? "text-white" : "text-blue-900"
          }`}
        >
          💡 Tip
        </h3>
        <p
          className={`text-sm ${
            theme === "dark" ? "text-gray-300" : "text-blue-800"
          }`}
        >
          In the next step, you can break down this goal into smaller subtasks
          with automatic timeline distribution!
        </p>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h2
          className={`text-xl font-semibold mb-4 ${
            theme === "dark" ? "text-white" : "text-gray-800"
          }`}
        >
          Step 3: Subtasks
        </h2>
        <p
          className={`text-sm mb-6 ${
            theme === "dark" ? "text-gray-400" : "text-gray-600"
          }`}
        >
          Break down your goal into manageable subtasks. We'll automatically
          schedule them across your timeline!
        </p>
      </div>

      {/* Existing Subtasks */}
      {formData.subtasks.length > 0 && (
        <div className="space-y-3">
          <h3
            className={`font-medium ${
              theme === "dark" ? "text-white" : "text-gray-800"
            }`}
          >
            Subtasks ({formData.subtasks.length})
          </h3>
          {formData.subtasks.map((subtask, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${
                theme === "dark"
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4
                    className={`font-medium ${
                      theme === "dark" ? "text-white" : "text-gray-800"
                    }`}
                  >
                    {subtask.title}
                  </h4>
                  {subtask.description && (
                    <p
                      className={`text-sm mt-1 ${
                        theme === "dark" ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      {subtask.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditSubtask(index)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleRemoveSubtask(index)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Subtask Form */}
      {!isAddingSubtask ? (
        <button
          onClick={() => setIsAddingSubtask(true)}
          className={`w-full px-4 py-3 rounded-lg border-2 border-dashed transition-colors ${
            theme === "dark"
              ? "border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300"
              : "border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700"
          }`}
        >
          + Add Subtask
        </button>
      ) : (
        <div
          className={`p-4 rounded-lg border ${
            theme === "dark"
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          }`}
        >
          <h3
            className={`font-medium mb-4 ${
              theme === "dark" ? "text-white" : "text-gray-800"
            }`}
          >
            {editingIndex !== null ? "Edit Subtask" : "Add New Subtask"}
          </h3>
          <div className="space-y-4">
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  theme === "dark" ? "text-white" : "text-gray-700"
                }`}
              >
                Subtask Title *
              </label>
              <input
                type="text"
                value={currentSubtask.title}
                onChange={(e) =>
                  setCurrentSubtask({
                    ...currentSubtask,
                    title: e.target.value,
                  })
                }
                className={`w-full px-4 py-2 rounded-lg border ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300"
                }`}
                placeholder="e.g., Learn basic forehand"
              />
            </div>
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  theme === "dark" ? "text-white" : "text-gray-700"
                }`}
              >
                Description (optional)
              </label>
              <textarea
                value={currentSubtask.description}
                onChange={(e) =>
                  setCurrentSubtask({
                    ...currentSubtask,
                    description: e.target.value,
                  })
                }
                rows={2}
                className={`w-full px-4 py-2 rounded-lg border ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300"
                }`}
                placeholder="Additional details..."
              />
            </div>
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  theme === "dark" ? "text-white" : "text-gray-700"
                }`}
              >
                Due Date (optional - leave empty for auto-calculation)
              </label>
              <input
                type="date"
                value={currentSubtask.dueDate}
                onChange={(e) => {
                  setCurrentSubtask({
                    ...currentSubtask,
                    dueDate: e.target.value,
                  });
                  setDateError(""); // Clear error when user changes date
                }}
                min={minDate}
                max={maxDate}
                className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  dateError
                    ? "border-red-500 focus:ring-red-500"
                    : ""
                } ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300"
                }`}
              />
              {dateError && (
                <p className="text-red-600 text-sm mt-1">{dateError}</p>
              )}
              {formData.targetDate && !dateError && (
                <p className={`text-xs mt-1 ${
                  theme === "dark" ? "text-gray-400" : "text-gray-500"
                }`}>
                  {minDate && maxDate
                    ? `Must be between ${formatDate(new Date(minDate))} and ${formatDate(new Date(maxDate))}`
                    : `Must be on or before ${formatDate(new Date(formData.targetDate))}`
                  }
                  {formData.subtasks.length > (editingIndex !== null ? 1 : 0) && ` (after last subtask)`}
                </p>
              )}
              {!formData.targetDate && (
                <p className={`text-xs mt-1 ${
                  theme === "dark" ? "text-gray-400" : "text-gray-500"
                }`}>
                  Set a target date in Step 2 to enable subtask scheduling
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddSubtask}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingIndex !== null ? "Update Subtask" : "Add Subtask"}
              </button>
              <button
                onClick={() => {
                  setIsAddingSubtask(false);
                  setEditingIndex(null);
                  setCurrentSubtask({
                    title: "",
                    description: "",
                    dueDate: "",
                  });
                  setDateError("");
                }}
                className={`px-4 py-2 rounded-lg ${
                  theme === "dark"
                    ? "bg-gray-700 text-white hover:bg-gray-600"
                    : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Timeline Preview */}
      {formData.subtasks.length > 0 && (
        <div
          className={`p-4 rounded-lg border ${
            theme === "dark"
              ? "bg-gray-800 border-gray-700"
              : "bg-green-50 border-green-200"
          }`}
        >
          <h3
            className={`font-medium mb-3 ${
              theme === "dark" ? "text-white" : "text-green-900"
            }`}
          >
            📅 Timeline Preview
          </h3>
          <div className="space-y-2">
            {calculateSubtaskDates().map((subtask, index) => (
              <div
                key={index}
                className={`flex justify-between items-center text-sm ${
                  theme === "dark" ? "text-gray-300" : "text-green-800"
                }`}
              >
                <span>
                  Step {index + 1}: {subtask.title}
                </span>
                <span className="text-xs">
                  {new Date(subtask.startDate!).toLocaleDateString()} -{" "}
                  {new Date(subtask.dueDate).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            to="/dashboard"
            className={`text-gray-600 hover:text-gray-800 ${
              theme === "dark" ? "text-gray-400 hover:text-white" : ""
            }`}
          >
            ← Back
          </Link>
          <h1
            className={`text-2xl font-bold ${
              theme === "dark" ? "text-white" : "text-gray-800"
            }`}
          >
            Create New Goal
          </h1>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= step
                    ? "bg-blue-600 text-white"
                    : theme === "dark"
                      ? "bg-gray-700 text-gray-400"
                      : "bg-gray-200 text-gray-600"
                }`}
              >
                {step}
              </div>
              {step < 3 && (
                <div
                  className={`w-16 h-1 mx-2 ${
                    currentStep > step
                      ? "bg-blue-600"
                      : theme === "dark"
                        ? "bg-gray-700"
                        : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs">
          <span
            className={theme === "dark" ? "text-gray-400" : "text-gray-600"}
          >
            Info
          </span>
          <span
            className={theme === "dark" ? "text-gray-400" : "text-gray-600"}
          >
            Timeline
          </span>
          <span
            className={theme === "dark" ? "text-gray-400" : "text-gray-600"}
          >
            Subtasks
          </span>
        </div>
      </div>

      {/* Error Message */}
      {(error || dateError) && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error || dateError}
        </div>
      )}

      {/* Form Content */}
      <div
        className={`p-6 rounded-lg border ${
          theme === "dark"
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-gray-200"
        }`}
      >
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-6">
        <button
          onClick={handleBack}
          disabled={currentStep === 1}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            currentStep === 1
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : theme === "dark"
                ? "bg-gray-700 text-white hover:bg-gray-600"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
          }`}
        >
          Back
        </button>

        {currentStep < 3 ? (
          <button
            onClick={handleNext}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
          >
            Create Goal
          </button>
        )}
      </div>
    </div>
  );
}
