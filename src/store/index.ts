import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  TimerState, TimerMode, TaskStatus, TaskPriority, ProjectStatus,
  SessionStatus, Theme, View, Task, Project, Session, Goal,
  TimerSettings, AppState, TimerData, DailyStats
} from '../types';
import { getTodayKey, getDaysAgo, getStreakDays } from '../utils/time';
import { saveToStorage, loadFromStorage } from '../utils/storage';
import { playCompletionSound, playBreakCompleteSound, playWarningSound } from '../utils/sounds';

// ===== DEFAULT VALUES =====
const DEFAULT_SETTINGS: TimerSettings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
  autoStartShortBreak: false,
  autoStartLongBreak: false,
  autoStartFocus: false,
  warningEnabled: true,
  warningMinutes: 1,
  soundEnabled: true,
  soundVolume: 0.5,
  notificationsEnabled: true,
  theme: Theme.SYSTEM,
  alwaysOnTop: false,
  minimizeToTray: true,
  confirmClose: true,
  countSkippedAsCompleted: false,
};

const DEFAULT_APP_STATE: AppState = {
  currentView: View.DASHBOARD,
  focusMode: false,
  sidebarCollapsed: false,
  onboardingCompleted: false,
};

const DEFAULT_TIMER_DATA: TimerData = {
  state: TimerState.IDLE,
  mode: TimerMode.FOCUS,
  remainingSeconds: 25 * 60,
  totalSeconds: 25 * 60,
  startTimestamp: null,
  wallClockStart: null,
  pausedDuration: 0,
  pauseStartTimestamp: null,
  sessionId: null,
  cycleNumber: 1,
  pomodorosCompleted: 0,
  taskId: null,
  projectId: null,
  interruptions: 0,
};

// ===== NOTIFICATION HELPER =====
function sendNotification(title: string, body: string): void {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/favicon.ico' });
  }
}

// ===== STORE INTERFACE =====
interface PomodoroStore {
  // Data
  tasks: Task[];
  projects: Project[];
  sessions: Session[];
  goals: Goal[];
  settings: TimerSettings;
  appState: AppState;
  timerData: TimerData;
  
  // Timer actions
  startTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
  skipTimer: () => void;
  tick: () => void;
  setTimerMode: (mode: TimerMode) => void;
  selectTask: (taskId: string | null) => void;
  selectProject: (projectId: string | null) => void;
  
