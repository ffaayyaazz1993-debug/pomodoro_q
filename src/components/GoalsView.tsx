import React, { useState } from 'react';
import { Plus, Trash2, Target, Flame, Trophy, CheckCircle2 } from 'lucide-react';
import { useStore } from '../store';

export function GoalsView() {
  const { goals, addGoal, updateGoal, deleteGoal, getTodayPomodoros, getTodayFocusMinutes, getTodayCompletedTasks, getStreak, sessions, tasks } = useStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [goalType, setGoalType] = useState('daily_pomodoros');
  const [targetValue, setTargetValue] = useState(8);

  const todayPomodoros = getTodayPomodoros();
  const todayFocusMinutes = getTodayFocusMinutes();
  const todayCompletedTasks = getTodayCompletedTasks();
  const streak = getStreak();

  const handleAdd = () => {
    addGoal({ type: goalType as any, targetValue });
    setShowAddForm(false);
    setTargetValue(8);
  };

  const getGoalProgress = (goal: typeof goals[0]): { current: number; label: string } => {
    switch (goal.type) {
      case 'daily_pomodoros':
        return { current: todayPomodoros, label: 'Pomodoros today' };
      case 'daily_focus_minutes':
        return { current: todayFocusMinutes, label: 'Focus minutes today' };
      case 'daily_tasks':
        return { current: todayCompletedTasks, label: 'Tasks completed today' };
      case 'weekly_pomodoros': {
        const weekSessions = sessions.filter(s => {
          const d = new Date(s.startTime);
          const now = new Date();
          const weekAgo = new Date(now.getTime() - 7 * 86400000);
          return d >= weekAgo && s.mode === 'FOCUS' && s.status === 'COMPLETED';
        });
        return { current: weekSessions.length, label: 'Pomodoros this week' };
      }
      case 'weekly_focus_minutes': {
        const weekSessions = sessions.filter(s => {
          const d = new Date(s.startTime);
          const now = new Date();
          const weekAgo = new Date(now.getTime() - 7 * 86400000);
          return d >= weekAgo && s.mode === 'FOCUS' && s.status === 'COMPLETED';
        });
        return { current: Math.floor(weekSessions.reduce((sum, s) => sum + s.actualDuration, 0) / 60), label: 'Focus minutes this week' };
      }
      default:
        return { current: 0, label: '' };
    }
  };

  const goalTypeLabels = {
    daily_pomodoros: 'Daily Pomodoros',
    daily_focus_minutes: 'Daily Focus (minutes)',
    daily_tasks: 'Daily Tasks Completed',
    weekly_pomodoros: 'Weekly Pomodoros',
    weekly_focus_minutes: 'Weekly Focus (minutes)',
  };

  const goalIcons = {
    daily_pomodoros: '🍅',
    daily_focus_minutes: '⏱️',
    daily_tasks: '✅',
    weekly_pomodoros: '📊',
    weekly_focus_minutes: '📈',
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Goals</h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> New Goal
        </button>
      </div>

      {/* Streak card */}
      <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 rounded-2xl border border-orange-100 dark:border-orange-900 p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="text-4xl">🔥</div>
          <div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{streak}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Day Streak</p>
          </div>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
          {streak > 0 ? 'Keep it going! Complete at least one Pomodoro today to maintain your streak.' : 'Start a Pomodoro today to begin your streak!'}
        </p>
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 mb-6 shadow-sm">
          <h3 className="font-medium text-gray-900 dark:text-white mb-4">New Goal</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Goal Type</label>
              <select value={goalType} onChange={(e) => setGoalType(e.target.value)} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white">
                {Object.entries(goalTypeLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Target</label>
              <input
                type="number"
                min={1}
                value={targetValue}
                onChange={(e) => setTargetValue(parseInt(e.target.value) || 1)}
                className="w-32 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowAddForm(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">Cancel</button>
              <button onClick={handleAdd} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium">Add Goal</button>
            </div>
          </div>
        </div>
      )}

      {/* Goals list */}
      {goals.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
          <div className="text-4xl mb-3">🎯</div>
          <p className="text-gray-500 dark:text-gray-400 mb-2">No goals set</p>
          <button onClick={() => setShowAddForm(true)} className="text-sm text-indigo-600 dark:text-indigo-400">
            Set your first goal
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map(goal => {
            const { current, label } = getGoalProgress(goal);
            const progress = Math.min(100, (current / goal.targetValue) * 100);
            const completed = current >= goal.targetValue;
            
            return (
              <div key={goal.id} className={`bg-white dark:bg-gray-800 border rounded-xl p-5 transition-all ${completed ? 'border-emerald-200 dark:border-emerald-800' : 'border-gray-200 dark:border-gray-700'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{goalIcons[goal.type as keyof typeof goalIcons]}</span>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{goalTypeLabels[goal.type as keyof typeof goalTypeLabels]}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {completed && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                    <button
                      onClick={() => updateGoal(goal.id, { enabled: !goal.enabled })}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${goal.enabled ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}
                    >
                      {goal.enabled ? 'Active' : 'Disabled'}
                    </button>
                    <button
                      onClick={() => deleteGoal(goal.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">{current} / {goal.targetValue}</span>
                      <span className="font-medium text-gray-900 dark:text-white">{Math.round(progress)}%</span>
                    </div>
                    <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${completed ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                {completed && (
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1">
                    <Trophy className="w-4 h-4" /> Goal achieved! 🎉
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
