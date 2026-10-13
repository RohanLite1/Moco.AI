import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';
import { Send, Sparkles, Bot, User } from 'lucide-react';

export default function ChatWidget({ onStatusChange }) {
  const [messages, setMessages] = useState([
    { id: 1, role: 'assistant', text: "Hello! I'm Moco. How can I assist you with your focus session or tasks today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput('');
    const userMsgId = Date.now();
    const assistantMsgId = userMsgId + 1;

    setMessages(prev => [
      ...prev,
      { id: userMsgId, role: 'user', text: userText },
      { id: assistantMsgId, role: 'assistant', text: '' }
    ]);

    setLoading(true);

    try {
      await api.askAI(userText, (chunk) => {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === assistantMsgId
              ? { ...msg, text: msg.text + chunk }
              : msg
          )
        );
      });
    } catch (err) {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantMsgId
            ? { ...msg, text: `Error: ${err.message}` }
            : msg
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/60 rounded-2xl border border-white/10 p-4 backdrop-blur-xl">
      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shrink-0">
                <Bot size={15} />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-tr-none'
                  : 'bg-white/5 border border-white/10 text-slate-200 rounded-tl-none'
              }`}
            >
              {msg.text || (loading && <span className="animate-pulse text-cyan-400">Thinking...</span>)}
            </div>
            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-300 shrink-0">
                <User size={15} />
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Field */}
      <form onSubmit={handleSend} className="mt-3 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Moco anything..."
          className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500/60 transition"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-black px-3.5 py-2.5 rounded-xl font-medium transition flex items-center justify-center cursor-pointer"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