  // Task actions
  addTask: (task: Partial<Task>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  completeTask: (id: string) => void;
  reopenTask: (id: string) => void;
  archiveTask: (id: string) => void;
  
  // Project actions
  addProject: (project: Partial<Project>) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  
  // Session actions
  addManualSession: (session: Partial<Session>) => void;
  deleteSession: (id: string) => void;
  
  // Goal actions
  addGoal: (goal: Partial<Goal>) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  
  // Settings actions
  updateSettings: (updates: Partial<TimerSettings>) => void;
  setView: (view: View) => void;
  toggleFocusMode: () => void;
  toggleSidebar: () => void;
  completeOnboarding: () => void;
  
  // Data management
  importData: (data: string) => boolean;
  exportData: () => string;
  resetAllData: () => void;
  
  // Computed
  getTodaySessions: () => Session[];
  getTodayPomodoros: () => number;
  getTodayFocusMinutes: () => number;
  getTodayCompletedTasks: () => number;
  getStreak: () => number;
  getDailyStats: (days: number) => DailyStats[];
  getWeeklyStats: () => { totalFocusMinutes: number; totalPomodoros: number; avgDailyFocus: number; activeDays: number };
  getAllTimeStats: () => { totalPomodoros: number; totalFocusHours: number; longestStreak: number; completedTasks: number; projectsCompleted: number };
  getProjectStats: (projectId: string) => { pomodoros: number; focusMinutes: number; tasks: number; completion: number };
  
  // Persistence
  persistState: () => void;
  loadState: () => void;
}

export const useStore = create<PomodoroStore>((set, get) => ({
  // Initial data
  tasks: [],
  projects: [],
  sessions: [],
  goals: [],
  settings: { ...DEFAULT_SETTINGS },
  appState: { ...DEFAULT_APP_STATE },
  timerData: { ...DEFAULT_TIMER_DATA },

  // ===== TIMER ACTIONS =====
  startTimer: () => {
    const { settings, timerData } = get();
    const mode = timerData.mode;
    let duration: number;
    
    switch (mode) {
      case TimerMode.FOCUS:
        duration = settings.focusDuration * 60;
        break;
      case TimerMode.SHORT_BREAK:
        duration = settings.shortBreakDuration * 60;
        break;
      case TimerMode.LONG_BREAK:
        duration = settings.longBreakDuration * 60;
        break;
      default:
        duration = timerData.totalSeconds;
    }
    
    const sessionId = uuidv4();
    const now = Date.now();
    
    set({
      timerData: {
        ...timerData,
        state: TimerState.RUNNING,
        remainingSeconds: duration,
        totalSeconds: duration,
        startTimestamp: now,
        wallClockStart: new Date().toISOString(),
        pausedDuration: 0,
        pauseStartTimestamp: null,
        sessionId,
        interruptions: 0,
      }
    });
    get().persistState();
  },

  pauseTimer: () => {
    const { timerData } = get();
    if (timerData.state !== TimerState.RUNNING) return;
    
    set({
      timerData: {
        ...timerData,
        state: TimerState.PAUSED,
        pauseStartTimestamp: Date.now(),
        interruptions: timerData.interruptions + 1,
      }
    });
    get().persistState();
  },

  resumeTimer: () => {
    const { timerData } = get();
    if (timerData.state !== TimerState.PAUSED) return;
    
    const pausedDuration = timerData.pauseStartTimestamp
      ? Date.now() - timerData.pauseStartTimestamp
      : 0;
    
    set({
      timerData: {
        ...timerData,
        state: TimerState.RUNNING,
        pausedDuration: timerData.pausedDuration + pausedDuration,
        pauseStartTimestamp: null,
        startTimestamp: timerData.startTimestamp! + pausedDuration,
      }
    });
    get().persistState();
  },

  stopTimer: () => {
    const { timerData, sessions } = get();
    
    // Record the session as abandoned
    if (timerData.sessionId && timerData.startTimestamp) {
      const elapsed = timerData.totalSeconds - timerData.remainingSeconds;
      const session: Session = {
        id: timerData.sessionId,
        mode: timerData.mode,
        status: SessionStatus.ABANDONED,
        startTime: timerData.wallClockStart!,
        endTime: new Date().toISOString(),
        plannedDuration: timerData.totalSeconds,
        actualDuration: elapsed,
        pausedDuration: timerData.pausedDuration,
        taskId: timerData.taskId,
        projectId: timerData.projectId,
        interruptions: timerData.interruptions,
        notes: '',
        cycleNumber: timerData.cycleNumber,
      };
      set({ sessions: [...sessions, session] });
    }
    
    set({
      timerData: {
        ...timerData,
        state: TimerState.IDLE,
        remainingSeconds: timerData.totalSeconds,
        startTimestamp: null,
        wallClockStart: null,
        pausedDuration: 0,
        pauseStartTimestamp: null,
        sessionId: null,
      }
    });
    get().persistState();
  },

  resetTimer: () => {
    const { settings, timerData } = get();
    let duration: number;
    
    switch (timerData.mode) {
      case TimerMode.FOCUS:
        duration = settings.focusDuration * 60;
        break;
      case TimerMode.SHORT_BREAK:
        duration = settings.shortBreakDuration * 60;
        break;
      case TimerMode.LONG_BREAK:
        duration = settings.longBreakDuration * 60;
        break;
      default:
        duration = timerData.totalSeconds;
    }
    
    set({
      timerData: {
        ...timerData,
        state: TimerState.IDLE,
        remainingSeconds: duration,
        totalSeconds: duration,
        startTimestamp: null,
        wallClockStart: null,
        pausedDuration: 0,
        pauseStartTimestamp: null,
        sessionId: null,
        interruptions: 0,
      }
    });
    get().persistState();
  },

  skipTimer: () => {
    const { timerData, settings, sessions } = get();
    
    // Record skipped session
    if (timerData.sessionId && timerData.startTimestamp) {
      const elapsed = timerData.totalSeconds - timerData.remainingSeconds;
      const session: Session = {
        id: timerData.sessionId,
        mode: timerData.mode,
        status: SessionStatus.SKIPPED,
        startTime: timerData.wallClockStart!,
        endTime: new Date().toISOString(),
        plannedDuration: timerData.totalSeconds,
        actualDuration: elapsed,
        pausedDuration: timerData.pausedDuration,
        taskId: timerData.taskId,
        projectId: timerData.projectId,
        interruptions: timerData.interruptions,
        notes: '',
        cycleNumber: timerData.cycleNumber,
      };
      set({ sessions: [...sessions, session] });
    }
    
    // Move to next phase
    let nextMode: TimerMode;
    let newCycle = timerData.cycleNumber;
    let newPomodoros = timerData.pomodorosCompleted;
    
    if (timerData.mode === TimerMode.FOCUS) {
      newPomodoros += 1;
      if (newPomodoros % settings.longBreakInterval === 0) {
        nextMode = TimerMode.LONG_BREAK;
      } else {
        nextMode = TimerMode.SHORT_BREAK;
      }
    } else {
      nextMode = TimerMode.FOCUS;
      if (timerData.mode === TimerMode.LONG_BREAK) {
        newCycle += 1;
        newPomodoros = 0;
      }
    }
    
    let duration: number;
    switch (nextMode) {
      case TimerMode.FOCUS: duration = settings.focusDuration * 60; break;
      case TimerMode.SHORT_BREAK: duration = settings.shortBreakDuration * 60; break;
      case TimerMode.LONG_BREAK: duration = settings.longBreakDuration * 60; break;
      default: duration = settings.focusDuration * 60;
    }
    
    set({
      timerData: {
        ...timerData,
        state: TimerState.IDLE,
        mode: nextMode,
        remainingSeconds: duration,
        totalSeconds: duration,
        startTimestamp: null,
        wallClockStart: null,
        pausedDuration: 0,
        pauseStartTimestamp: null,
        sessionId: null,
        cycleNumber: newCycle,
        pomodorosCompleted: newPomodoros,
        interruptions: 0,
      }
    });
    get().persistState();
  },

  tick: () => {
    const { timerData, settings, sessions, goals, tasks } = get();
    if (timerData.state !== TimerState.RUNNING || !timerData.startTimestamp) return;
    
    const now = Date.now();
    const elapsed = Math.floor((now - timerData.startTimestamp) / 1000);
    const remaining = Math.max(0, timerData.totalSeconds - elapsed);
    
    // Check for warning
    if (settings.warningEnabled && settings.soundEnabled) {
      const warningSeconds = settings.warningMinutes * 60;
      const prevRemaining = timerData.remainingSeconds;
      if (prevRemaining > warningSeconds && remaining <= warningSeconds) {
        playWarningSound(settings.soundVolume);
      }
    }
    
    if (remaining <= 0) {
      // Timer completed
      const session: Session = {
        id: timerData.sessionId || uuidv4(),
        mode: timerData.mode,
        status: SessionStatus.COMPLETED,
        startTime: timerData.wallClockStart!,
        endTime: new Date().toISOString(),
        plannedDuration: timerData.totalSeconds,
        actualDuration: timerData.totalSeconds,
        pausedDuration: timerData.pausedDuration,
        taskId: timerData.taskId,
        projectId: timerData.projectId,
        interruptions: timerData.interruptions,
        notes: '',
        cycleNumber: timerData.cycleNumber,
      };
      
      const newSessions = [...sessions, session];
      
      // Update task pomodoro count
      let newTasks = [...tasks];
      if (timerData.mode === TimerMode.FOCUS && timerData.taskId) {
        newTasks = tasks.map(t => 
          t.id === timerData.taskId 
            ? { ...t, completedPomodoros: t.completedPomodoros + 1, status: TaskStatus.IN_PROGRESS }
            : t
        );
      }
      
      // Play sound
      if (settings.soundEnabled) {
        if (timerData.mode === TimerMode.FOCUS) {
          playCompletionSound(settings.soundVolume);
        } else {
          playBreakCompleteSound(settings.soundVolume);
        }
      }
      
      // Send notification
      if (settings.notificationsEnabled) {
        if (timerData.mode === TimerMode.FOCUS) {
          sendNotification('Pomodoro Complete!', 'Time for a break. Great work!');
        } else {
          sendNotification('Break Complete!', 'Ready to focus again?');
        }
      }
      
      // Determine next mode
      let nextMode: TimerMode;
      let newCycle = timerData.cycleNumber;
      let newPomodoros = timerData.pomodorosCompleted;
      
      if (timerData.mode === TimerMode.FOCUS) {
        newPomodoros += 1;
        if (newPomodoros % settings.longBreakInterval === 0) {
          nextMode = TimerMode.LONG_BREAK;
        } else {
          nextMode = TimerMode.SHORT_BREAK;
        }
      } else {
        nextMode = TimerMode.FOCUS;
        if (timerData.mode === TimerMode.LONG_BREAK) {
          newCycle += 1;
          newPomodoros = 0;
        }
      }
      
      let duration: number;
      switch (nextMode) {
        case TimerMode.FOCUS: duration = settings.focusDuration * 60; break;
        case TimerMode.SHORT_BREAK: duration = settings.shortBreakDuration * 60; break;
        case TimerMode.LONG_BREAK: duration = settings.longBreakDuration * 60; break;
        default: duration = settings.focusDuration * 60;
      }
      
      // Check daily goals
      const todayKey = getTodayKey();
      const todaySessions = newSessions.filter(s => 
        s.startTime.startsWith(todayKey) && s.mode === TimerMode.FOCUS && s.status === SessionStatus.COMPLETED
      );
      
      goals.forEach(goal => {
        if (!goal.enabled) return;
        if (goal.type === 'daily_pomodoros' && todaySessions.length >= goal.targetValue) {
          if (settings.notificationsEnabled) {
            sendNotification('Daily Goal Achieved!', `You completed ${goal.targetValue} Pomodoros today!`);
          }
        }
      });
      
      // Auto-start logic
      let autoState = TimerState.IDLE;
      let autoStart = timerData.startTimestamp;
      let autoWallClock = new Date().toISOString();
      let autoSessionId: string | null = null;
      
      const shouldAutoStart = 
        (nextMode === TimerMode.SHORT_BREAK && settings.autoStartShortBreak) ||
        (nextMode === TimerMode.LONG_BREAK && settings.autoStartLongBreak) ||
        (nextMode === TimerMode.FOCUS && settings.autoStartFocus);
      
      if (shouldAutoStart) {
        autoState = TimerState.RUNNING;
        autoStart = Date.now();
        autoWallClock = new Date().toISOString();
        autoSessionId = uuidv4();
      }
      
      set({
        sessions: newSessions,
        tasks: newTasks,
        timerData: {
          ...timerData,
          state: autoState,
          mode: nextMode,
          remainingSeconds: duration,
          totalSeconds: duration,
          startTimestamp: autoStart,
          wallClockStart: autoWallClock,
          pausedDuration: 0,
          pauseStartTimestamp: null,
          sessionId: autoSessionId,
          cycleNumber: newCycle,
          pomodorosCompleted: newPomodoros,
          interruptions: 0,
        }
      });
    } else {
      set({
        timerData: {
          ...timerData,
          remainingSeconds: remaining,
        }
      });
    }
    get().persistState();
  },

  setTimerMode: (mode: TimerMode) => {
    const { settings, timerData } = get();
    if (timerData.state === TimerState.RUNNING) return;
    
    let duration: number;
    switch (mode) {
      case TimerMode.FOCUS: duration = settings.focusDuration * 60; break;
      case TimerMode.SHORT_BREAK: duration = settings.shortBreakDuration * 60; break;
      case TimerMode.LONG_BREAK: duration = settings.longBreakDuration * 60; break;
      default: duration = settings.focusDuration * 60;
    }
    
    set({
      timerData: {
        ...timerData,
        mode,
        remainingSeconds: duration,
        totalSeconds: duration,
        state: TimerState.IDLE,
        sessionId: null,
      }
    });
    get().persistState();
  },

  selectTask: (taskId: string | null) => {
    const { timerData } = get();
    set({
      timerData: { ...timerData, taskId }
    });
    get().persistState();
  },

  selectProject: (projectId: string | null) => {
    const { timerData } = get();
    set({
      timerData: { ...timerData, projectId }
    });
    get().persistState();
  },

  // ===== TASK ACTIONS =====
  addTask: (partial) => {
    const task: Task = {
      id: uuidv4(),
      title: partial.title || 'New Task',
      description: partial.description || '',
      projectId: partial.projectId || null,
      priority: partial.priority || TaskPriority.MEDIUM,
      status: TaskStatus.NOT_STARTED,
      estimatedPomodoros: partial.estimatedPomodoros || 1,
      completedPomodoros: 0,
      dueDate: partial.dueDate || null,
      createdAt: new Date().toISOString(),
      completedAt: null,
      tags: partial.tags || [],
      notes: partial.notes || '',
      archived: false,
    };
    set(state => ({ tasks: [...state.tasks, task] }));
    get().persistState();
  },

  updateTask: (id, updates) => {
    set(state => ({
      tasks: state.tasks.map(t => t.id === id ? { ...t, ...updates } : t)
    }));
    get().persistState();
  },

  deleteTask: (id) => {
    set(state => ({ tasks: state.tasks.filter(t => t.id !== id) }));
    get().persistState();
  },

  completeTask: (id) => {
    set(state => ({
      tasks: state.tasks.map(t => 
        t.id === id ? { ...t, status: TaskStatus.COMPLETED, completedAt: new Date().toISOString() } : t
      )
    }));
    get().persistState();
  },

  reopenTask: (id) => {
    set(state => ({
      tasks: state.tasks.map(t => 
        t.id === id ? { ...t, status: TaskStatus.NOT_STARTED, completedAt: null } : t
      )
    }));
    get().persistState();
  },

  archiveTask: (id) => {
    set(state => ({
      tasks: state.tasks.map(t => 
        t.id === id ? { ...t, archived: true, status: TaskStatus.ARCHIVED } : t
      )
    }));
    get().persistState();
  },

  // ===== PROJECT ACTIONS =====
  addProject: (partial) => {
    const project: Project = {
      id: uuidv4(),
      name: partial.name || 'New Project',
      description: partial.description || '',
      color: partial.color || '#6366f1',
      icon: partial.icon || '📁',
      status: ProjectStatus.ACTIVE,
      createdAt: new Date().toISOString(),
      goalPomodoros: partial.goalPomodoros || 0,
    };
    set(state => ({ projects: [...state.projects, project] }));
    get().persistState();
  },

  updateProject: (id, updates) => {
    set(state => ({
      projects: state.projects.map(p => p.id === id ? { ...p, ...updates } : p)
    }));
    get().persistState();
  },

  deleteProject: (id) => {
    set(state => ({
      projects: state.projects.filter(p => p.id !== id),
      tasks: state.tasks.map(t => t.projectId === id ? { ...t, projectId: null } : t),
    }));
    get().persistState();
  },

  // ===== SESSION ACTIONS =====
  addManualSession: (partial) => {
    const session: Session = {
      id: uuidv4(),
      mode: partial.mode || TimerMode.FOCUS,
      status: partial.status || SessionStatus.COMPLETED,
      startTime: partial.startTime || new Date().toISOString(),
      endTime: partial.endTime || new Date().toISOString(),
      plannedDuration: partial.plannedDuration || 25 * 60,
      actualDuration: partial.actualDuration || 25 * 60,
      pausedDuration: partial.pausedDuration || 0,
      taskId: partial.taskId || null,
      projectId: partial.projectId || null,
      interruptions: partial.interruptions || 0,
      notes: partial.notes || '',
      cycleNumber: partial.cycleNumber || 0,
    };
    set(state => ({ sessions: [...state.sessions, session] }));
    get().persistState();
  },

  deleteSession: (id) => {
    set(state => ({ sessions: state.sessions.filter(s => s.id !== id) }));
    get().persistState();
  },

  // ===== GOAL ACTIONS =====
  addGoal: (partial) => {
    const goal: Goal = {
      id: uuidv4(),
      type: partial.type || 'daily_pomodoros',
      targetValue: partial.targetValue || 8,
      enabled: partial.enabled !== undefined ? partial.enabled : true,
      createdAt: new Date().toISOString(),
    };
    set(state => ({ goals: [...state.goals, goal] }));
    get().persistState();
  },

  updateGoal: (id, updates) => {
    set(state => ({
      goals: state.goals.map(g => g.id === id ? { ...g, ...updates } : g)
    }));
    get().persistState();
  },

  deleteGoal: (id) => {
    set(state => ({ goals: state.goals.filter(g => g.id !== id) }));
    get().persistState();
  },

  // ===== SETTINGS ACTIONS =====
  updateSettings: (updates) => {
    set(state => ({ settings: { ...state.settings, ...updates } }));
    get().persistState();
  },

  setView: (view) => {
    set(state => ({ appState: { ...state.appState, currentView: view } }));
    get().persistState();
  },

  toggleFocusMode: () => {
    set(state => ({ appState: { ...state.appState, focusMode: !state.appState.focusMode } }));
  },

  toggleSidebar: () => {
    set(state => ({ appState: { ...state.appState, sidebarCollapsed: !state.appState.sidebarCollapsed } }));
  },

  completeOnboarding: () => {
    set(state => ({ appState: { ...state.appState, onboardingCompleted: true } }));
    get().persistState();
  },

  // ===== DATA MANAGEMENT =====
  importData: (dataStr) => {
    try {
      const data = JSON.parse(dataStr);
      if (data.tasks) set({ tasks: data.tasks });
      if (data.projects) set({ projects: data.projects });
      if (data.sessions) set({ sessions: data.sessions });
      if (data.goals) set({ goals: data.goals });
      if (data.settings) set({ settings: { ...DEFAULT_SETTINGS, ...data.settings } });
      get().persistState();
      return true;
    } catch (e) {
      console.error('Import failed:', e);
      return false;
    }
  },

  exportData: () => {
    const { tasks, projects, sessions, goals, settings } = get();
    return JSON.stringify({ tasks, projects, sessions, goals, settings }, null, 2);
  },

  resetAllData: () => {
    set({
      tasks: [],
      projects: [],
      sessions: [],
      goals: [],
      settings: { ...DEFAULT_SETTINGS },
      appState: { ...DEFAULT_APP_STATE },
      timerData: { ...DEFAULT_TIMER_DATA },
    });
    get().persistState();
  },

  // ===== COMPUTED =====
  getTodaySessions: () => {
    const { sessions } = get();
    const todayKey = getTodayKey();
    return sessions.filter(s => s.startTime.startsWith(todayKey));
  },

  getTodayPomodoros: () => {
    const todaySessions = get().getTodaySessions();
    return todaySessions.filter(s => s.mode === TimerMode.FOCUS && s.status === SessionStatus.COMPLETED).length;
  },

  getTodayFocusMinutes: () => {
    const todaySessions = get().getTodaySessions();
    return todaySessions
      .filter(s => s.mode === TimerMode.FOCUS && s.status === SessionStatus.COMPLETED)
      .reduce((sum, s) => sum + Math.floor(s.actualDuration / 60), 0);
  },

  getTodayCompletedTasks: () => {
    const { tasks } = get();
    const todayKey = getTodayKey();
    return tasks.filter(t => t.completedAt && t.completedAt.startsWith(todayKey)).length;
  },

  getStreak: () => {
    const { sessions } = get();
    const dates = [...new Set(
      sessions
        .filter(s => s.mode === TimerMode.FOCUS && s.status === SessionStatus.COMPLETED)
        .map(s => s.startTime.substring(0, 10))
    )];
    return getStreakDays(dates);
  },

  getDailyStats: (days) => {
    const { sessions } = get();
    const stats: DailyStats[] = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const dateKey = getDaysAgo(i);
      const daySessions = sessions.filter(s => s.startTime.startsWith(dateKey));
      
      stats.push({
        date: dateKey,
        pomodoros: daySessions.filter(s => s.mode === TimerMode.FOCUS && s.status === SessionStatus.COMPLETED).length,
        focusMinutes: daySessions
          .filter(s => s.mode === TimerMode.FOCUS && s.status === SessionStatus.COMPLETED)
          .reduce((sum, s) => sum + Math.floor(s.actualDuration / 60), 0),
        breaks: daySessions.filter(s => s.mode !== TimerMode.FOCUS && s.status === SessionStatus.COMPLETED).length,
        completedTasks: 0, // Would need task completion date tracking
        skippedSessions: daySessions.filter(s => s.status === SessionStatus.SKIPPED).length,
      });
    }
    return stats;
  },

  getWeeklyStats: () => {
    const dailyStats = get().getDailyStats(7);
    const totalFocusMinutes = dailyStats.reduce((sum, d) => sum + d.focusMinutes, 0);
    const totalPomodoros = dailyStats.reduce((sum, d) => sum + d.pomodoros, 0);
    const activeDays = dailyStats.filter(d => d.pomodoros > 0).length;
    const avgDailyFocus = activeDays > 0 ? Math.round(totalFocusMinutes / activeDays) : 0;
    
    return { totalFocusMinutes, totalPomodoros, avgDailyFocus, activeDays };
  },

  getAllTimeStats: () => {
    const { sessions, tasks, projects } = get();
    const completedFocus = sessions.filter(s => s.mode === TimerMode.FOCUS && s.status === SessionStatus.COMPLETED);
    const totalFocusHours = Math.round(completedFocus.reduce((sum, s) => sum + s.actualDuration, 0) / 3600 * 10) / 10;
    
    // Calculate longest streak
    const dates = [...new Set(completedFocus.map(s => s.startTime.substring(0, 10)))].sort();
    let longestStreak = 0;
    let currentStreak = 0;
    for (let i = 0; i < dates.length; i++) {
      if (i === 0) {
        currentStreak = 1;
      } else {
        const prev = new Date(dates[i - 1]);
        const curr = new Date(dates[i]);
        const diff = Math.round((curr.getTime() - prev.getTime()) / 86400000);
        currentStreak = diff === 1 ? currentStreak + 1 : 1;
      }
      longestStreak = Math.max(longestStreak, currentStreak);
    }
    
    return {
      totalPomodoros: completedFocus.length,
      totalFocusHours,
      longestStreak,
      completedTasks: tasks.filter(t => t.status === TaskStatus.COMPLETED).length,
      projectsCompleted: projects.filter(p => p.status === ProjectStatus.COMPLETED).length,
    };
  },

  getProjectStats: (projectId) => {
    const { sessions, tasks } = get();
    const projectSessions = sessions.filter(s => s.projectId === projectId && s.status === SessionStatus.COMPLETED);
    const projectTasks = tasks.filter(t => t.projectId === projectId);
    const completedTasks = projectTasks.filter(t => t.status === TaskStatus.COMPLETED).length;
    
    return {
      pomodoros: projectSessions.filter(s => s.mode === TimerMode.FOCUS).length,
      focusMinutes: Math.floor(projectSessions.filter(s => s.mode === TimerMode.FOCUS).reduce((sum, s) => sum + s.actualDuration, 0) / 60),
      tasks: projectTasks.length,
      completion: projectTasks.length > 0 ? Math.round((completedTasks / projectTasks.length) * 100) : 0,
    };
  },

  // ===== PERSISTENCE =====
  persistState: () => {
    const { tasks, projects, sessions, goals, settings, appState, timerData } = get();
    saveToStorage('tasks', tasks);
    saveToStorage('projects', projects);
    saveToStorage('sessions', sessions);
    saveToStorage('goals', goals);
    saveToStorage('settings', settings);
    saveToStorage('appState', appState);
    saveToStorage('timerData', timerData);
  },

  loadState: () => {
    const tasks = loadFromStorage<Task[]>('tasks', []);
    const projects = loadFromStorage<Project[]>('projects', []);
    const sessions = loadFromStorage<Session[]>('sessions', []);
    const goals = loadFromStorage<Goal[]>('goals', []);
    const settings = loadFromStorage<TimerSettings>('settings', DEFAULT_SETTINGS);
    const appState = loadFromStorage<AppState>('appState', DEFAULT_APP_STATE);
    const timerData = loadFromStorage<TimerData>('timerData', DEFAULT_TIMER_DATA);
    
    set({ tasks, projects, sessions, goals, settings, appState, timerData });
  },
}));
