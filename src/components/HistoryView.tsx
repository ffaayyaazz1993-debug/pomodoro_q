import React, { useState } from 'react';
import { Search, Filter, Trash2, Calendar, Clock, ChevronDown, Download } from 'lucide-react';
import { TimerMode, SessionStatus } from '../types';
import { useStore } from '../store';
import { formatDuration, formatDateTime, getTodayKey, getDaysAgo } from '../utils/time';
import { exportToCSV } from '../utils/storage';

export function HistoryView() {
  const { sessions, tasks, projects, deleteSession } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<TimerMode | 'ALL'>('ALL');
  const [filterStatus, setFilterStatus] = useState<SessionStatus | 'ALL'>('ALL');
  const [filterDate, setFilterDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'duration'>('date');

  const filteredSessions = [...sessions]
    .filter(s => filterMode === 'ALL' || s.mode === filterMode)
    .filter(s => filterStatus === 'ALL' || s.status === filterStatus)
    .filter(s => !filterDate || s.startTime.startsWith(filterDate))
    .filter(s => {
      if (!searchQuery) return true;
      const task = tasks.find(t => t.id === s.taskId);
      const project = projects.find(p => p.id === s.projectId);
      const q = searchQuery.toLowerCase();
      return (task?.title.toLowerCase().includes(q)) || 
             (project?.name.toLowerCase().includes(q)) ||
             (s.notes.toLowerCase().includes(q));
    })
    .sort((a, b) => {
      if (sortBy === 'duration') return b.actualDuration - a.actualDuration;
      return b.startTime.localeCompare(a.startTime);
    });

  const modeLabels = {
    [TimerMode.FOCUS]: 'Focus',
    [TimerMode.SHORT_BREAK]: 'Short Break',
    [TimerMode.LONG_BREAK]: 'Long Break',
    [TimerMode.CUSTOM]: 'Custom',
  };

  const statusColors = {
    [SessionStatus.COMPLETED]: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
    [SessionStatus.CANCELLED]: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    [SessionStatus.SKIPPED]: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
    [SessionStatus.INTERRUPTED]: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
    [SessionStatus.ABANDONED]: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
  };

  const handleExport = () => {
    const headers = ['Date', 'Mode', 'Status', 'Duration (min)', 'Task', 'Project', 'Interruptions', 'Notes'];
    const rows = filteredSessions.map(s => {
      const task = tasks.find(t => t.id === s.taskId);
      const project = projects.find(p => p.id === s.projectId);
      return [
        s.startTime,
        modeLabels[s.mode],
        s.status,
        Math.round(s.actualDuration / 60),
        task?.title || '',
        project?.name || '',
        s.interruptions,
        s.notes,
      ];
    });
    const csv = exportToCSV(headers, rows);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pomodoro-history-${getTodayKey()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Group sessions by date
  const groupedSessions: Record<string, typeof filteredSessions> = {};
  filteredSessions.forEach(s => {
    const date = s.startTime.substring(0, 10);
    if (!groupedSessions[date]) groupedSessions[date] = [];
    groupedSessions[date].push(s);
  });

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">History</h1>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search sessions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm transition-colors ${
            showFilters ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
          }`}
        >
          <Filter className="w-4 h-4" /> Filters
          <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {showFilters && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6 grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Mode</label>
            <select value={filterMode} onChange={(e) => setFilterMode(e.target.value as TimerMode | 'ALL')} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white">
              <option value="ALL">All</option>
              <option value={TimerMode.FOCUS}>Focus</option>
              <option value={TimerMode.SHORT_BREAK}>Short Break</option>
              <option value={TimerMode.LONG_BREAK}>Long Break</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Status</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as SessionStatus | 'ALL')} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white">
              <option value="ALL">All</option>
              <option value={SessionStatus.COMPLETED}>Completed</option>
              <option value={SessionStatus.CANCELLED}>Cancelled</option>
              <option value={SessionStatus.SKIPPED}>Skipped</option>
              <option value={SessionStatus.ABANDONED}>Abandoned</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Date</label>
            <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Sort by</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as 'date' | 'duration')} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white">
              <option value="date">Date</option>
              <option value="duration">Duration</option>
            </select>
          </div>
        </div>
      )}

      {/* Session list */}
      {filteredSessions.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
          <div className="text-4xl mb-3">📜</div>
          <p className="text-gray-500 dark:text-gray-400 mb-2">
            {searchQuery || filterMode !== 'ALL' ? 'No sessions match your filters' : 'No sessions recorded yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedSessions).map(([date, dateSessions]) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-3">
                <Calendar className="w-4 h-4 text-gray-400" />
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </h3>
                <span className="text-xs text-gray-400">
                  {dateSessions.filter(s => s.mode === TimerMode.FOCUS && s.status === SessionStatus.COMPLETED).length} pomodoros •{' '}
                  {formatDuration(dateSessions.filter(s => s.mode === TimerMode.FOCUS && s.status === SessionStatus.COMPLETED).reduce((sum, s) => sum + s.actualDuration, 0))}
                </span>
              </div>
              <div className="space-y-2">
                {dateSessions.map(session => {
                  const task = tasks.find(t => t.id === session.taskId);
                  const project = projects.find(p => p.id === session.projectId);
                  
                  return (
                    <div key={session.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex items-center gap-4">
                      <div className={`w-2 h-8 rounded-full ${session.mode === TimerMode.FOCUS ? 'bg-indigo-500' : 'bg-emerald-500'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {task ? task.title : modeLabels[session.mode]}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[session.status]}`}>
                            {session.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDuration(session.actualDuration)}
                          </span>
                          <span>{new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {project && <span>{project.icon} {project.name}</span>}
                          {session.interruptions > 0 && <span>{session.interruptions} interruptions</span>}
                        </div>
                      </div>
                      <button
                        onClick={() => { if (confirm('Delete this session?')) deleteSession(session.id); }}
                        className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
        {filteredSessions.length} sessions total
      </div>
    </div>
  );
}
