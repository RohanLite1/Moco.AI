import React, { useState, useEffect } from 'react';
import DynamicIsland from './components/DynamicIsland';
import ChatWidget from './widgets/ChatWidget';
import PomodoroWidget from './widgets/PomodoroWidget';
import TodoWidget from './widgets/TodoWidget';
import MusicWidget from './widgets/MusicWidget';
import GamesWidget from './widgets/GamesWidget';
import { api } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [aiStatus, setAiStatus] = useState('idle');

  useEffect(() => {
    // Listen to AI status events (idle, thinking, speaking, etc.) to animate the 3D Robot
    const cleanup = api.onAIStatus((status) => {
      setAiStatus(status);
    });
    return cleanup;
  }, []);

  const renderActiveWidget = () => {
    switch (activeTab) {
      case 'chat':
        return <ChatWidget onStatusChange={setAiStatus} />;
      case 'pomodoro':
        return <PomodoroWidget />;
      case 'todo':
        return <TodoWidget />;
      case 'music':
        return <MusicWidget />;
      case 'games':
        return <GamesWidget />;
      default:
        return <ChatWidget onStatusChange={setAiStatus} />;
    }
  };

  return (
    <DynamicIsland
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      aiStatus={aiStatus}
      onStatusChange={setAiStatus}
    >
      {renderActiveWidget()}
    </DynamicIsland>
  );
}
