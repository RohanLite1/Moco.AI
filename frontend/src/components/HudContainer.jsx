import React from 'react';
import { X, Minus, Pin, Sparkles, MessageSquare, Timer, CheckSquare, Music, Gamepad2 } from 'lucide-react';
import RobotAvatar from '../visuals3d/RobotAvatar';
import { api } from '../services/api';

export default function HudContainer({
  activeTab,
  setActiveTab,
  aiStatus,
  children
}) {
  const tabs = [
    { id: 'chat', label: 'AI Assistant', icon: MessageSquare },
    { id: 'pomodoro', label: 'Pomodoro Focus', icon: Timer },
    { id: 'todo', label: 'Task List', icon: CheckSquare },
    { id: 'music', label: 'Ambient Waves', icon: Music },
    { id: 'games', label: 'Break Games', icon: Gamepad2 }
  ];

  const handleClose = () => {
    api.hideWindow();
  };

  const handlePin = async () => {
    await api.togglePin();
  };

  return (
    <div className="hud-window">
      {/* Top Header Bar */}
      <header className="hud-header drag-region">
        <div className="hud-title no-drag">
          <Sparkles size={18} color="#06b6d4" />
          <span>Moco.AI</span>
          <span className="hud-badge">HUD v1.0 • Alt+Space</span>
        </div>

        <div className="hud-controls no-drag">
          <button onClick={handlePin} className="btn-icon" title="Toggle Pin Always on Top">
            <Pin size={15} />
          </button>
          <button onClick={handleClose} className="btn-icon close" title="Hide HUD (Alt+Space)">
            <X size={16} />
          </button>
        </div>
      </header>

      {/* Main HUD Body */}
      <div className="hud-body">
        {/* Left Section: 3D Hologram + Navigation */}
        <aside className="hud-left">
          {/* 3D Visualizer */}
          <div style={{ width: '100%', height: '240px' }}>
            <RobotAvatar status={aiStatus} />
          </div>

          {/* Navigation Menu */}
          <nav className="hud-nav">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Right Section: Active Widget Viewport */}
        <main className="hud-content">
          {children}
        </main>
      </div>
    </div>
  );
}
