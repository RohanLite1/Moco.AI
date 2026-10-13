import React, { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle2, Circle } from 'lucide-react';
import { api } from '../services/api';

export default function TodoWidget() {
  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    // Load todos from storage
    api.getStorage('todos', [
      { id: 1, text: 'Pitch deck outline', completed: true },
      { id: 2, text: 'Connect 3D hologram to AI stream', completed: false }
    ]).then(setTodos);
  }, []);

  const saveTodos = (newTodos) => {
    setTodos(newTodos);
    api.setStorage('todos', newTodos);
  };

  const addTodo = (e) => {
    e?.preventDefault();
    if (!input.trim()) return;
    const updated = [...todos, { id: Date.now(), text: input.trim(), completed: false }];
    saveTodos(updated);
    setInput('');
  };

  const toggleTodo = (id) => {
    const updated = todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    saveTodos(updated);
  };

  const deleteTodo = (id) => {
    const updated = todos.filter(t => t.id !== id);
    saveTodos(updated);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/60 rounded-2xl border border-white/10 p-5 backdrop-blur-xl">
      <div className="text-sm font-semibold tracking-wider text-slate-300 uppercase mb-3 flex items-center justify-between">
        <span>Task Queue</span>
        <span className="text-xs text-cyan-400 font-mono">
          {todos.filter(t => t.completed).length}/{todos.length} done
        </span>
      </div>

      {/* Todo List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
        {todos.length === 0 ? (
          <div className="text-center text-slate-500 text-sm py-10">No tasks in queue. Add one below!</div>
        ) : (
          todos.map(todo => (
            <div
              key={todo.id}
              className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition group"
            >
              <button
                onClick={() => toggleTodo(todo.id)}
                className="flex items-center gap-2.5 text-left flex-1"
              >
                {todo.completed ? (
                  <CheckCircle2 size={16} className="text-cyan-400 shrink-0" />
                ) : (
                  <Circle size={16} className="text-slate-500 shrink-0" />
                )}
                <span className={`text-sm ${todo.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                  {todo.text}
                </span>
              </button>
              <button
                onClick={() => deleteTodo(todo.id)}
                className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 p-1 transition"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Add input */}
      <form onSubmit={addTodo} className="mt-3 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="New task..."
          className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-black p-2 rounded-xl transition"
        >
          <Plus size={18} />
        </button>
      </form>
    </div>
  );
}
