import React, { useEffect } from 'react';
import { View, TimerState, TimerMode } from './types';
import { useStore } from './store';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { TimerView } from './components/TimerView';
import { TasksView } from './components/TasksView';
import { ProjectsView } from './components/ProjectsView';
import { StatisticsView } from './components/StatisticsView';
import { HistoryView } from './components/HistoryView';
import { GoalsView } from './components/GoalsView';
import { SettingsView } from './components/SettingsView';
import { CalendarView } from './components/CalendarView';
import { Onboarding } from './components/Onboarding';

function App() {
  const { appState, timerData, loadState, startTimer, pauseTimer, resumeTimer, resetTimer, skipTimer, setView } = useStore();

  // Load persisted state on mount
  useEffect(() => {
    loadState();
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
      
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          if (timerData.state === TimerState.IDLE) startTimer();
          else if (timerData.state === TimerState.RUNNING) pauseTimer();
          else if (timerData.state === TimerState.PAUSED) resumeTimer();
          break;
        case 'KeyR':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            resetTimer();
          }
          break;
        case 'KeyS':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            skipTimer();
          }
          break;
        case 'KeyN':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            setView(View.TASKS);
          }
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [timerData.state, startTimer, pauseTimer, resumeTimer, resetTimer, skipTimer, setView]);

  // Update document title with timer
  useEffect(() => {
    if (timerData.state === TimerState.RUNNING || timerData.state === TimerState.PAUSED) {
      const mins = Math.floor(timerData.remainingSeconds / 60);
      const secs = timerData.remainingSeconds % 60;
      const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      const modeStr = timerData.mode === TimerMode.FOCUS ? '🍅' : '☕';
      document.title = `${timeStr} ${modeStr} FocusFlow`;
    } else {
      document.title = 'FocusFlow — Pomodoro Timer';
    }
  }, [timerData.remainingSeconds, timerData.state, timerData.mode]);

  // Show onboarding for first-time users
  if (!appState.onboardingCompleted) {
    return <Onboarding />;
  }

  const renderView = () => {
    switch (appState.currentView) {
      case View.DASHBOARD: return <Dashboard />;
      case View.TIMER: return <TimerView />;
      case View.TASKS: return <TasksView />;
      case View.PROJECTS: return <ProjectsView />;
      case View.CALENDAR: return <CalendarView />;
      case View.STATISTICS: return <StatisticsView />;
      case View.HISTORY: return <HistoryView />;
      case View.GOALS: return <GoalsView />;
      case View.SETTINGS: return <SettingsView />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout>
      {renderView()}
    </Layout>
  );
}

export default App;
