import type { UserRole } from "../types/auth";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  username: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    token: string;
    user: {
      id: string;
      email: string;
      username: string;
      role: UserRole;
      totalCoins: number;
      avatar: string;
    };
  };
}

export interface User {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  totalCoins: number;
  avatar: string;
  joinedAt?: Date;
  lastLoginAt?: Date;
}

class AuthService {
  private tokenKey = "lifesync_token";
  private userKey = "lifesync_user";

  // Get stored token
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  // Set token
  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  // Remove token
  removeToken(): void {
    localStorage.removeItem(this.tokenKey);
  }

  // Get stored user
  getUser(): User | null {
    const userStr = localStorage.getItem(this.userKey);
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  }

  // Set user
  setUser(user: User): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  // Remove user
  removeUser(): void {
    localStorage.removeItem(this.userKey);
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // Check if user is admin
  isAdmin(): boolean {
    const user = this.getUser();
    return user?.role === "admin";
  }

  // Login
  async login(credentials: LoginCredentials): Promise<User> {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    const data: AuthResponse = await response.json();

    if (!data.success || !data.data) {
      throw new Error(data.message || "Login failed");
    }

    // Store token and user
    this.setToken(data.data.token);
    this.setUser(data.data.user);

    return data.data.user;
  }

  // Register
  async register(credentials: RegisterCredentials): Promise<User> {
    const response = await fetch(`${API_BASE}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    const data: AuthResponse = await response.json();

    if (!data.success || !data.data) {
      throw new Error(data.message || "Registration failed");
    }

    // Store token and user
    this.setToken(data.data.token);
    this.setUser(data.data.user);

    return data.data.user;
  }

  // Get current user
  async getCurrentUser(): Promise<User> {
    const token = this.getToken();
    if (!token) {
      throw new Error("Not authenticated");
    }

    const response = await fetch(`${API_BASE}/api/auth/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!data.success || !data.data) {
      throw new Error(data.message || "Failed to get user");
    }

    // Update stored user
    this.setUser(data.data);

    return data.data;
  }

  // Logout
  logout(): void {
    this.removeToken();
    this.removeUser();
  }

  // Get authorization header
  getAuthHeader(): { Authorization: string } | {} {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}

export const authService = new AuthService();
