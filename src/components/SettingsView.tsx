import React, { useState, useRef } from 'react';
import { Save, Download, Upload, RotateCcw, Volume2, Bell, Palette, Timer as TimerIcon, Shield, Keyboard, Info } from 'lucide-react';
import { Theme, TimerMode } from '../types';
import { useStore } from '../store';
import { previewSound } from '../utils/sounds';

export function SettingsView() {
  const { settings, updateSettings, exportData, importData, resetAllData, tasks, projects, sessions, goals } = useStore();
  const [activeSection, setActiveSection] = useState('timer');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sections = [
    { id: 'timer', label: 'Timer', icon: TimerIcon },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'sound', label: 'Sound', icon: Volume2 },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'behavior', label: 'Behavior', icon: Shield },
    { id: 'data', label: 'Data', icon: Download },
    { id: 'about', label: 'About', icon: Info },
  ];

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `focusflow-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (confirm('This will replace all current data. Continue?')) {
        const success = importData(content);
        if (success) {
          alert('Data imported successfully!');
          window.location.reload();
        } else {
          alert('Failed to import data. Invalid file format.');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (confirm('This will delete ALL your data including tasks, projects, sessions, and settings. This cannot be undone. Continue?')) {
      if (confirm('Are you absolutely sure?')) {
        resetAllData();
        window.location.reload();
      }
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Settings</h1>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Section nav */}
        <div className="md:w-48 flex-shrink-0">
          <nav className="flex md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0">
            {sections.map(section => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    activeSection === section.id
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {section.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          {/* Timer Settings */}
          {activeSection === 'timer' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Timer Settings</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Focus Duration (min)</label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={settings.focusDuration}
                    onChange={(e) => updateSettings({ focusDuration: parseInt(e.target.value) || 25 })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Short Break (min)</label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={settings.shortBreakDuration}
                    onChange={(e) => updateSettings({ shortBreakDuration: parseInt(e.target.value) || 5 })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Long Break (min)</label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={settings.longBreakDuration}
                    onChange={(e) => updateSettings({ longBreakDuration: parseInt(e.target.value) || 15 })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Long Break After (Pomodoros)</label>
                <input
                  type="number"
                  min={2}
                  max={10}
                  value={settings.longBreakInterval}
                  onChange={(e) => updateSettings({ longBreakInterval: parseInt(e.target.value) || 4 })}
                  className="w-32 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
                />
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Auto-Start</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={settings.autoStartFocus} onChange={(e) => updateSettings({ autoStartFocus: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Auto-start focus sessions</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={settings.autoStartShortBreak} onChange={(e) => updateSettings({ autoStartShortBreak: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Auto-start short breaks</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={settings.autoStartLongBreak} onChange={(e) => updateSettings({ autoStartLongBreak: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Auto-start long breaks</span>
                  </label>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Warning</h3>
                <label className="flex items-center gap-3 cursor-pointer mb-3">
                  <input type="checkbox" checked={settings.warningEnabled} onChange={(e) => updateSettings({ warningEnabled: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Enable warning before completion</span>
                </label>
                {settings.warningEnabled && (
                  <div>
                    <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Warn (minutes) before completion</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={settings.warningMinutes}
                      onChange={(e) => updateSettings({ warningMinutes: parseInt(e.target.value) || 1 })}
                      className="w-24 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
                    />
                  </div>
                )}
              </div>

              {/* Presets */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Presets</h3>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => updateSettings({ focusDuration: 25, shortBreakDuration: 5, longBreakDuration: 15 })} className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600">
                    Classic (25/5/15)
                  </button>
                  <button onClick={() => updateSettings({ focusDuration: 50, shortBreakDuration: 10, longBreakDuration: 20 })} className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600">
                    Extended (50/10/20)
                  </button>
                  <button onClick={() => updateSettings({ focusDuration: 15, shortBreakDuration: 3, longBreakDuration: 10 })} className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600">
                    Short (15/3/10)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Appearance */}
          {activeSection === 'appearance' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Appearance</h2>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">Theme</label>
                <div className="flex gap-3">
                  {(['light', 'dark', 'system'] as Theme[]).map(theme => (
                    <button
                      key={theme}
                      onClick={() => updateSettings({ theme })}
                      className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                        settings.theme === theme
                          ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {theme}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Sound */}
          {activeSection === 'sound' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Sound</h2>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={settings.soundEnabled} onChange={(e) => updateSettings({ soundEnabled: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Enable sounds</span>
              </label>
              {settings.soundEnabled && (
                <>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Volume: {Math.round(settings.soundVolume * 100)}%</label>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.1}
                      value={settings.soundVolume}
                      onChange={(e) => updateSettings({ soundVolume: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => previewSound('completion', settings.soundVolume)} className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200">
                      🔔 Preview Completion
                    </button>
                    <button onClick={() => previewSound('break', settings.soundVolume)} className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200">
                      🔔 Preview Break
                    </button>
                    <button onClick={() => previewSound('warning', settings.soundVolume)} className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200">
                      🔔 Preview Warning
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Notifications */}
          {activeSection === 'notifications' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h2>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={settings.notificationsEnabled} onChange={(e) => updateSettings({ notificationsEnabled: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Enable desktop notifications</span>
              </label>
              {settings.notificationsEnabled && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  You'll be notified when a Pomodoro or break completes, and when daily goals are achieved.
                </p>
              )}
              {!('Notification' in window) && (
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  Your browser doesn't support notifications.
                </p>
              )}
              {'Notification' in window && Notification.permission === 'denied' && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  Notifications are blocked. Please enable them in your browser settings.
                </p>
              )}
            </div>
          )}

          {/* Behavior */}
          {activeSection === 'behavior' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Behavior</h2>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={settings.confirmClose} onChange={(e) => updateSettings({ confirmClose: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Confirm before closing destructive actions</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={settings.countSkippedAsCompleted} onChange={(e) => updateSettings({ countSkippedAsCompleted: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Count skipped sessions toward cycle</span>
                </label>
              </div>
            </div>
          )}

          {/* Data */}
          {activeSection === 'data' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Data Management</h2>
              
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Data</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <span>Tasks: {tasks.length}</span>
                    <span>Projects: {projects.length}</span>
                    <span>Sessions: {sessions.length}</span>
                    <span>Goals: {goals.length}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium">
                    <Download className="w-4 h-4" /> Export Backup
                  </button>
                  <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300">
                    <Upload className="w-4 h-4" /> Import Data
                  </button>
                  <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <button onClick={handleReset} className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-sm font-medium text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50">
                    <RotateCcw className="w-4 h-4" /> Reset All Data
                  </button>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">This will permanently delete all your data.</p>
                </div>
              </div>
            </div>
          )}

          {/* About */}
          {activeSection === 'about' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">About FocusFlow</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white text-xl">🍅</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">FocusFlow</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Version 1.0.0</p>
                  </div>
                </div>
                <div className="prose prose-sm dark:prose-invert">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    A complete Pomodoro productivity application. Track your focus sessions, manage tasks and projects, 
                    analyze your productivity, and build lasting habits.
                  </p>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-4">Features</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Accurate Pomodoro timer with cycle management</li>
                    <li>• Task and project management</li>
                    <li>• Statistics and analytics</li>
                    <li>• Goals and streak tracking</li>
                    <li>• Session history with search and filters</li>
                    <li>• Data export/import and backup</li>
                    <li>• Dark/light themes</li>
                    <li>• Desktop notifications and sounds</li>
                    <li>• Keyboard shortcuts</li>
                    <li>• 100% offline — your data never leaves your device</li>
                  </ul>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-4">Privacy</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    All data is stored locally in your browser. No data is sent to any server. 
                    No tracking, no analytics, no registration required.
                  </p>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-4">Keyboard Shortcuts</h4>
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <p><kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Space</kbd> Start/Pause timer</p>
                    <p><kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">R</kbd> Reset timer</p>
                    <p><kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">S</kbd> Skip to next phase</p>
                    <p><kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Ctrl+1</kbd> Dashboard</p>
                    <p><kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Ctrl+2</kbd> Tasks</p>
                    <p><kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Ctrl+3</kbd> Statistics</p>
                    <p><kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Ctrl+,</kbd> Settings</p>
                    <p><kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Esc</kbd> Exit Focus Mode</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
