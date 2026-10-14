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
  CornerDownLeft,
  Zap,
  Headphones,
  Gamepad2
} from 'lucide-react';

export default function ChatWidget({ onStatusChange }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      text: "Hello! I am Moco, your desktop AI companion powered by local Ollama (Gemma 3 4B). Type any question below or ask me to help with your work!"
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const messagesEndRef = useRef(null);

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

    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: 'user', text: userText },
      { id: assistantMsgId, role: 'assistant', text: '' }
    ]);

    setLoading(true);
    onStatusChange?.('thinking');

    try {
      await api.askAI(userText, (chunk) => {
        onStatusChange?.('speaking');
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? { ...msg, text: msg.text + chunk }
              : msg
          )
        );
      });
    } catch (err) {
      setMessages((prev) =>
        prev.map((msg) =>
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
    <div className="chat-container">
      <div className="chat-card">
        {/* Top Header */}
        <div className="chat-header">
          <div className="chat-header-left">
            <div className="chat-icon-badge">
              <Cpu size={18} strokeWidth={2.2} />
            </div>
            <div className="chat-header-titles">
              <div className="chat-title-row">
                <h2 className="chat-header-title">Moco Intelligence</h2>
                <span className="chat-model-tag">Ollama 4B</span>
              </div>
              <span className="chat-header-sub">
                Neural Workflow & Focus Assistant
              </span>
            </div>
          </div>

          <div className="chat-header-right">
            <div className="chat-live-badge">
              <span className="chat-pulse-dot" />
              <span>ACTIVE</span>
            </div>

            <button
              type="button"
              onClick={clearChat}
              className="chat-clear-btn"
              title="Clear Conversation"
            >
              <Trash2 size={12} />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Messages Feed */}
        <div className="chat-messages-scroll">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`chat-msg-row ${msg.role === 'user' ? 'user' : 'assistant'}`}
            >
              <div className={`chat-msg-avatar ${msg.role === 'user' ? 'user' : 'assistant'}`}>
                {msg.role === 'user' ? <User size={15} /> : <Bot size={16} />}
              </div>

              <div className="chat-msg-content-wrap">
                <div className={`chat-msg-bubble ${msg.role === 'user' ? 'user' : 'assistant'}`}>
                  {msg.text || (
                    loading && (
                      <div className="chat-synthesizing">
                        <span className="chat-synth-dots">
                          <span className="chat-synth-dot" />
                          <span className="chat-synth-dot" />
                          <span className="chat-synth-dot" />
                        </span>
                        <span>Synthesizing response...</span>
                      </div>
                    )
                  )}

                  {msg.text && (
                    <button
                      type="button"
                      onClick={() => copyMessage(msg.id, msg.text)}
                      className="chat-copy-btn"
                      title="Copy message"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check size={11} className="text-emerald-500" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={11} />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Live Ollama 4B Connection Banner */}
        <div className="chat-ollama-status-bar">
          <span className="chat-status-pulse" />
          <span>Local Ollama 4B (gemma3:4b) Online • Live Streaming</span>
        </div>

        {/* Thick & Attractive Chatbar */}
        <form onSubmit={handleSend} className="chat-bar-form">
          <div className="chat-bar-wrapper">
            <div className="chat-bar-leading-icon">
              <Sparkles size={18} />
            </div>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Moco anything or command an action..."
              className="chat-bar-input"
            />
            <div className="chat-bar-kbd">
              <CornerDownLeft size={10} />
              <span>Enter</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="chat-bar-send-btn"
            title="Send query (Enter)"
          >
            <Send size={18} strokeWidth={2.2} />
          </button>
        </form>
      </div>
    </div>
  );
}

