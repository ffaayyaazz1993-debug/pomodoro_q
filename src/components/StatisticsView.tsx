import React, { useState } from 'react';
import { BarChart3, TrendingUp, Clock, Target, Calendar, Lightbulb } from 'lucide-react';
import { useStore } from '../store';
import { formatDuration, getDaysAgo, getTodayKey } from '../utils/time';
import { TimerMode, SessionStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Area, AreaChart } from 'recharts';

export function StatisticsView() {
  const { sessions, tasks, projects, getDailyStats, getWeeklyStats, getAllTimeStats, getStreak } = useStore();
  const [range, setRange] = useState(7);

  const dailyStats = getDailyStats(range);
  const weeklyStats = getWeeklyStats();
  const allTimeStats = getAllTimeStats();
  const streak = getStreak();

  // Project distribution data
  const projectData = projects.map(p => {
    const projectSessions = sessions.filter(s => s.projectId === p.id && s.mode === TimerMode.FOCUS && s.status === SessionStatus.COMPLETED);
    return {
      name: p.name,
      value: projectSessions.reduce((sum, s) => sum + s.actualDuration, 0),
      color: p.color,
    };
  }).filter(d => d.value > 0);

  // Insights
  const insights: string[] = [];
  if (allTimeStats.totalPomodoros > 0) {
    const avgDaily = range > 0 ? Math.round(weeklyStats.totalPomodoros / Math.max(1, weeklyStats.activeDays) * 10) / 10 : 0;
    insights.push(`You average ${avgDaily} Pomodoros per active day.`);
    
    if (projectData.length > 0) {
      const total = projectData.reduce((sum, d) => sum + d.value, 0);
      const top = projectData.sort((a, b) => b.value - a.value)[0];
      const pct = Math.round((top.value / total) * 100);
      insights.push(`Your "${top.name}" project consumed ${pct}% of your total focus time.`);
    }

    // Most productive day of week
    const dayCounts: Record<string, number> = {};
    sessions.filter(s => s.mode === TimerMode.FOCUS && s.status === SessionStatus.COMPLETED).forEach(s => {
      const day = new Date(s.startTime).toLocaleDateString('en-US', { weekday: 'long' });
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    });
    const bestDay = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0];
    if (bestDay) {
      insights.push(`Your most productive day is ${bestDay[0]} (${bestDay[1]} sessions).`);
    }
  }

  const chartData = dailyStats.map(d => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    pomodoros: d.pomodoros,
    focusMinutes: d.focusMinutes,
  }));

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Statistics</h1>
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-1">
          {[7, 30, 90].map(d => (
            <button
              key={d}
              onClick={() => setRange(d)}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${range === d ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4 text-indigo-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">This Period</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{weeklyStats.totalPomodoros}</p>
          <p className="text-xs text-gray-500">Pomodoros</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-emerald-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Focus Time</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatDuration(weeklyStats.totalFocusMinutes * 60)}</p>
          <p className="text-xs text-gray-500">Total</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-orange-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Active Days</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{weeklyStats.activeDays}</p>
          <p className="text-xs text-gray-500">of {range} days</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-purple-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Streak</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{streak}</p>
          <p className="text-xs text-gray-500">days</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Pomodoros chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="font-medium text-gray-900 dark:text-white mb-4">Pomodoros per Day</h3>
          {chartData.some(d => d.pomodoros > 0) ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                <Bar dataKey="pomodoros" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">
              No data for this period
            </div>
          )}
        </div>

        {/* Focus time chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="font-medium text-gray-900 dark:text-white mb-4">Focus Time per Day</h3>
          {chartData.some(d => d.focusMinutes > 0) ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" unit="m" />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                <Area type="monotone" dataKey="focusMinutes" stroke="#10b981" fill="#10b981" fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">
              No data for this period
            </div>
          )}
        </div>
      </div>

      {/* Project distribution */}
      {projectData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 mb-6">
          <h3 className="font-medium text-gray-900 dark:text-white mb-4">Focus Time by Project</h3>
          <div className="flex flex-col md:flex-row items-center gap-6">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={projectData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  nameKey="name"
                >
                  {projectData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatDuration(value)} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3">
              {projectData.map((d, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-sm text-gray-600 dark:text-gray-400">{d.name} ({formatDuration(d.value)})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* All-time stats */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 mb-6">
        <h3 className="font-medium text-gray-900 dark:text-white mb-4">All-Time Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-xl font-bold text-gray-900 dark:text-white">{allTimeStats.totalPomodoros}</p>
            <p className="text-xs text-gray-500">Total Pomodoros</p>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-xl font-bold text-gray-900 dark:text-white">{allTimeStats.totalFocusHours}h</p>
            <p className="text-xs text-gray-500">Focus Hours</p>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-xl font-bold text-gray-900 dark:text-white">{allTimeStats.longestStreak}</p>
            <p className="text-xs text-gray-500">Longest Streak</p>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-xl font-bold text-gray-900 dark:text-white">{allTimeStats.completedTasks}</p>
            <p className="text-xs text-gray-500">Tasks Done</p>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-xl font-bold text-gray-900 dark:text-white">{allTimeStats.projectsCompleted}</p>
            <p className="text-xs text-gray-500">Projects Done</p>
          </div>
        </div>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-medium text-gray-900 dark:text-white">Observations</h3>
          </div>
          <ul className="space-y-2">
            {insights.map((insight, i) => (
              <li key={i} className="text-sm text-gray-600 dark:text-gray-300 flex items-start gap-2">
                <span className="text-indigo-500 mt-0.5">•</span>
                {insight}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
