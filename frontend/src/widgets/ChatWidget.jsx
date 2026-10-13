import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Trash2,
  Copy,
  Check,
  Cpu,
  CornerDownLeft
} from 'lucide-react';

export default function ChatWidget({ onStatusChange }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      text: "Hello! I am Moco, your cyber companion. How can I assist your workflow, focus session, or coding tasks today?"
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const messagesEndRef = useRef(null);

  const quickPrompts = [
    { label: "⚡ Plan Focus Sprint", prompt: "Help me break down my work into a 25-minute high-focus sprint." },
    { label: "🎵 Focus Ambience", prompt: "What ambient music or binaural beats are best for deep concentration?" },
    { label: "🎮 Take a 5m Break", prompt: "Give me a quick 2-minute stretch routine before I jump into a game of Tetris." }
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (e, customText) => {
    e?.preventDefault();
    const query = customText || input;
    if (!query.trim() || loading) return;

    const userText = query.trim();
    setInput('');
    const userMsgId = Date.now();
    const assistantMsgId = userMsgId + 1;

    setMessages(prev => [
      ...prev,
      { id: userMsgId, role: 'user', text: userText },
      { id: assistantMsgId, role: 'assistant', text: '' }
    ]);

    setLoading(true);
    onStatusChange?.('thinking');

    try {
      await api.askAI(userText, (chunk) => {
        onStatusChange?.('speaking');
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
            ? { ...msg, text: `Connection Notice: ${err.message}` }
            : msg
        )
      );
    } finally {
      setLoading(false);
      onStatusChange?.('ready');
    }
  };

  const copyMessage = (id, text) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearChat = () => {
    setMessages([
      {
        id: Date.now(),
        role: 'assistant',
        text: "Session cleared. What's on your mind?"
      }
    ]);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/70 rounded-2xl border border-white/10 p-3.5 backdrop-blur-2xl shadow-xl overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
            <Cpu size={14} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white tracking-wide">
                MOCO INTELLIGENCE
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                GEMINI 2.5
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={clearChat}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition flex items-center gap-1 text-[11px] font-mono"
          title="Clear Conversation"
        >
          <Trash2 size={12} />
          <span>Clear</span>
        </button>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2 group ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shrink-0 mt-0.5">
                <Bot size={13} />
              </div>
            )}

            <div
              className={`relative max-w-[82%] rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed select-text ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-tr-none shadow-md font-medium'
                  : 'bg-white/5 border border-white/10 text-slate-100 rounded-tl-none backdrop-blur-md shadow-sm'
              }`}
            >
              {msg.text || (
                loading && (
                  <div className="flex items-center gap-1.5 py-1 text-cyan-400 font-mono text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.15s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.3s]" />
                    <span className="ml-1 text-[11px] text-slate-400">Synthesizing...</span>
                  </div>
                )
              )}

              {/* Copy message button */}
              {msg.text && (
                <button
                  onClick={() => copyMessage(msg.id, msg.text)}
                  className="absolute -bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded bg-black/60 border border-white/10 text-slate-400 hover:text-white"
                  title="Copy text"
                >
                  {copiedId === msg.id ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                </button>
              )}
            </div>

            {msg.role === 'user' && (
              <div className="w-6 h-6 rounded-lg bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-300 shrink-0 mt-0.5">
                <User size={13} />
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestion Chips */}
      {messages.length <= 2 && (
        <div className="flex items-center gap-1.5 my-2 overflow-x-auto pb-1 scrollbar-none">
          {quickPrompts.map((qp, i) => (
            <button
              key={i}
              type="button"
              onClick={(e) => handleSend(e, qp.prompt)}
              className="text-[11px] font-mono text-slate-300 bg-white/5 hover:bg-cyan-500/15 hover:border-cyan-400/40 border border-white/10 rounded-full px-2.5 py-1 transition whitespace-nowrap shrink-0"
            >
              {qp.label}
            </button>
          ))}
        </div>
      )}

      {/* Input Field */}
      <form onSubmit={handleSend} className="mt-2 flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Moco anything or command an action..."
            className="w-full bg-black/50 border border-white/15 rounded-xl pl-3.5 pr-8 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400/80 focus:ring-1 focus:ring-cyan-400/40 transition shadow-inner font-sans"
          />
        </div>
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-30 disabled:hover:bg-cyan-500 text-black font-bold p-2.5 rounded-xl transition shadow-lg shadow-cyan-500/20 flex items-center justify-center shrink-0 cursor-pointer"
          title="Send query (Enter)"
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}
