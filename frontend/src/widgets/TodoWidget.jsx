import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Check,
  CheckSquare,
  Flame,
  Zap,
  Leaf,
  Layers
} from 'lucide-react';
import { api } from '../services/api';
import '../styles/tasks.css';

export default function TodoWidget() {
  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState('');
  const [priority, setPriority] = useState('normal'); // 'high' | 'med' | 'normal'
  const [filter, setFilter] = useState('all'); // 'all' | 'active' | 'completed'

  useEffect(() => {
    api.getStorage('todos', [
      { id: 1, text: 'Review 3D avatar & Blender model pipeline', completed: true, priority: 'high' },
      { id: 2, text: 'Implement interactive Tetris & Chess games', completed: true, priority: 'high' },
      { id: 3, text: 'Calibrate high-contrast typography & antialiasing', completed: false, priority: 'med' }
    ]).then(setTodos);
  }, []);

  const saveTodos = (newTodos) => {
    setTodos(newTodos);
    api.setStorage('todos', newTodos);
  };

  const addTodo = (e) => {
    e?.preventDefault();
    if (!input.trim()) return;
    const updated = [
      ...todos,
      {
        id: Date.now(),
        text: input.trim(),
        completed: false,
        priority
      }
    ];
    saveTodos(updated);
    setInput('');
  };

  const toggleTodo = (id) => {
    const updated = todos.map(t =>
      t.id === id ? { ...t, completed: !t.completed } : t
    );
    saveTodos(updated);
  };

  const deleteTodo = (id, e) => {
    e?.stopPropagation();
    const updated = todos.filter(t => t.id !== id);
    saveTodos(updated);
  };

  const clearCompleted = () => {
    const updated = todos.filter(t => !t.completed);
    saveTodos(updated);
  };

  const filteredTodos = todos.filter(t => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  const completedCount = todos.filter(t => t.completed).length;
  const progressPercent = todos.length > 0 ? Math.round((completedCount / todos.length) * 100) : 0;

  return (
    <div className="tasks-container">
      <div className="tasks-card">
        {/* Header */}
        <div className="tasks-header">
          <div className="tasks-header-left">
            <div className="tasks-icon-badge">
              <CheckSquare size={18} strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="tasks-header-title">Task Directory</h2>
              <p className="tasks-header-sub">Sprint Objectives & Checklists</p>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="tasks-filter-bar">
            {['all', 'active', 'completed'].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`tasks-filter-btn ${filter === f ? 'active' : ''}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Progress Section (Bold Highlighted Word + Glowing Bar) */}
        <div className="tasks-progress-section">
          <div className="tasks-progress-meta">
            {/* Bold Highlighted Progress Badge */}
            <div className="tasks-progress-badge">
              <span className="tasks-progress-badge-dot" />
              <span>PROGRESS</span>
            </div>

            <div className="tasks-progress-numbers">
              <span className="tasks-progress-ratio">
                {completedCount}/{todos.length}
              </span>
              <span>({progressPercent}%)</span>
            </div>
          </div>

          {/* Glowing Gradient Progress Bar */}
          <div className="tasks-progress-track">
            <div
              className="tasks-progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Task Checklist Items (Clean Card-Buttons) */}
        <div className="tasks-list">
          {filteredTodos.length === 0 ? (
            <div className="tasks-empty">
              <Layers size={28} strokeWidth={1.5} opacity={0.6} />
              <p>
                {filter === 'completed'
                  ? 'No completed tasks yet.'
                  : filter === 'active'
                  ? 'All tasks completed! Great work!'
                  : 'Task queue is empty. Add a new objective below.'}
              </p>
            </div>
          ) : (
            filteredTodos.map((todo) => {
              const isHigh = todo.priority === 'high';
              const isMed = todo.priority === 'med';

              return (
                <div
                  key={todo.id}
                  onClick={() => toggleTodo(todo.id)}
                  className={`tasks-item-button ${todo.completed ? 'completed' : ''}`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleTodo(todo.id);
                    }
                  }}
                >
                  <div className="tasks-item-content">
                    <div className={`tasks-checkbox ${todo.completed ? 'checked' : ''}`}>
                      {todo.completed && <Check size={14} strokeWidth={3} />}
                    </div>
                    <span className={`tasks-item-text ${todo.completed ? 'completed' : ''}`}>
                      {todo.text}
                    </span>
                  </div>

                  <div className="tasks-item-actions">
                    {isHigh && (
                      <span className="tasks-priority-badge high">
                        URGENT
                      </span>
                    )}
                    {isMed && (
                      <span className="tasks-priority-badge med">
                        MED
                      </span>
                    )}
                    {!isHigh && !isMed && (
                      <span className="tasks-priority-badge normal">
                        NORMAL
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={(e) => deleteTodo(todo.id, e)}
                      className="tasks-btn-delete"
                      title="Delete Task"
                    >
                      <Trash2 size={13} strokeWidth={2} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Form / Input Bar */}
        <form onSubmit={addTodo} className="tasks-form">
          <div className="tasks-input-row">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Add new high-priority objective..."
              className="tasks-input"
            />

            {/* Priority Selector Pills */}
            <div className="tasks-priority-selector">
              <button
                type="button"
                onClick={() => setPriority('high')}
                className={`tasks-priority-option ${priority === 'high' ? 'active high' : ''}`}
                title="Urgent Priority (High)"
              >
                <Flame size={14} strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={() => setPriority('med')}
                className={`tasks-priority-option ${priority === 'med' ? 'active med' : ''}`}
                title="Medium Priority"
              >
                <Zap size={14} strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={() => setPriority('normal')}
                className={`tasks-priority-option ${priority === 'normal' ? 'active normal' : ''}`}
                title="Normal Priority"
              >
                <Leaf size={14} strokeWidth={2} />
              </button>
            </div>

            <button
              type="submit"
              disabled={!input.trim()}
              className="tasks-btn-add"
              title="Create Task"
            >
              <Plus size={16} strokeWidth={2.4} />
              <span>Add</span>
            </button>
          </div>

          {/* Footer: Clear completed button */}
          {completedCount > 0 && (
            <div className="tasks-footer">
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                {completedCount} task{completedCount === 1 ? '' : 's'} done
              </span>
              <button
                type="button"
                onClick={clearCompleted}
                className="tasks-btn-clear"
              >
                Clear completed ({completedCount})
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
