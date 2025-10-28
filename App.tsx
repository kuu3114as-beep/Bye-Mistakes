
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Message, UserInfo, OnboardingStep, AiSettings } from './types';
import { GRADE_OPTIONS, GENDER_OPTIONS, MBTI_OPTIONS } from './constants';
import Header from './components/Header';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import TypingIndicator from './components/TypingIndicator';
import Tutorial from './components/Tutorial';
import MainApp from './MainApp';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>('initial');
  const [userInfo, setUserInfo] = useState<UserInfo>({ name: '', grade: '', gender: '', mbti: '' });
  const [aiSettings, setAiSettings] = useState<AiSettings>({ name: 'AI', firstPerson: '私', personality: 'gyaru', customPrompt: '' });
  
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  // Fix: Provide an initial value to useRef, as it was missing one.
  const timeoutRef = useRef<number | undefined>(undefined);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);
  
  useEffect(() => {
     // Clear timeout on unmount
    return () => clearTimeout(timeoutRef.current);
  }, []);

  const addBotMessage = (text: string, options: Message['options'] = undefined) => {
    setIsLoading(true);
    timeoutRef.current = window.setTimeout(() => {
        setMessages(prev => [...prev, {
            id: `bot-${Date.now()}`,
            text,
            sender: 'bot',
            options
        }]);
        setIsLoading(false);
    }, 1000);
  };

  const startOnboarding = useCallback(() => {
    setMessages([{
        id: 'initial-bot-message',
        text: "こんにちは！\nあなたの学習をサポートするAIです。まず、あなたの名前を教えてください。",
        sender: 'bot'
    }]);
    setOnboardingStep('name');
  }, []);

  useEffect(() => {
    if (onboardingStep === 'initial') {
        startOnboarding();
    }
  }, [onboardingStep, startOnboarding]);

  const handleNameStep = (name: string) => {
    setUserInfo(prev => ({ ...prev, name }));
    addBotMessage(`${name}さん、こんにちは！\n次にあなたの学年を教えてください。`, GRADE_OPTIONS);
    setOnboardingStep('grade');
  }

  const handleOptionSelect = (value: string) => {
    const userMessage: Message = {
        id: `user-${Date.now()}`,
        text: value,
        sender: 'user',
    };
    setMessages(prev => [...prev, userMessage]);

    if (onboardingStep === 'grade') {
        setUserInfo(prev => ({ ...prev, grade: value }));
        addBotMessage('性別を教えてください。', GENDER_OPTIONS);
        setOnboardingStep('gender');
    } else if (onboardingStep === 'gender') {
        setUserInfo(prev => ({ ...prev, gender: value }));
        addBotMessage('最後に、あなたのMBTIタイプを教えてください。\nもし分からなければ「わからない」を選択してください。', MBTI_OPTIONS);
        setOnboardingStep('mbti');
    } else if (onboardingStep === 'mbti') {
        setUserInfo(prev => ({ ...prev, mbti: value }));
        addBotMessage('ありがとうございます！\n登録が完了しました。簡単なチュートリアルを始めます。');
        setOnboardingStep('tutorial');
    }
  };
  
  const handleTutorialComplete = () => {
    setOnboardingStep('main_app');
  }

  const handleUserInput = (input: string) => {
    if (onboardingStep === 'name') {
        const userMessage: Message = {
            id: `user-${Date.now()}`, text: input, sender: 'user'
        };
        setMessages(prev => [...prev, userMessage]);
        handleNameStep(input);
    }
  }
  
  const getInputPlaceholder = () => {
    switch (onboardingStep) {
        case 'name':
            return '名前を入力してください...';
        default:
            return '選択肢から選んでください';
    }
  }

  if (onboardingStep === 'main_app') {
    return (
        <MainApp 
            userInfo={userInfo} 
            onUserInfoChange={setUserInfo}
            aiSettings={aiSettings}
            onAiSettingsChange={setAiSettings}
        />
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-gray-800 font-sans">
      <Header />
      {onboardingStep === 'tutorial' && <Tutorial onComplete={handleTutorialComplete} />}
      <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-4">
        {messages.map(msg => (
          <ChatMessage key={msg.id} message={msg} onOptionClick={handleOptionSelect} />
        ))}
        {isLoading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>
      <ChatInput 
        onSendMessage={handleUserInput} 
        isLoading={isLoading}
        placeholder={getInputPlaceholder()}
        disabled={onboardingStep !== 'name'}
      />
    </div>
  );
};

export default App;
