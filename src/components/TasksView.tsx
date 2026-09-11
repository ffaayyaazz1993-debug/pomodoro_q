import React, { useState } from 'react';
import { Plus, Search, Filter, CheckCircle2, Circle, Archive, Trash2, Edit2, X, ChevronDown } from 'lucide-react';
import { TaskStatus, TaskPriority, Task } from '../types';
import { useStore } from '../store';

export function TasksView() {
  const { tasks, projects, addTask, updateTask, deleteTask, completeTask, reopenTask, archiveTask } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'ALL'>('ALL');
  const [filterPriority, setFilterPriority] = useState<TaskPriority | 'ALL'>('ALL');
  const [filterProject, setFilterProject] = useState<string>('ALL');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Form state
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newProject, setNewProject] = useState('');
  const [newPriority, setNewPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [newEstimated, setNewEstimated] = useState(1);
  const [newDueDate, setNewDueDate] = useState('');
  const [newTags, setNewTags] = useState('');

  const filteredTasks = tasks
    .filter(t => !t.archived)
    .filter(t => filterStatus === 'ALL' || t.status === filterStatus)
    .filter(t => filterPriority === 'ALL' || t.priority === filterPriority)
    .filter(t => filterProject === 'ALL' || t.projectId === filterProject)
    .filter(t => searchQuery === '' || t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.description.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

  const handleAddTask = () => {
    if (!newTitle.trim()) return;
    addTask({
      title: newTitle.trim(),
      description: newDescription.trim(),
      projectId: newProject || null,
      priority: newPriority,
      estimatedPomodoros: newEstimated,
      dueDate: newDueDate || null,
      tags: newTags.split(',').map(t => t.trim()).filter(Boolean),
    });
    setNewTitle('');
    setNewDescription('');
    setNewProject('');
    setNewPriority(TaskPriority.MEDIUM);
    setNewEstimated(1);
    setNewDueDate('');
    setNewTags('');
    setShowAddForm(false);
  };

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
    [TaskStatus.CANCELLED]: <X className="w-5 h-5 text-gray-400" />,
    [TaskStatus.ARCHIVED]: <Archive className="w-5 h-5 text-gray-400" />,
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tasks</h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> New Task
        </button>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search tasks..."
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

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Status</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as TaskStatus | 'ALL')} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white">
              <option value="ALL">All</option>
              <option value={TaskStatus.NOT_STARTED}>Not Started</option>
              <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
              <option value={TaskStatus.COMPLETED}>Completed</option>
              <option value={TaskStatus.CANCELLED}>Cancelled</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Priority</label>
            <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value as TaskPriority | 'ALL')} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white">
              <option value="ALL">All</option>
              <option value={TaskPriority.LOW}>Low</option>
              <option value={TaskPriority.MEDIUM}>Medium</option>
              <option value={TaskPriority.HIGH}>High</option>
              <option value={TaskPriority.CRITICAL}>Critical</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Project</label>
            <select value={filterProject} onChange={(e) => setFilterProject(e.target.value)} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white">
              <option value="ALL">All Projects</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* Add task form */}
      {showAddForm && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 mb-6 shadow-sm">
          <h3 className="font-medium text-gray-900 dark:text-white mb-4">New Task</h3>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Task title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
            <textarea
              placeholder="Description (optional)"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              rows={2}
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Project</label>
                <select value={newProject} onChange={(e) => setNewProject(e.target.value)} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white">
                  <option value="">No project</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Priority</label>
                <select value={newPriority} onChange={(e) => setNewPriority(e.target.value as TaskPriority)} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white">
                  <option value={TaskPriority.LOW}>Low</option>
                  <option value={TaskPriority.MEDIUM}>Medium</option>
                  <option value={TaskPriority.HIGH}>High</option>
                  <option value={TaskPriority.CRITICAL}>Critical</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Est. Pomodoros</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={newEstimated}
                  onChange={(e) => setNewEstimated(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Due Date</label>
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Tags (comma separated)</label>
                <input
                  type="text"
                  placeholder="work, coding, urgent"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowAddForm(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                Cancel
              </button>
              <button onClick={handleAddTask} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium">
                Add Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task list */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-gray-500 dark:text-gray-400 mb-2">
            {searchQuery || filterStatus !== 'ALL' ? 'No tasks match your filters' : 'No tasks yet'}
          </p>
          {!searchQuery && filterStatus === 'ALL' && (
            <button onClick={() => setShowAddForm(true)} className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700">
              Create your first task
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTasks.map(task => {
            const project = projects.find(p => p.id === task.projectId);
            const isEditing = editingTask === task.id;
            
            return (
              <div key={task.id} className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 transition-all hover:shadow-sm ${task.status === TaskStatus.COMPLETED ? 'opacity-60' : ''}`}>
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
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        onBlur={() => { updateTask(task.id, { title: newTitle }); setEditingTask(null); }}
                        onKeyDown={(e) => { if (e.key === 'Enter') { updateTask(task.id, { title: newTitle }); setEditingTask(null); } }}
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
                    <button
                      onClick={() => { setEditingTask(task.id); setNewTitle(task.title); }}
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
              </div>
            );
          })}
        </div>
      )}

      {/* Summary */}
      <div className="mt-6 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
        <span>{tasks.filter(t => !t.archived).length} total</span>
        <span>•</span>
        <span>{tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length} in progress</span>
        <span>•</span>
        <span>{tasks.filter(t => t.status === TaskStatus.COMPLETED).length} completed</span>
      </div>
    </div>
  );
}
