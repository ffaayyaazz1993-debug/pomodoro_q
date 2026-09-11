import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Square, SkipForward, RotateCcw, Maximize2 } from 'lucide-react';
import { TimerState, TimerMode } from '../types';
import { useStore } from '../store';
import { formatTime, getProgressPercentage } from '../utils/time';

export function TimerView() {
  const { timerData, startTimer, pauseTimer, resumeTimer, stopTimer, resetTimer, skipTimer, tick, setTimerMode, tasks, projects, selectTask } = useStore();
  const intervalRef = useRef<number | null>(null);
  const [showTaskPicker, setShowTaskPicker] = useState(false);

  // Timer tick
  useEffect(() => {
    if (timerData.state === TimerState.RUNNING) {
      intervalRef.current = window.setInterval(() => {
        tick();
      }, 200); // Update every 200ms for smooth display
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerData.state, tick]);

  const progress = getProgressPercentage(
    timerData.totalSeconds - timerData.remainingSeconds,
    timerData.totalSeconds
  );

  const currentTask = tasks.find(t => t.id === timerData.taskId);
  const currentProject = projects.find(p => p.id === timerData.projectId);

  const modeColors = {
    [TimerMode.FOCUS]: { ring: '#6366f1', bg: 'from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30', text: 'text-indigo-600 dark:text-indigo-400', label: 'Focus' },
    [TimerMode.SHORT_BREAK]: { ring: '#10b981', bg: 'from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30', text: 'text-emerald-600 dark:text-emerald-400', label: 'Short Break' },
    [TimerMode.LONG_BREAK]: { ring: '#06b6d4', bg: 'from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30', text: 'text-cyan-600 dark:text-cyan-400', label: 'Long Break' },
    [TimerMode.CUSTOM]: { ring: '#f59e0b', bg: 'from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30', text: 'text-amber-600 dark:text-amber-400', label: 'Custom' },
  };

  const modeConfig = modeColors[timerData.mode];
  const circumference = 2 * Math.PI * 140;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const breakSuggestions = [
    '💧 Drink some water',
    '🧘 Stretch your body',
    '👀 Rest your eyes',
    '🚶 Take a short walk',
    '🌿 Look outside',
  ];
  const suggestion = breakSuggestions[Math.floor(timerData.cycleNumber % breakSuggestions.length)];

  return (
    <div className={`min-h-full bg-gradient-to-br ${modeConfig.bg} p-4 md:p-8 flex flex-col items-center justify-center`}>
      {/* Mode selector */}
      <div className="flex items-center gap-2 mb-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-1.5 shadow-sm">
        {([TimerMode.FOCUS, TimerMode.SHORT_BREAK, TimerMode.LONG_BREAK] as TimerMode[]).map(mode => (
          <button
            key={mode}
            onClick={() => setTimerMode(mode)}
            disabled={timerData.state === TimerState.RUNNING}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              timerData.mode === mode
                ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            } disabled:opacity-50`}
          >
            {modeColors[mode].label}
          </button>
        ))}
      </div>

      {/* Timer circle */}
      <div className="relative w-72 h-72 md:w-80 md:h-80 mb-8">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 300 300">
          {/* Background circle */}
          <circle
            cx="150" cy="150" r="140"
            fill="none"
            stroke="currentColor"
            className="text-gray-200 dark:text-gray-700"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            cx="150" cy="150" r="140"
            fill="none"
            stroke={modeConfig.ring}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-300"
          />
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-sm font-medium ${modeConfig.text} mb-1`}>
            {modeConfig.label}
          </span>
          <span className="text-5xl md:text-6xl font-mono font-bold text-gray-900 dark:text-white tabular-nums">
            {formatTime(timerData.remainingSeconds)}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Cycle {timerData.cycleNumber} • #{timerData.pomodorosCompleted + 1}
          </span>
        </div>
      </div>

      {/* Current task */}
      <div className="mb-6 text-center">
        {currentTask ? (
          <div className="flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg px-4 py-2 shadow-sm">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              Working on: <strong>{currentTask.title}</strong>
            </span>
            {currentProject && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                {currentProject.icon} {currentProject.name}
              </span>
            )}
          </div>
        ) : (
          <button
            onClick={() => setShowTaskPicker(!showTaskPicker)}
            className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            + Select a task to work on
          </button>
        )}
      </div>

      {/* Task picker */}
      {showTaskPicker && (
        <div className="mb-6 w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 max-h-60 overflow-y-auto">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Select Task</h3>
          {tasks.filter(t => t.status !== 'COMPLETED' && t.status !== 'ARCHIVED' && t.status !== 'CANCELLED').length === 0 ? (
            <p className="text-sm text-gray-400">No active tasks. Create one in the Tasks view.</p>
          ) : (
            <div className="space-y-1">
              <button
                onClick={() => { selectTask(null); setShowTaskPicker(false); }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
              >
                No task
              </button>
              {tasks.filter(t => t.status !== 'COMPLETED' && t.status !== 'ARCHIVED' && t.status !== 'CANCELLED').map(task => (
                <button
                  key={task.id}
                  onClick={() => { selectTask(task.id); setShowTaskPicker(false); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    timerData.taskId === task.id 
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{task.title}</span>
                    <span className="text-xs text-gray-400">{task.completedPomodoros}/{task.estimatedPomodoros}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-4">
        <button
          onClick={resetTimer}
          disabled={timerData.state === TimerState.IDLE}
          className="p-3 rounded-full bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors disabled:opacity-40"
          title="Reset"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        <button
          onClick={() => {
            if (timerData.state === TimerState.IDLE) startTimer();
            else if (timerData.state === TimerState.RUNNING) pauseTimer();
            else if (timerData.state === TimerState.PAUSED) resumeTimer();
          }}
          className={`p-5 rounded-full shadow-lg transition-all transform hover:scale-105 ${
            timerData.state === TimerState.RUNNING
              ? 'bg-amber-500 hover:bg-amber-600 text-white'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
          }`}
          title={timerData.state === TimerState.IDLE ? 'Start' : timerData.state === TimerState.RUNNING ? 'Pause' : 'Resume'}
        >
          {timerData.state === TimerState.RUNNING ? (
            <Pause className="w-7 h-7" />
          ) : (
            <Play className="w-7 h-7 ml-0.5" />
          )}
        </button>

        <button
          onClick={stopTimer}
          disabled={timerData.state === TimerState.IDLE}
          className="p-3 rounded-full bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-red-500 transition-colors disabled:opacity-40"
          title="Stop"
        >
          <Square className="w-5 h-5" />
        </button>

        <button
          onClick={skipTimer}
          disabled={timerData.state === TimerState.IDLE}
          className="p-3 rounded-full bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors disabled:opacity-40"
          title="Skip"
        >
          <SkipForward className="w-5 h-5" />
        </button>
      </div>

      {/* Focus mode button */}
      <button
        onClick={() => useStore.getState().toggleFocusMode()}
        className="mt-6 flex items-center gap-2 px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
      >
        <Maximize2 className="w-4 h-4" />
        Focus Mode
      </button>

      {/* Break suggestion */}
      {(timerData.mode === TimerMode.SHORT_BREAK || timerData.mode === TimerMode.LONG_BREAK) && timerData.state !== TimerState.RUNNING && (
        <div className="mt-6 px-4 py-3 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-300">{suggestion}</p>
        </div>
      )}

      {/* Pomodoro indicators */}
      <div className="mt-6 flex items-center gap-2">
        {Array.from({ length: useStore.getState().settings.longBreakInterval }).map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full transition-colors ${
              i < timerData.pomodorosCompleted
                ? 'bg-indigo-500'
                : 'bg-gray-300 dark:bg-gray-600'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
