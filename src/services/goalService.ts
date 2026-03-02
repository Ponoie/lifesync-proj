import type { Goal } from "../types/goal";
import { authService } from "./authService";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export interface CreateGoalData {
  title: string;
  description: string;
  targetDate?: string;
  milestones?: Array<{ title: string; completed: boolean }>;
  subtasks?: Array<{
    title: string;
    description?: string;
    startDate?: string;
    dueDate: string;
    completed: boolean;
  }>;
}

export interface UpdateGoalData extends Partial<CreateGoalData> {
  progress?: number;
}

class GoalService {
  private getHeaders() {
    return {
      "Content-Type": "application/json",
      ...authService.getAuthHeader(),
    };
  }

  async getAllGoals(): Promise<Goal[]> {
    console.log(
      "[goalService] Fetching all goals from",
      `${API_BASE_URL}/goals`,
    );
    const response = await fetch(`${API_BASE_URL}/goals`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      console.error("[goalService] Failed to fetch goals:", response.status);
      throw new Error("Failed to fetch goals");
    }

    const result = await response.json();
    console.log("[goalService] Fetched", result.count, "goals");
    return result.data;
  }

  async getGoalById(id: string): Promise<Goal> {
    console.log("[goalService] Fetching goal by id:", id);
    const response = await fetch(`${API_BASE_URL}/goals/${id}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      console.error("[goalService] Failed to fetch goal:", response.status);
      throw new Error("Failed to fetch goal");
    }

    const result = await response.json();
    return result.data;
  }

  async createGoal(data: CreateGoalData): Promise<Goal> {
    console.log("[goalService] Creating goal:", data.title);
    console.log("[goalService] Goal data:", data);
    const response = await fetch(`${API_BASE_URL}/goals`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("[goalService] Failed to create goal:", error);
      throw new Error(error.message || "Failed to create goal");
    }

    const result = await response.json();
    console.log("[goalService] Goal created successfully:", result.data._id);
    return result.data;
  }

  async updateGoal(id: string, data: UpdateGoalData): Promise<Goal> {
    const response = await fetch(`${API_BASE_URL}/goals/${id}`, {
      method: "PUT",
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update goal");
    }

    const result = await response.json();
    return result.data;
  }

  async deleteGoal(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/goals/${id}`, {
      method: "DELETE",
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to delete goal");
    }
  }

  async completeGoal(id: string): Promise<{ goal: Goal; coinsEarned: number }> {
    const response = await fetch(`${API_BASE_URL}/goals/${id}/complete`, {
      method: "POST",
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to complete goal");
    }

    const result = await response.json();
    return result.data;
  }
}

export const goalService = new GoalService();
