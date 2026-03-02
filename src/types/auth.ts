export type UserRole = "guest" | "user" | "premium" | "admin";

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  totalCoins: number;
  avatar?: string;
  joinedAt?: Date;
  lastLoginAt?: Date;
}
