import React, { useState } from 'react';
import { UserInfo, Mistake, AiSettings, Goal, SavedChat } from './types';
import Header from './components/Header';
import Tabs from './components/Tabs';
import ReviewTab from './tabs/ReviewTab';
import PracticeTab from './tabs/PracticeTab';
import MotivationTab from './tabs/MotivationTab';
import SettingsTab from './tabs/SettingsTab';

interface MainAppProps {
  userInfo: UserInfo;
  onUserInfoChange: (newInfo: UserInfo) => void;
  aiSettings: AiSettings;
  onAiSettingsChange: (newSettings: AiSettings) => void;
}

export type TabName = 'review' | 'practice' | 'motivation' | 'settings';

const MainApp: React.FC<MainAppProps> = ({ userInfo, onUserInfoChange, aiSettings, onAiSettingsChange }) => {
  const [activeTab, setActiveTab] = useState<TabName>('settings');
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [savedChats, setSavedChats] = useState<SavedChat[]>([]);

  const addOrUpdateMistake = (mistake: Mistake) => {
    setMistakes(prev => {
        const index = prev.findIndex(m => m.id === mistake.id);
        if (index > -1) {
            const newMistakes = [...prev];
            newMistakes[index] = mistake;
            return newMistakes;
        }
        return [...prev, mistake];
    });
  };

  const addOrUpdateGoal = (goal: Goal) => {
    setGoals(prev => {
      const index = prev.findIndex(g => g.id === goal.id);
      if (index > -1) {
        const newGoals = [...prev];
        newGoals[index] = goal;
        return newGoals;
      }
      // 同じタイプのゴールがあれば置き換える
      const sameTypeIndex = prev.findIndex(g => g.type === goal.type);
      if(sameTypeIndex > -1){
        const newGoals = [...prev];
        newGoals[sameTypeIndex] = goal;
        return newGoals;
      }
      return [...prev, goal];
    });
  };

  const resetGoalByType = (type: Goal['type']) => {
    setGoals(prev => prev.filter(g => g.type !== type));
  };

  const addSavedChat = (chat: SavedChat) => {
    setSavedChats(prev => [chat, ...prev]);
  };

  const deleteSavedChat = (chatId: string) => {
    setSavedChats(prev => prev.filter(chat => chat.id !== chatId));
  };


  const renderTabContent = () => {
    switch (activeTab) {
      case 'review':
        return <ReviewTab userInfo={userInfo} aiSettings={aiSettings} addOrUpdateMistake={addOrUpdateMistake} />;
      case 'practice':
        return <PracticeTab userInfo={userInfo} mistakes={mistakes} addOrUpdateMistake={addOrUpdateMistake} aiSettings={aiSettings} />;
      case 'motivation':
        return <MotivationTab 
                  userInfo={userInfo} 
                  aiSettings={aiSettings} 
                  goals={goals}
                  addOrUpdateGoal={addOrUpdateGoal}
                  resetGoalByType={resetGoalByType}
                  savedChats={savedChats}
                  addSavedChat={addSavedChat}
                  deleteSavedChat={deleteSavedChat}
                />;
      case 'settings':
        return <SettingsTab 
                  userInfo={userInfo} 
                  onUserInfoChange={onUserInfoChange} 
                  aiSettings={aiSettings}
                  onAiSettingsChange={onAiSettingsChange}
               />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-gray-800 font-sans">
      <Header />
      <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {renderTabContent()}
      </main>
    </div>
  );
};

export default MainApp;