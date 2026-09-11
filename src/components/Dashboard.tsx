import React, { useEffect, useRef } from 'react';
import { Play, Pause, Target, Flame, Clock, CheckCircle2, TrendingUp, ArrowRight, Square, SkipForward, RotateCcw } from 'lucide-react';
import { TimerState, TimerMode, View } from '../types';
import { useStore } from '../store';
import { formatTime, formatDuration, getProgressPercentage } from '../utils/time';

function ActiveTaskTimers() {
  const { tasks, projects, startTaskTimer, pauseTaskTimer, resumeTaskTimer, stopTaskTimer, resetTaskTimer, skipTaskTimer, tickTaskTimers } = useStore();
  const intervalRef = useRef<number | null>(null);
  
  const activeTimers = tasks.filter(t => t.timer && t.timer.state !== TimerState.IDLE);
  const hasRunning = activeTimers.some(t => t.timer?.state === TimerState.RUNNING);
  
  useEffect(() => {
    if (hasRunning) {
      intervalRef.current = window.setInterval(() => tickTaskTimers(), 200);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [hasRunning, tickTaskTimers]);

  if (activeTimers.length === 0) return null;

  const modeLabels = {
    [TimerMode.FOCUS]: 'Focus',
    [TimerMode.SHORT_BREAK]: 'Short Break',
    [TimerMode.LONG_BREAK]: 'Long Break',
    [TimerMode.CUSTOM]: 'Custom',
  };

  return (
    <div className="mt-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-gray-900 dark:text-white">Active Task Timers</h2>
          <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-medium rounded-full">
            {activeTimers.length} running
          </span>
        </div>
        <button onClick={() => useStore.getState().setView(View.TASKS)} className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700">
          View Tasks
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {activeTimers.map(task => {
          const timer = task.timer!;
          const project = projects.find(p => p.id === task.projectId);
          const progress = getProgressPercentage(timer.totalSeconds - timer.remainingSeconds, timer.totalSeconds);
          const isRunning = timer.state === TimerState.RUNNING;
          const isPaused = timer.state === TimerState.PAUSED;
          
          return (
            <div key={task.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600">
              <div className="flex items-center justify-between mb-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{task.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-xs font-medium ${timer.mode === TimerMode.FOCUS ? 'text-indigo-600 dark:text-indigo-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {modeLabels[timer.mode]}
                    </span>
                    {isRunning && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                    {isPaused && <span className="text-xs text-amber-500">⏸</span>}
                    {project && <span className="text-xs text-gray-400 truncate">{project.icon} {project.name}</span>}
                  </div>
                </div>
                <span className="text-lg font-mono font-bold text-gray-900 dark:text-white tabular-nums ml-2">
                  {formatTime(timer.remainingSeconds)}
                </span>
              </div>
              
              <div className="h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden mb-2">
                <div 
                  className={`h-full rounded-full transition-all ${timer.mode === TimerMode.FOCUS ? 'bg-indigo-500' : 'bg-emerald-500'}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              
              <div className="flex items-center gap-1">
                {timer.state === TimerState.IDLE && (
                  <button onClick={() => startTaskTimer(task.id)} className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white">
                    <Play className="w-3 h-3" />
                  </button>
                )}
                {isRunning && (
                  <button onClick={() => pauseTaskTimer(task.id)} className="p-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white">
                    <Pause className="w-3 h-3" />
                  </button>
                )}
                {isPaused && (
                  <button onClick={() => resumeTaskTimer(task.id)} className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white">
                    <Play className="w-3 h-3" />
                  </button>
                )}
                <button onClick={() => resetTaskTimer(task.id)} className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-400">
                  <RotateCcw className="w-3 h-3" />
                </button>
                <button onClick={() => skipTaskTimer(task.id)} className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-400">
                  <SkipForward className="w-3 h-3" />
                </button>
                <button onClick={() => stopTaskTimer(task.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 ml-auto">
                  <Square className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function Dashboard() {
  const { timerData, startTimer, pauseTimer, resumeTimer, tick, tasks, sessions, goals, setView, getTodayPomodoros, getTodayFocusMinutes, getTodayCompletedTasks, getStreak } = useStore();
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (timerData.state === TimerState.RUNNING) {
      intervalRef.current = window.setInterval(() => tick(), 200);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [timerData.state, tick]);

  const todayPomodoros = getTodayPomodoros();
  const todayFocusMinutes = getTodayFocusMinutes();
  const todayCompletedTasks = getTodayCompletedTasks();
  const streak = getStreak();
  
  const dailyGoal = goals.find(g => g.type === 'daily_pomodoros' && g.enabled);
  const goalProgress = dailyGoal ? Math.min(100, (todayPomodoros / dailyGoal.targetValue) * 100) : 0;

  const currentTask = tasks.find(t => t.id === timerData.taskId);
  const upcomingTasks = tasks
    .filter(t => t.status !== 'COMPLETED' && t.status !== 'ARCHIVED' && t.status !== 'CANCELLED')
    .sort((a, b) => {
      const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    })
    .slice(0, 5);

  const recentSessions = [...sessions]
    .filter(s => s.status === 'COMPLETED')
    .sort((a, b) => b.startTime.localeCompare(a.startTime))
    .slice(0, 5);

  const progress = getProgressPercentage(
    timerData.totalSeconds - timerData.remainingSeconds,
    timerData.totalSeconds
  );

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

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timer Card */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className={`text-sm font-medium ${modeColors[timerData.mode]}`}>
                {modeLabels[timerData.mode]}
              </p>
              {currentTask && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Working on: {currentTask.title}
                </p>
              )}
            </div>
            <button
              onClick={() => setView(View.TIMER)}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1"
            >
              Full Timer <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-6">
            {/* Mini timer display */}
            <div className="relative w-32 h-32">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" className="text-gray-100 dark:text-gray-700" strokeWidth="6" />
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" 
                  className={timerData.mode === TimerMode.FOCUS ? 'text-indigo-500' : timerData.mode === TimerMode.SHORT_BREAK ? 'text-emerald-500' : 'text-cyan-500'}
                  strokeWidth="6" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-mono font-bold text-gray-900 dark:text-white tabular-nums">
                  {formatTime(timerData.remainingSeconds)}
                </span>
              </div>
            </div>

            {/* Controls and info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={() => {
                    if (timerData.state === TimerState.IDLE) startTimer();
                    else if (timerData.state === TimerState.RUNNING) pauseTimer();
                    else if (timerData.state === TimerState.PAUSED) resumeTimer();
                  }}
                  className={`px-5 py-2.5 rounded-xl font-medium text-white transition-all ${
                    timerData.state === TimerState.RUNNING
                      ? 'bg-amber-500 hover:bg-amber-600'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {timerData.state === TimerState.RUNNING ? (
                    <span className="flex items-center gap-2"><Pause className="w-4 h-4" /> Pause</span>
                  ) : (
                    <span className="flex items-center gap-2"><Play className="w-4 h-4" /> {timerData.state === TimerState.PAUSED ? 'Resume' : 'Start'}</span>
                  )}
                </button>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span>Cycle {timerData.cycleNumber}</span>
                <span>•</span>
                <span>#{timerData.pomodorosCompleted + 1} of {useStore.getState().settings.longBreakInterval}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/30">
                <Target className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{todayPomodoros}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Pomodoros today</p>
              </div>
            </div>
            {dailyGoal && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Daily Goal</span>
                  <span>{todayPomodoros}/{dailyGoal.targetValue}</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${goalProgress}%` }} />
                </div>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/30">
                <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatDuration(todayFocusMinutes * 60)}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Focus time today</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-900/30">
                <Flame className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{streak}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Day streak</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/30">
                <CheckCircle2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{todayCompletedTasks}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Tasks completed</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Task Timers */}
      <ActiveTaskTimers />

      {/* Bottom section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Upcoming Tasks */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-white">Upcoming Tasks</h2>
            <button onClick={() => setView(View.TASKS)} className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700">
              View all
            </button>
          </div>
          {upcomingTasks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 dark:text-gray-500 text-sm">No tasks yet</p>
              <button onClick={() => setView(View.TASKS)} className="mt-2 text-sm text-indigo-600 dark:text-indigo-400">
                Create your first task
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingTasks.map(task => (
                <div key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      task.priority === 'CRITICAL' ? 'bg-red-500' :
                      task.priority === 'HIGH' ? 'bg-orange-500' :
                      task.priority === 'MEDIUM' ? 'bg-yellow-500' : 'bg-blue-500'
                    }`} />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{task.title}</span>
                  </div>
                  <span className="text-xs text-gray-400">{task.completedPomodoros}/{task.estimatedPomodoros}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Sessions */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-white">Recent Sessions</h2>
            <button onClick={() => setView(View.HISTORY)} className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700">
              View all
            </button>
          </div>
          {recentSessions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 dark:text-gray-500 text-sm">No sessions recorded</p>
              <button onClick={() => setView(View.TIMER)} className="mt-2 text-sm text-indigo-600 dark:text-indigo-400">
                Start your first session
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {recentSessions.map(session => {
                const task = tasks.find(t => t.id === session.taskId);
                return (
                  <div key={session.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${session.mode === TimerMode.FOCUS ? 'bg-indigo-500' : 'bg-emerald-500'}`} />
                      <div>
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {task ? task.title : modeLabels[session.mode]}
                        </span>
                        <p className="text-xs text-gray-400">{formatDuration(session.actualDuration)}</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
