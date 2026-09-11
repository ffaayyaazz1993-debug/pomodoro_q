import React, { useEffect, useState } from 'react';
import { 
  LayoutDashboard, Timer, CheckSquare, FolderOpen, BarChart3, 
  History, Target, Settings, Menu, X, Moon, Sun, Monitor, Calendar
} from 'lucide-react';
import { View, Theme } from '../types';
import { useStore } from '../store';

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { view: View.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
  { view: View.TIMER, label: 'Timer', icon: Timer },
  { view: View.TASKS, label: 'Tasks', icon: CheckSquare },
  { view: View.PROJECTS, label: 'Projects', icon: FolderOpen },
  { view: View.CALENDAR, label: 'Calendar', icon: Calendar },
  { view: View.STATISTICS, label: 'Statistics', icon: BarChart3 },
  { view: View.HISTORY, label: 'History', icon: History },
  { view: View.GOALS, label: 'Goals', icon: Target },
  { view: View.SETTINGS, label: 'Settings', icon: Settings },
];

export function Layout({ children }: LayoutProps) {
  const { appState, setView, toggleSidebar, settings, updateSettings } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === Theme.DARK) {
      root.classList.add('dark');
    } else if (settings.theme === Theme.LIGHT) {
      root.classList.remove('dark');
    } else {
      // System theme
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      if (mq.matches) root.classList.add('dark');
      else root.classList.remove('dark');
    }
  }, [settings.theme]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
      
      if (e.key === 'Escape' && appState.focusMode) {
        useStore.getState().toggleFocusMode();
        return;
      }
      
      switch (e.key) {
        case '1': if (e.ctrlKey) { e.preventDefault(); setView(View.DASHBOARD); } break;
        case '2': if (e.ctrlKey) { e.preventDefault(); setView(View.TASKS); } break;
        case '3': if (e.ctrlKey) { e.preventDefault(); setView(View.STATISTICS); } break;
        case ',': if (e.ctrlKey) { e.preventDefault(); setView(View.SETTINGS); } break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [appState.focusMode, setView]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  if (appState.focusMode) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="absolute top-4 right-4">
          <button
            onClick={() => useStore.getState().toggleFocusMode()}
            className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Exit Focus Mode (Esc)
          </button>
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
        transform transition-transform duration-200 ease-in-out
        lg:relative lg:translate-x-0
        ${appState.sidebarCollapsed ? 'lg:w-16' : 'lg:w-64'}
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
            {!appState.sidebarCollapsed && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <Timer className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-gray-900 dark:text-white">FocusFlow</span>
              </div>
            )}
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hidden lg:block"
            >
              <Menu className="w-5 h-5" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = appState.currentView === item.view;
              return (
                <button
                  key={item.view}
                  onClick={() => { setView(item.view); setMobileMenuOpen(false); }}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                    ${isActive 
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' 
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                    }
                    ${appState.sidebarCollapsed ? 'lg:justify-center lg:px-2' : ''}
                  `}
                  title={item.label}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!appState.sidebarCollapsed && <span>{item.label}</span>}
                </button>
              );
            })}
          </nav>

          {/* Theme toggle */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            {!appState.sidebarCollapsed && (
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => updateSettings({ theme: Theme.LIGHT })}
                  className={`flex-1 p-1.5 rounded-md transition-colors ${settings.theme === Theme.LIGHT ? 'bg-white dark:bg-gray-600 shadow-sm' : ''}`}
                  title="Light theme"
                >
                  <Sun className="w-4 h-4 mx-auto text-gray-600 dark:text-gray-300" />
                </button>
                <button
                  onClick={() => updateSettings({ theme: Theme.DARK })}
                  className={`flex-1 p-1.5 rounded-md transition-colors ${settings.theme === Theme.DARK ? 'bg-white dark:bg-gray-600 shadow-sm' : ''}`}
                  title="Dark theme"
                >
                  <Moon className="w-4 h-4 mx-auto text-gray-600 dark:text-gray-300" />
                </button>
                <button
                  onClick={() => updateSettings({ theme: Theme.SYSTEM })}
                  className={`flex-1 p-1.5 rounded-md transition-colors ${settings.theme === Theme.SYSTEM ? 'bg-white dark:bg-gray-600 shadow-sm' : ''}`}
                  title="System theme"
                >
                  <Monitor className="w-4 h-4 mx-auto text-gray-600 dark:text-gray-300" />
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Mobile header */}
        <header className="h-16 flex items-center px-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 lg:hidden">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 ml-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Timer className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 dark:text-white">FocusFlow</span>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
