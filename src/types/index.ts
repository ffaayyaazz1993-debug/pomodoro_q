// ===== ENUMS =====
export enum TimerState {
  IDLE = 'IDLE',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
}

export enum TimerMode {
  FOCUS = 'FOCUS',
  SHORT_BREAK = 'SHORT_BREAK',
  LONG_BREAK = 'LONG_BREAK',
  CUSTOM = 'CUSTOM',
}

export enum TaskStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  ARCHIVED = 'ARCHIVED',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum ProjectStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED',
}

export enum SessionStatus {
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  SKIPPED = 'SKIPPED',
  INTERRUPTED = 'INTERRUPTED',
  ABANDONED = 'ABANDONED',
}

export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system',
}

export enum View {
  DASHBOARD = 'dashboard',
  TIMER = 'timer',
  TASKS = 'tasks',
  PROJECTS = 'projects',
  CALENDAR = 'calendar',
  STATISTICS = 'statistics',
  HISTORY = 'history',
  GOALS = 'goals',
  SETTINGS = 'settings',
}

// ===== MODELS =====
export interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  estimatedPomodoros: number;
  completedPomodoros: number;
  dueDate: string | null;
  createdAt: string;
  completedAt: string | null;
  tags: string[];
  notes: string;
  archived: boolean;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  status: ProjectStatus;
  createdAt: string;
  goalPomodoros: number;
}

export interface Session {
  id: string;
  mode: TimerMode;
  status: SessionStatus;
  startTime: string;
  endTime: string | null;
  plannedDuration: number; // seconds
  actualDuration: number; // seconds
  pausedDuration: number; // seconds
  taskId: string | null;
  projectId: string | null;
  interruptions: number;
  notes: string;
  cycleNumber: number;
}

export interface Goal {
  id: string;
  type: 'daily_pomodoros' | 'daily_focus_minutes' | 'daily_tasks' | 'weekly_pomodoros' | 'weekly_focus_minutes';
  targetValue: number;
  enabled: boolean;
  createdAt: string;
}

export interface TimerSettings {
  focusDuration: number; // minutes
  shortBreakDuration: number;
  longBreakDuration: number;
  longBreakInterval: number; // pomodoros until long break
  autoStartShortBreak: boolean;
  autoStartLongBreak: boolean;
  autoStartFocus: boolean;
  warningEnabled: boolean;
  warningMinutes: number;
  soundEnabled: boolean;
  soundVolume: number;
  notificationsEnabled: boolean;
  theme: Theme;
  alwaysOnTop: boolean;
  minimizeToTray: boolean;
  confirmClose: boolean;
  countSkippedAsCompleted: boolean;
}

export interface AppState {
  currentView: View;
  focusMode: boolean;
  sidebarCollapsed: boolean;
  onboardingCompleted: boolean;
}

export interface TimerData {
  state: TimerState;
  mode: TimerMode;
  remainingSeconds: number;
  totalSeconds: number;
  startTimestamp: number | null; // monotonic
  wallClockStart: string | null;
  pausedDuration: number;
  pauseStartTimestamp: number | null;
  sessionId: string | null;
  cycleNumber: number;
  pomodorosCompleted: number;
  taskId: string | null;
  projectId: string | null;
  interruptions: number;
}

export interface DailyStats {
  date: string;
  pomodoros: number;
  focusMinutes: number;
  breaks: number;
  completedTasks: number;
  skippedSessions: number;
}

export interface AppData {
  tasks: Task[];
  projects: Project[];
  sessions: Session[];
  goals: Goal[];
  settings: TimerSettings;
  appState: AppState;
  timerData: TimerData;
}
