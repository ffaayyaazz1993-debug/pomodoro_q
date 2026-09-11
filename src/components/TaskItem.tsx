import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, Square, SkipForward, RotateCcw, Edit2, Trash2, 
  Archive, CheckCircle2, Circle, Timer, ChevronDown, ChevronUp, Settings2
} from 'lucide-react';
import { Task, TaskStatus, TaskPriority, TimerState, TimerMode } from '../types';
import { useStore } from '../store';
import { formatTime, getProgressPercentage } from '../utils/time';

interface TaskItemProps {
  task: Task;
}

export function TaskItem({ task }: TaskItemProps) {
  const { 
    projects, updateTask, deleteTask, completeTask, reopenTask, archiveTask,
    startTaskTimer, pauseTaskTimer, resumeTaskTimer, stopTaskTimer, resetTaskTimer, skipTaskTimer,
    setTaskTimerMode, setTaskFocusDuration, tickTaskTimers
  } = useStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [showTimer, setShowTimer] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const intervalRef = useRef<number | null>(null);

  // Tick for this task's timer
  useEffect(() => {
    if (task.timer && task.timer.state === TimerState.RUNNING) {
      intervalRef.current = window.setInterval(() => {
        tickTaskTimers();
      }, 200);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [task.timer?.state, tickTaskTimers]);

  const project = projects.find(p => p.id === task.projectId);
  const timer = task.timer;
  const isRunning = timer?.state === TimerState.RUNNING;
  const isPaused = timer?.state === TimerState.PAUSED;
  const hasTimer = timer !== null;

  const progress = timer ? getProgressPercentage(
    timer.totalSeconds - timer.remainingSeconds,
    timer.totalSeconds
  ) : 0;

  const priorityColors = {
    [TaskPriority.LOW]: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    [TaskPriority.MEDIUM]: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
    [TaskPriority.HIGH]: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
    [TaskPriority.CRITICAL]: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  };

  const statusIcons = {
    [TaskStatus.NOT_STARTED]: <Circle className="w-5 h-5 text-gray-400" />,
    [TaskStatus.IN_PROGRESS]: <div className="w-5 h-5 rounded-full border-2 border-indigo-500 flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-indigo-500" /></div>,
    [TaskStatus.COMPLETED]: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
    [TaskStatus.CANCELLED]: <div className="w-5 h-5 rounded-full border-2 border-gray-400 flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-gray-400" /></div>,
    [TaskStatus.ARCHIVED]: <Archive className="w-5 h-5 text-gray-400" />,
  };

  const modeLabels = {
    [TimerMode.FOCUS]: 'Focus',
    [TimerMode.SHORT_BREAK]: 'Short Break',
    [TimerMode.LONG_BREAK]: 'Long Break',
    [TimerMode.CUSTOM]: 'Custom',
  };

  const modeColors = {
    [TimerMode.FOCUS]: 'text-indigo-600 dark:text-indigo-400',
    [TimerMode.SHORT_BREAK]: 'text-emerald-600 dark:text-emerald-400',
    [TimerMode.LONG_BREAK]: 'text-cyan-600 dark:text-cyan-400',
    [TimerMode.CUSTOM]: 'text-amber-600 dark:text-amber-400',
  };

  const handleSaveEdit = () => {
    if (editTitle.trim()) {
      updateTask(task.id, { title: editTitle.trim() });
    }
    setIsEditing(false);
  };

  return (
    <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl transition-all hover:shadow-sm ${task.status === TaskStatus.COMPLETED ? 'opacity-60' : ''} ${isRunning ? 'ring-2 ring-indigo-200 dark:ring-indigo-800' : ''}`}>
      {/* Main task row */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Status toggle */}
          <button
            onClick={() => {
              if (task.status === TaskStatus.COMPLETED) reopenTask(task.id);
              else completeTask(task.id);
            }}
            className="mt-0.5 flex-shrink-0"
          >
            {statusIcons[task.status]}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={handleSaveEdit}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') { setEditTitle(task.title); setIsEditing(false); } }}
                className="w-full px-2 py-1 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />
            ) : (
              <p className={`text-sm font-medium text-gray-900 dark:text-white ${task.status === TaskStatus.COMPLETED ? 'line-through' : ''}`}>
                {task.title}
              </p>
            )}
            
            {task.description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{task.description}</p>
            )}
            
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className={`text-xs px-2 py-0.5 rounded-full ${priorityColors[task.priority]}`}>
                {task.priority}
              </span>
              {project && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                  {project.icon} {project.name}
                </span>
              )}
              <span className="text-xs text-gray-400">
                🍅 {task.completedPomodoros}/{task.estimatedPomodoros}
              </span>
              {task.dueDate && (
                <span className="text-xs text-gray-400">
                  📅 {task.dueDate}
                </span>
              )}
              {task.tags.map(tag => (
                <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Timer toggle */}
            <button
              onClick={() => setShowTimer(!showTimer)}
              className={`p-1.5 rounded-lg transition-colors ${
                showTimer || hasTimer
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
              title="Toggle timer"
            >
              <Timer className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setIsEditing(true); setEditTitle(task.title); }}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              title="Edit"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => archiveTask(task.id)}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              title="Archive"
            >
              <Archive className="w-4 h-4" />
            </button>
            <button
              onClick={() => { if (confirm('Delete this task?')) deleteTask(task.id); }}
              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Inline timer display when running */}
        {hasTimer && !showTimer && (
          <div className="mt-3 flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-medium ${modeColors[timer.mode]}`}>
                  {modeLabels[timer.mode]}
                </span>
                {isRunning && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                {isPaused && <span className="w-2 h-2 rounded-full bg-amber-500" />}
              </div>
              <div className="h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${timer.mode === TimerMode.FOCUS ? 'bg-indigo-500' : 'bg-emerald-500'}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <span className="text-lg font-mono font-bold text-gray-900 dark:text-white tabular-nums min-w-[60px] text-right">
              {formatTime(timer.remainingSeconds)}
            </span>
            {/* Quick controls */}
            <div className="flex items-center gap-1">
              {timer.state === TimerState.IDLE && (
                <button onClick={() => startTaskTimer(task.id)} className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white">
                  <Play className="w-3.5 h-3.5" />
                </button>
              )}
              {isRunning && (
                <button onClick={() => pauseTaskTimer(task.id)} className="p-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white">
                  <Pause className="w-3.5 h-3.5" />
                </button>
              )}
              {isPaused && (
                <button onClick={() => resumeTaskTimer(task.id)} className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white">
                  <Play className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Expanded timer panel */}
      {showTimer && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50/50 dark:bg-gray-900/30">
          {/* Timer display */}
          <div className="flex items-center gap-4 mb-4">
            {/* Progress ring */}
            <div className="relative w-16 h-16 flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 60 60">
                <circle cx="30" cy="30" r="26" fill="none" stroke="currentColor" className="text-gray-200 dark:text-gray-700" strokeWidth="4" />
                <circle cx="30" cy="30" r="26" fill="none" 
                  className={timer?.mode === TimerMode.FOCUS ? 'text-indigo-500' : timer?.mode === TimerMode.SHORT_BREAK ? 'text-emerald-500' : 'text-cyan-500'}
                  stroke="currentColor" strokeWidth="4" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 26}`}
                  strokeDashoffset={`${2 * Math.PI * 26 * (1 - progress / 100)}`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-mono font-bold text-gray-900 dark:text-white tabular-nums">
                  {hasTimer ? formatTime(timer.remainingSeconds) : '--:--'}
                </span>
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-sm font-medium ${hasTimer ? modeColors[timer.mode] : 'text-gray-400'}`}>
                  {hasTimer ? modeLabels[timer.mode] : 'No timer active'}
                </span>
                {isRunning && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                {isPaused && <span className="text-xs text-amber-500 font-medium">Paused</span>}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Pomodoros: {hasTimer ? timer.pomodorosCompleted : 0} | Cycle: {hasTimer ? timer.cycleNumber : 1}
              </p>
            </div>
          </div>

          {/* Mode selector */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-gray-500 dark:text-gray-400">Mode:</span>
            {([TimerMode.FOCUS, TimerMode.SHORT_BREAK, TimerMode.LONG_BREAK] as TimerMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setTaskTimerMode(task.id, mode)}
                disabled={hasTimer && timer.state === TimerState.RUNNING}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  hasTimer && timer.mode === mode
                    ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                } disabled:opacity-50`}
              >
                {modeLabels[mode]}
              </button>
            ))}
          </div>

          {/* Custom duration */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs text-gray-500 dark:text-gray-400">Duration:</span>
            <input
              type="number"
              min={1}
              max={120}
              value={task.focusDuration || useStore.getState().settings.focusDuration}
              onChange={(e) => setTaskFocusDuration(task.id, parseInt(e.target.value) || 0)}
              className="w-16 px-2 py-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-xs text-gray-900 dark:text-white"
            />
            <span className="text-xs text-gray-500 dark:text-gray-400">min (0 = global)</span>
          </div>

          {/* Timer controls */}
          <div className="flex items-center gap-2">
            {!hasTimer || timer.state === TimerState.IDLE ? (
              <button
                onClick={() => startTaskTimer(task.id)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Play className="w-4 h-4" /> Start Timer
              </button>
            ) : (
              <>
                {isRunning && (
                  <button
                    onClick={() => pauseTaskTimer(task.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <Pause className="w-4 h-4" /> Pause
                  </button>
                )}
                {isPaused && (
                  <button
                    onClick={() => resumeTaskTimer(task.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <Play className="w-4 h-4" /> Resume
                  </button>
                )}
                <button
                  onClick={() => resetTaskTimer(task.id)}
                  className="p-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  title="Reset"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => skipTaskTimer(task.id)}
                  className="p-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  title="Skip"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
                <button
                  onClick={() => stopTaskTimer(task.id)}
                  className="p-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-500 hover:text-red-500"
                  title="Stop"
                >
                  <Square className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
