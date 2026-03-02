export interface Subtask {
  title: string;
  description?: string;
  startDate?: string;
  dueDate: string;
  completed: boolean;
  completedAt?: string;
}

export interface Goal {
  _id?: string;
  id?: string;
  title: string;
  description: string;
  targetDate?: string;
  completed: boolean;
  progress: number;
  completedAt?: string;
  milestones?: Array<{
    title: string;
    completed: boolean;
    completedAt?: string;
  }>;
  subtasks?: Subtask[];
}
