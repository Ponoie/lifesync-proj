import { authService } from "./authService";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

export interface UserWithStats {
  id: string;
  username: string;
  email: string;
  role: string;
  totalCoins: number;
  avatar: string;
  joinedAt: Date;
  lastLoginAt?: Date;
  stats: {
    totalGoals: number;
    completedGoals: number;
    totalHabits: number;
    completedHabitsToday: number;
  };
}

export interface UserDetail {
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
    totalCoins: number;
    avatar: string;
    joinedAt: Date;
    lastLoginAt?: Date;
  };
  goals: Array<{
    id: string;
    title: string;
    description: string;
    progress: number;
    completed: boolean;
    createdAt: Date;
  }>;
  habits: Array<{
    id: string;
    name: string;
    frequency: string;
    streak: number;
    completedToday: boolean;
  }>;
}

export interface PlatformStats {
  totalUsers: number;
  totalGoals: number;
  totalHabits: number;
  completedGoals: number;
  totalCoins: number;
  avgGoalsPerUser: number;
  avgHabitsPerUser: number;
}

class AdminService {
  private getHeaders() {
    return {
      "Content-Type": "application/json",
      ...authService.getAuthHeader(),
    };
  }

  async getAllUsers(): Promise<UserWithStats[]> {
    const response = await fetch(`${API_BASE}/api/admin/users`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch users");
    }

    const result = await response.json();
    return result.data;
  }

  async getUserById(userId: string): Promise<UserDetail> {
    const response = await fetch(`${API_BASE}/api/admin/users/${userId}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch user details");
    }

    const result = await response.json();
    return result.data;
  }

  async updateUserCoins(
    userId: string,
    amount: number,
    reason?: string,
  ): Promise<void> {
    const response = await fetch(
      `${API_BASE}/api/admin/users/${userId}/coins`,
      {
        method: "PUT",
        headers: this.getHeaders(),
        body: JSON.stringify({ amount, reason }),
      },
    );

    if (!response.ok) {
      throw new Error("Failed to update user coins");
    }
  }

  async deleteUser(userId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/api/admin/users/${userId}`, {
      method: "DELETE",
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to delete user");
    }
  }

  async getPlatformStats(): Promise<PlatformStats> {
    const response = await fetch(`${API_BASE}/api/admin/stats`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch platform stats");
    }

    const result = await response.json();
    return result.data;
  }
}

export const adminService = new AdminService();
