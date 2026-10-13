import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  CheckSquare,
  ListFilter,
  CheckCheck,
  Flame,
  Zap,
  Leaf
} from 'lucide-react';
import { api } from '../services/api';

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

  const deleteTodo = (id) => {
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
    <div className="flex flex-col h-full bg-slate-900/70 rounded-2xl border border-white/10 p-3.5 backdrop-blur-2xl shadow-xl overflow-hidden">
      {/* Top Header & Progress */}
      <div className="pb-2.5 mb-2 border-b border-white/10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
              <CheckSquare size={13} />
            </div>
            <div>
              <span className="text-xs font-bold text-white tracking-wide">
                TASK DIRECTORY
              </span>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-lg border border-white/10 text-[10px] font-mono">
            {['all', 'active', 'completed'].map(f => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-2 py-0.5 rounded-md capitalize transition ${
                  filter === f
                    ? 'bg-cyan-500 text-black font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-400">Progress</span>
            <span className="text-cyan-400 font-bold">
              {completedCount}/{todos.length} ({progressPercent}%)
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300 shadow-[0_0_8px_#06b6d4]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Todo List */}
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
        {filteredTodos.length === 0 ? (
          <div className="text-center text-slate-500 text-xs py-12 font-mono">
            {filter === 'completed'
              ? 'No completed tasks yet.'
              : filter === 'active'
              ? 'All tasks completed! Great work!'
              : 'Queue is empty. Add a task below.'}
          </div>
        ) : (
          filteredTodos.map(todo => {
            const isHigh = todo.priority === 'high';
            const isMed = todo.priority === 'med';

            return (
              <div
                key={todo.id}
                className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5 hover:border-white/15 transition group select-none"
              >
                <button
                  type="button"
                  onClick={() => toggleTodo(todo.id)}
                  className="flex items-center gap-2.5 text-left flex-1"
                >
                  {todo.completed ? (
                    <CheckCircle2 size={16} className="text-cyan-400 shrink-0 drop-shadow-[0_0_6px_#06b6d4]" />
                  ) : (
                    <Circle size={16} className="text-slate-500 shrink-0 group-hover:text-slate-300 transition" />
                  )}
                  <span
                    className={`text-xs ${
                      todo.completed
                        ? 'line-through text-slate-500'
                        : 'text-slate-200 font-medium'
                    }`}
                  >
                    {todo.text}
                  </span>
                </button>

                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  {/* Priority indicator */}
                  {isHigh && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30">
                      URGENT
                    </span>
                  )}
                  {isMed && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      MED
                    </span>
                  )}

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => deleteTodo(todo.id)}
                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 p-1 transition"
                    title="Delete Task"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Input & Priority Picker */}
      <form onSubmit={addTodo} className="mt-2.5 space-y-2">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Add new high-priority objective..."
            className="flex-1 bg-black/50 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400/80 transition"
          />

          {/* Priority selector */}
          <div className="flex items-center bg-black/40 rounded-xl border border-white/10 p-0.5">
            <button
              type="button"
              onClick={() => setPriority('high')}
              className={`p-1.5 rounded-lg text-xs transition ${
                priority === 'high' ? 'bg-rose-500/30 text-rose-300' : 'text-slate-500 hover:text-white'
              }`}
              title="Urgent Priority"
            >
              <Flame size={13} />
            </button>
            <button
              type="button"
              onClick={() => setPriority('med')}
              className={`p-1.5 rounded-lg text-xs transition ${
                priority === 'med' ? 'bg-amber-500/30 text-amber-300' : 'text-slate-500 hover:text-white'
              }`}
              title="Medium Priority"
            >
              <Zap size={13} />
            </button>
            <button
              type="button"
              onClick={() => setPriority('normal')}
              className={`p-1.5 rounded-lg text-xs transition ${
                priority === 'normal' ? 'bg-emerald-500/30 text-emerald-300' : 'text-slate-500 hover:text-white'
              }`}
              title="Normal Priority"
            >
              <Leaf size={13} />
            </button>
          </div>

          <button
            type="submit"
            disabled={!input.trim()}
            className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-30 text-black font-bold p-2 rounded-xl transition shrink-0"
            title="Create Task"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Clear completed button */}
        {completedCount > 0 && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={clearCompleted}
              className="text-[10px] font-mono text-slate-400 hover:text-cyan-400 transition"
            >
              Clear completed ({completedCount})
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
