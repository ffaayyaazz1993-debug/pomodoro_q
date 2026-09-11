import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useStore } from '../store';
import { TimerMode, SessionStatus } from '../types';
import { formatDuration } from '../utils/time';

export function CalendarView() {
  const { sessions, tasks, projects } = useStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Get data for each day
  const getDayData = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const daySessions = sessions.filter(s => s.startTime.startsWith(dateStr));
    const pomodoros = daySessions.filter(s => s.mode === TimerMode.FOCUS && s.status === SessionStatus.COMPLETED).length;
    const focusMinutes = daySessions
      .filter(s => s.mode === TimerMode.FOCUS && s.status === SessionStatus.COMPLETED)
      .reduce((sum, s) => sum + s.actualDuration, 0);
    return { dateStr, pomodoros, focusMinutes, sessions: daySessions };
  };

  const selectedDayData = selectedDate ? (() => {
    const daySessions = sessions.filter(s => s.startTime.startsWith(selectedDate));
    return daySessions.sort((a, b) => b.startTime.localeCompare(a.startTime));
  })() : [];

  const days = [];
  // Empty cells for days before the 1st
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  // Days of the month
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(d);
  }

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Calendar</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{monthName}</h2>
            <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, i) => {
              if (day === null) {
                return <div key={`empty-${i}`} className="aspect-square" />;
              }
              
              const data = getDayData(day);
              const dateStr = data.dateStr;
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;
              const hasData = data.pomodoros > 0;
              
              // Color intensity based on pomodoros
              let bgClass = '';
              if (hasData) {
                if (data.pomodoros >= 8) bgClass = 'bg-indigo-500 text-white';
                else if (data.pomodoros >= 5) bgClass = 'bg-indigo-300 dark:bg-indigo-600 text-white';
                else if (data.pomodoros >= 3) bgClass = 'bg-indigo-200 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200';
                else bgClass = 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300';
              }

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(dateStr === selectedDate ? null : dateStr)}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-all hover:ring-2 hover:ring-indigo-300 dark:hover:ring-indigo-700 ${
                    bgClass || 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  } ${isToday ? 'ring-2 ring-indigo-500' : ''} ${isSelected ? 'ring-2 ring-indigo-600 dark:ring-indigo-400' : ''}`}
                >
                  <span className="font-medium">{day}</span>
                  {hasData && (
                    <span className={`text-[10px] ${bgClass.includes('text-white') ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                      {data.pomodoros}🍅
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-500 dark:text-gray-400">
            <span>Less</span>
            <div className="flex gap-1">
              <div className="w-4 h-4 rounded bg-gray-100 dark:bg-gray-700" />
              <div className="w-4 h-4 rounded bg-indigo-100 dark:bg-indigo-900/50" />
              <div className="w-4 h-4 rounded bg-indigo-200 dark:bg-indigo-800" />
              <div className="w-4 h-4 rounded bg-indigo-300 dark:bg-indigo-600" />
              <div className="w-4 h-4 rounded bg-indigo-500" />
            </div>
            <span>More</span>
          </div>
        </div>

        {/* Selected day details */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
          {selectedDate ? (
            <>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </h3>
              {selectedDayData.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">No sessions on this day</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {selectedDayData.map(session => {
                    const task = tasks.find(t => t.id === session.taskId);
                    const project = projects.find(p => p.id === session.projectId);
                    return (
                      <div key={session.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${session.mode === TimerMode.FOCUS ? 'bg-indigo-500' : 'bg-emerald-500'}`} />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {task ? task.title : session.mode === TimerMode.FOCUS ? 'Focus' : 'Break'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                          <span>{formatDuration(session.actualDuration)}</span>
                          <span>•</span>
                          <span>{new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {project && <><span>•</span><span>{project.icon} {project.name}</span></>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <div className="text-3xl mb-2">📅</div>
              <p className="text-sm text-gray-400 dark:text-gray-500">Select a day to view sessions</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
