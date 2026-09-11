import React, { useState } from 'react';
import { Plus, Edit2, Trash2, FolderOpen, Clock, Target, CheckCircle2 } from 'lucide-react';
import { ProjectStatus } from '../types';
import { useStore } from '../store';
import { formatDuration } from '../utils/time';

const PROJECT_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];
const PROJECT_ICONS = ['📁', '💻', '📝', '🎨', '📊', '🔬', '📚', '🎯', '🏗️', '🚀'];

export function ProjectsView() {
  const { projects, tasks, sessions, addProject, updateProject, deleteProject, getProjectStats } = useStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(PROJECT_COLORS[0]);
  const [icon, setIcon] = useState(PROJECT_ICONS[0]);
  const [goalPomodoros, setGoalPomodoros] = useState(0);

  const handleAdd = () => {
    if (!name.trim()) return;
    addProject({ name: name.trim(), description: description.trim(), color, icon, goalPomodoros });
    resetForm();
  };

  const handleEdit = (id: string) => {
    const project = projects.find(p => p.id === id);
    if (!project) return;
    setName(project.name);
    setDescription(project.description);
    setColor(project.color);
    setIcon(project.icon);
    setGoalPomodoros(project.goalPomodoros);
    setEditingId(id);
  };

  const handleSaveEdit = () => {
    if (!editingId || !name.trim()) return;
    updateProject(editingId, { name: name.trim(), description: description.trim(), color, icon, goalPomodoros });
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setColor(PROJECT_COLORS[0]);
    setIcon(PROJECT_ICONS[0]);
    setGoalPomodoros(0);
    setShowAddForm(false);
    setEditingId(null);
  };

  const statusColors = {
    [ProjectStatus.ACTIVE]: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
    [ProjectStatus.PAUSED]: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
    [ProjectStatus.COMPLETED]: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    [ProjectStatus.ARCHIVED]: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Projects</h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      {/* Add/Edit form */}
      {(showAddForm || editingId) && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 mb-6 shadow-sm">
          <h3 className="font-medium text-gray-900 dark:text-white mb-4">{editingId ? 'Edit Project' : 'New Project'}</h3>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Project name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
            <textarea
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={2}
            />
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block">Icon</label>
              <div className="flex flex-wrap gap-2">
                {PROJECT_ICONS.map(i => (
                  <button
                    key={i}
                    onClick={() => setIcon(i)}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-all ${icon === i ? 'bg-indigo-100 dark:bg-indigo-900/50 ring-2 ring-indigo-500' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                  >
                    {i}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block">Color</label>
              <div className="flex flex-wrap gap-2">
                {PROJECT_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full transition-all ${color === c ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-gray-800' : ''}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Goal (Pomodoros)</label>
              <input
                type="number"
                min={0}
                value={goalPomodoros}
                onChange={(e) => setGoalPomodoros(parseInt(e.target.value) || 0)}
                className="w-32 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={resetForm} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">Cancel</button>
              <button onClick={editingId ? handleSaveEdit : handleAdd} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium">
                {editingId ? 'Save' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Projects grid */}
      {projects.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
          <div className="text-4xl mb-3">📂</div>
          <p className="text-gray-500 dark:text-gray-400 mb-2">No projects yet</p>
          <button onClick={() => setShowAddForm(true)} className="text-sm text-indigo-600 dark:text-indigo-400">
            Create your first project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map(project => {
            const stats = getProjectStats(project.id);
            const progress = project.goalPomodoros > 0 ? Math.min(100, (stats.pomodoros / project.goalPomodoros) * 100) : 0;
            
            return (
              <div key={project.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg" style={{ backgroundColor: project.color + '20' }}>
                      {project.icon}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{project.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[project.status]}`}>
                        {project.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleEdit(project.id)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => { if (confirm('Delete this project?')) deleteProject(project.id); }} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {project.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{project.description}</p>
                )}

                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.tasks}</p>
                    <p className="text-xs text-gray-500">Tasks</p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.pomodoros}</p>
                    <p className="text-xs text-gray-500">Pomodoros</p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{formatDuration(stats.focusMinutes * 60)}</p>
                    <p className="text-xs text-gray-500">Focus</p>
                  </div>
                </div>

                {project.goalPomodoros > 0 && (
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Progress</span>
                      <span>{stats.pomodoros}/{project.goalPomodoros}</span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: project.color }} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
