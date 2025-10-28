

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import { Message, UserInfo, AiSettings, Goal, GoalType, GoalBackground, SavedChat } from '../types';
import { AI_PERSONALITIES, GOAL_BACKGROUND_COLORS, GOAL_BACKGROUND_PRESETS } from '../constants';
import ChatMessage from '../components/ChatMessage';
import ChatInput from '../components/ChatInput';
import TypingIndicator from '../components/TypingIndicator';

interface MotivationTabProps {
    userInfo: UserInfo;
    aiSettings: AiSettings;
    goals: Goal[];
    addOrUpdateGoal: (goal: Goal) => void;
    resetGoalByType: (type: GoalType) => void;
    savedChats: SavedChat[];
    addSavedChat: (chat: SavedChat) => void;
    deleteSavedChat: (chatId: string) => void;
}

const getGoalStyle = (bg: GoalBackground) => {
    if (bg.type === 'color') return { backgroundColor: bg.value, backgroundSize: 'cover', backgroundPosition: 'center' };
    if (bg.type === 'preset' || bg.type === 'custom') return { backgroundImage: `url(${bg.value})`, backgroundSize: 'cover', backgroundPosition: 'center' };
    return {};
};


const BackgroundSelector: React.FC<{ selectedBackground: GoalBackground; onSelect: (bg: GoalBackground) => void }> = ({ selectedBackground, onSelect }) => {
    const [activeTab, setActiveTab] = useState('color');

    const handleCustomImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    onSelect({ type: 'custom', value: event.target.result as string });
                }
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    return (
        <div>
            <div className="flex border-b">
                <button onClick={() => setActiveTab('color')} className={`px-4 py-2 text-sm ${activeTab === 'color' ? 'border-b-2 border-purple-500 text-purple-600' : 'text-gray-500'}`}>カラー</button>
                <button onClick={() => setActiveTab('preset')} className={`px-4 py-2 text-sm ${activeTab === 'preset' ? 'border-b-2 border-purple-500 text-purple-600' : 'text-gray-500'}`}>風景</button>
                <button onClick={() => setActiveTab('custom')} className={`px-4 py-2 text-sm ${activeTab === 'custom' ? 'border-b-2 border-purple-500 text-purple-600' : 'text-gray-500'}`}>カスタム</button>
            </div>
            <div className="p-2">
                {activeTab === 'color' && (
                    <div className="grid grid-cols-5 gap-2">
                        {GOAL_BACKGROUND_COLORS.map(color => (
                            <div key={color} onClick={() => onSelect({ type: 'color', value: color })}
                                style={{ backgroundColor: color }} 
                                className={`w-10 h-10 rounded-full cursor-pointer border transition-all ${selectedBackground.type === 'color' && selectedBackground.value === color ? 'ring-2 ring-purple-500 ring-offset-2' : ''}`}></div>
                        ))}
                    </div>
                )}
                {activeTab === 'preset' && (
                    <div className="grid grid-cols-3 gap-2">
                        {GOAL_BACKGROUND_PRESETS.map(preset => (
                            <img key={preset.key} src={preset.url} alt={preset.label}
                                onClick={() => onSelect({ type: 'preset', value: preset.url })}
                                className={`w-full h-16 object-cover rounded-md cursor-pointer transition-all ${selectedBackground.type === 'preset' && selectedBackground.value === preset.url ? 'ring-2 ring-purple-500 ring-offset-2' : ''}`} />
                        ))}
                    </div>
                )}
                {activeTab === 'custom' && (
                     <div className={`p-2 border rounded-md ${selectedBackground.type === 'custom' ? 'ring-2 ring-purple-500 ring-offset-2' : ''}`}>
                         <input type="file" accept="image/*" onChange={handleCustomImageUpload} className="text-sm w-full" />
                    </div>
                )}
            </div>
        </div>
    );
};


const GoalSettingForm: React.FC<{ goalType: GoalType, existingGoal: Goal | null, onSave: (goal: Goal) => void; onCancel: () => void; }> = ({ goalType, existingGoal, onSave, onCancel }) => {
    const [title, setTitle] = useState('');
    const [deadline, setDeadline] = useState('');
    const [reward, setReward] = useState('');
    const [background, setBackground] = useState<GoalBackground>({ type: 'color', value: '#FFFFFF' });
    const [isRecording, setIsRecording] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | undefined>();
    const [audioBlob, setAudioBlob] = useState<Blob | undefined>();
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    useEffect(() => {
        if (existingGoal) {
            setTitle(existingGoal.title);
            setDeadline(existingGoal.deadline);
            setReward(existingGoal.reward);
            setBackground(existingGoal.background);
            setAudioUrl(existingGoal.audioUrl);
            setAudioBlob(existingGoal.audioBlob);
        }
    }, [existingGoal]);

    const handleStartRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];
            mediaRecorderRef.current.ondataavailable = (event) => audioChunksRef.current.push(event.data);
            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                setAudioUrl(URL.createObjectURL(blob));
                stream.getTracks().forEach(track => track.stop());
            };
            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Error recording:", err);
            alert("マイクへのアクセスが許可されていません。");
        }
    };

    const handleStopRecording = () => {
        mediaRecorderRef.current?.stop();
        setIsRecording(false);
    };

    const handleSave = () => {
        if (!title || !deadline) return alert('目標と期日は必須です。');
        onSave({
            id: existingGoal?.id || `goal-${goalType}-${Date.now()}`,
            type: goalType, title, deadline, reward, background,
            audioUrl, audioBlob, 
            isCompleted: existingGoal?.isCompleted || false,
            reflection: existingGoal?.reflection
        });
    };
    
    const pageTitle = existingGoal ? '目標を編集' : `新しい目標を設定 (${goalType === 'long' ? '長期' : goalType === 'medium' ? '中期' : '短期'})`;

    return (
        <div className="bg-white p-6 rounded-lg shadow-md border animate-fade-in">
            <h3 className="text-lg font-bold mb-4">{pageTitle}</h3>
            <div className="space-y-4">
                <input type="text" placeholder="例: 次の定期テストで80点以上とる" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-2 border rounded-md" />
                <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="w-full p-2 border rounded-md" />
                <input type="text" placeholder="例: 欲しかったゲームを買う" value={reward} onChange={e => setReward(e.target.value)} className="w-full p-2 border rounded-md" />
                 <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">プレビュー</label>
                    <div
                        style={getGoalStyle(background)}
                        className="w-full h-24 rounded-lg bg-cover bg-center border flex items-center justify-center relative"
                    >
                         <div className="absolute inset-0 bg-black/30 rounded-lg"></div>
                        <span className="relative z-10 text-white font-bold drop-shadow-md">{title || '目標'}</span>
                    </div>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">背景を選択</label>
                    <BackgroundSelector selectedBackground={background} onSelect={setBackground} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">音声による目標宣言</label>
                    <div className="flex items-center gap-4">
                        <button onClick={isRecording ? handleStopRecording : handleStartRecording} className={`px-4 py-2 rounded-md text-white font-semibold ${isRecording ? 'bg-red-500' : 'bg-green-500'}`}>
                            {isRecording ? '録音停止' : '録音開始'}
                        </button>
                        {isRecording && <div className="text-sm text-red-500 animate-pulse">録音中...</div>}
                    </div>
                    {audioUrl && <audio src={audioUrl} controls className="mt-2 w-full" />}
                </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
                <button onClick={onCancel} className="px-4 py-2 bg-gray-200 rounded-md">キャンセル</button>
                <button onClick={handleSave} className="px-4 py-2 bg-purple-500 text-white rounded-md">保存</button>
            </div>
        </div>
    );
};

const StarRating: React.FC<{ rating: number; setRating: (r: number) => void }> = ({ rating, setRating }) => (
    <div className="flex justify-center">
        {[1, 2, 3, 4, 5].map(star => (
            <svg key={star} onClick={() => setRating(star)} className={`w-8 h-8 cursor-pointer ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
        ))}
    </div>
);

const Confetti: React.FC = () => {
    const confettiCount = 100;
    const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'];
    return (
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-50">
            {Array.from({ length: confettiCount }).map((_, i) => (
                <div
                    key={i}
                    className="absolute w-2 h-4 animate-fall"
                    style={{
                        left: `${Math.random() * 100}%`,
                        top: `${-20 + Math.random() * -80}px`,
                        backgroundColor: colors[Math.floor(Math.random() * colors.length)],
                        animationDelay: `${Math.random() * 5}s`,
                        transform: `rotate(${Math.random() * 360}deg)`,
                    }}
                />
            ))}
            <style>{`
                @keyframes fall {
                    0% { transform: translateY(0) rotate(0); opacity: 1; }
                    100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
                }
                .animate-fall {
                    animation: fall 5s linear forwards;
                }
            `}</style>
        </div>
    );
};


const MotivationTab: React.FC<MotivationTabProps> = ({ userInfo, aiSettings, goals, addOrUpdateGoal, resetGoalByType, savedChats, addSavedChat, deleteSavedChat }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
    const [activeSubTab, setActiveSubTab] = useState<'chat' | 'saved'>('chat');
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [chatTitle, setChatTitle] = useState('');
    const [viewingChat, setViewingChat] = useState<SavedChat | null>(null);
    
    type CompletionStep = 'confirm' | 'pep_talk' | 'pep_talk_loading' | 'reflect' | 'celebrate';
    interface CompletionState {
        step: CompletionStep;
        goal: Goal;
        message?: string;
    }
    const [completionState, setCompletionState] = useState<CompletionState | null>(null);
    const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);
    const [cheerMessage, setCheerMessage] = useState<{ goalId: string; message: string } | null>(null);
    const [isCheerLoading, setIsCheerLoading] = useState<string | null>(null);
    const [reflectionRating, setReflectionRating] = useState(0);
    const [reflectionText, setReflectionText] = useState('');
    
    const chatRef = useRef<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    useEffect(() => { scrollToBottom(); }, [messages, isLoading, viewingChat]);
    
    const getAIPersonalityPrompt = useCallback(() => {
        if (aiSettings.personality === 'custom' && aiSettings.customPrompt) {
            return aiSettings.customPrompt;
        }
        const personality = AI_PERSONALITIES.find(p => p.key === aiSettings.personality);
        return personality ? personality.prompt : AI_PERSONALITIES[0].prompt;
    }, [aiSettings]);

    const initializeChat = useCallback(() => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        chatRef.current = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: `あなたは「${aiSettings.name}」という名前の「Bye Mistakes」という学習サポートAIです。一人称は「${aiSettings.firstPerson}」です。あなたの役割は、ユーザー（名前：${userInfo.name}）の学習モチベーションを高めることです。以下の性格設定に従って対話してください。\n${getAIPersonalityPrompt()}`,
            }
        });
        setMessages([{
            id: 'motivation-start',
            sender: 'bot',
            text: `こんにちは、${userInfo.name}さん！${aiSettings.firstPerson}は${aiSettings.name}だよ。学習の悩みや計画など、なんでも気軽に話してね。`
        }]);
    }, [userInfo, aiSettings, getAIPersonalityPrompt]);

    useEffect(() => { initializeChat(); }, [initializeChat]);

    const handleSendMessage = async (userInput: string) => {
        if (!userInput.trim() || isLoading) return;
        const userMessage: Message = { id: Date.now().toString(), text: userInput, sender: 'user' };
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        try {
            if (!chatRef.current) throw new Error("Chat not initialized");
            const result = await chatRef.current.sendMessage({ message: userInput });
            const botMessage: Message = { id: (Date.now() + 1).toString(), text: result.text, sender: 'bot' };
            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error('Error sending message:', error);
            const errorMessage: Message = { id: (Date.now() + 1).toString(), text: 'エラーが発生しました。', sender: 'bot' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveGoal = (goal: Goal) => {
        addOrUpdateGoal(goal);
        setEditingGoal(null);
    };
    
    const handleSaveChat = () => {
        if (!chatTitle.trim()) {
            alert('タイトルを入力してください。');
            return;
        }
        if (messages.length <= 1) {
            alert('保存する会話がありません。');
            return;
        }
        addSavedChat({
            id: Date.now().toString(),
            title: chatTitle,
            messages,
            savedAt: new Date().toLocaleString('ja-JP')
        });
        setChatTitle('');
        setIsSaveModalOpen(false);
    };

    const handleGetCheer = async (goal: Goal) => {
        setIsCheerLoading(goal.id);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `ユーザーの${userInfo.name}さんが目標「${goal.title}」に取り組んでいます。あなたのAI設定（名前: ${aiSettings.name}, 一人称: ${aiSettings.firstPerson}, 性格: ${getAIPersonalityPrompt()}）に基づいて、超短めの応援メッセージを伝えてください。`;
            const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
            setCheerMessage({ goalId: goal.id, message: response.text });
        } catch (e) {
            console.error("Cheer failed:", e);
            setCheerMessage({ goalId: goal.id, message: "頑張って！応援してるよ！" });
        } finally {
            setIsCheerLoading(null);
        }
    };

    const handleInitiateCompletion = (goal: Goal) => {
        setCompletionState({ step: 'confirm', goal });
        setExpandedGoalId(null);
    };

    const handleConfirmation = async (confirmed: boolean, goal: Goal) => {
        if (confirmed) {
            setReflectionRating(0);
            setReflectionText('');
            setCompletionState({ step: 'reflect', goal });
        } else {
            setCompletionState({ step: 'pep_talk_loading', goal });
            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                const prompt = `ユーザーの${userInfo.name}さんが目標「${goal.title}」をまだ達成していないようです。あなたのAI設定（名前: ${aiSettings.name}, 一人称: ${aiSettings.firstPerson}, 性格: ${getAIPersonalityPrompt()}）に基づいて、「まだやれるぞ！」といった趣旨の、超短文で魂を揺さぶるような”喝”を入れてください。`;
                const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { thinkingConfig: { thinkingBudget: 0 } } });
                setCompletionState({ step: 'pep_talk', goal, message: response.text });
            } catch (e) {
                console.error("Pep talk failed:", e);
                setCompletionState({ step: 'pep_talk', goal, message: "諦めるな！君ならできる！" });
            }
        }
    };

    const handleSaveReflectionAndCelebrate = async (goal: Goal, rating: number, text: string) => {
        setIsLoading(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `ユーザーの${userInfo.name}さんが目標「${goal.title}」を見事達成しました！設定したご褒美は「${goal.reward}」です。\nあなたのAI設定（名前: ${aiSettings.name}, 一人称: ${aiSettings.firstPerson}, 性格: ${getAIPersonalityPrompt()}）に基づいて、盛大にお祝いのメッセージを伝えてください。ユーザーの努力を全力で称えましょう！改行を効果的に使って、読みやすく、心に響くメッセージにしてください。`;
            const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });

            addOrUpdateGoal({ ...goal, isCompleted: true, reflection: { rating, text } });
            setCompletionState({ step: 'celebrate', goal, message: response.text });

        } catch (e) {
            console.error("Celebration failed:", e);
            addOrUpdateGoal({ ...goal, isCompleted: true, reflection: { rating, text } });
            setCompletionState({ step: 'celebrate', goal, message: "目標達成おめでとうございます！本当に素晴らしいです！" });
        } finally {
            setIsLoading(false);
        }
    };
    
    const GoalCard: React.FC<{goal: Goal}> = ({ goal }) => {
        const style = getGoalStyle(goal.background);
        const isExpanded = expandedGoalId === goal.id;

        const now = new Date();
        const deadlineDate = new Date(goal.deadline);
        deadlineDate.setHours(23, 59, 59, 999);
        const daysRemaining = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const formattedDeadline = deadlineDate.toLocaleDateString('ja-JP');
        
        let countdownDisplay: React.ReactNode;
        const longClasses = { main: 'text-7xl', aux: 'text-3xl' };
        const shortClasses = { main: 'text-5xl', aux: 'text-xl' };
        const classes = goal.type === 'long' ? longClasses : shortClasses;

        if (daysRemaining < 0) {
            countdownDisplay = <span className={classes.main}>期限切れ</span>;
        } else if (daysRemaining === 0) {
            countdownDisplay = <span className={classes.main}>今日まで</span>;
        } else {
            countdownDisplay = (
                <div className="flex items-baseline justify-center">
                    <span className={`${classes.aux} mr-2`}>あと</span>
                    <span className={classes.main}>{daysRemaining}</span>
                    <span className={`${classes.aux} ml-2`}>日</span>
                </div>
            );
        }


        return (
            <div style={style} onClick={() => !isExpanded && setExpandedGoalId(goal.id)} className={`p-4 rounded-lg shadow-md bg-cover bg-center text-white relative h-full flex flex-col justify-between cursor-pointer transition-all duration-300`}>
                <div className="absolute inset-0 bg-black/40 rounded-lg"></div>
                 <div className="relative z-10 flex-1 flex flex-col">
                    <h3 className={`font-bold drop-shadow-md text-center ${goal.type === 'long' ? 'text-3xl' : 'text-xl'}`}>{goal.title}</h3>
                     <div className="flex-grow flex items-center justify-center">
                        <div className="text-center">
                           <div className="font-bold drop-shadow-lg">
                                {countdownDisplay}
                            </div>
                            <div className="text-sm opacity-80 mt-2">{formattedDeadline} まで</div>
                        </div>
                    </div>
                     {isExpanded && (
                        <div className="text-sm opacity-80 text-center -mt-4">ご褒美: {goal.reward || 'なし'}</div>
                    )}
                </div>

                {isExpanded && (
                     <div className="relative z-10 mt-2 animate-fade-in space-y-2">
                        {goal.audioUrl && <audio src={goal.audioUrl} controls className="w-full h-8" />}
                        {cheerMessage?.goalId === goal.id && (
                           <div className="bg-white/20 p-2 rounded-md text-xs text-center backdrop-blur-sm">{cheerMessage.message}</div>
                        )}
                        <div className="flex gap-2 text-xs">
                           <button onClick={(e) => { e.stopPropagation(); handleGetCheer(goal);}} disabled={!!isCheerLoading} className="flex-1 bg-white/30 py-1.5 rounded-md hover:bg-white/50 transition backdrop-blur-sm disabled:opacity-50">
                               {isCheerLoading === goal.id ? '...' : '応援'}
                           </button>
                           <button onClick={(e) => { e.stopPropagation(); setEditingGoal(goal); }} className="flex-1 bg-blue-500/80 py-1.5 rounded-md hover:bg-blue-500 transition">編集</button>
                           <button onClick={(e) => { e.stopPropagation(); handleInitiateCompletion(goal);}} className="flex-1 bg-green-500/80 py-1.5 rounded-md hover:bg-green-500 transition">終了！</button>
                           <button onClick={(e) => { e.stopPropagation(); setExpandedGoalId(null); setCheerMessage(null);}} className="flex-1 bg-white/30 py-1.5 rounded-md hover:bg-white/50 transition backdrop-blur-sm">閉じる</button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    const GoalSlot: React.FC<{type: GoalType, label: string}> = ({ type, label }) => {
        const goal = goals.find(g => g.type === type && !g.isCompleted);
        if (goal) return <GoalCard goal={goal} />;
        return (
             <div className="p-4 rounded-lg shadow-md text-center border-2 border-dashed flex flex-col justify-center items-center h-full">
                <h3 className="font-bold text-gray-600 mb-2">{label}</h3>
                <button onClick={() => setEditingGoal({ type } as Goal)} className="px-4 py-2 bg-purple-500 text-white text-sm font-bold rounded-lg hover:bg-purple-600 transition-colors">
                    設定する
                </button>
            </div>
        );
    };

    if (editingGoal) {
        return <GoalSettingForm goalType={editingGoal.type} existingGoal={editingGoal.id ? editingGoal : null} onSave={handleSaveGoal} onCancel={() => setEditingGoal(null)} />;
    }
    
    const completedGoals = goals.filter(g => g.isCompleted).sort((a,b) => new Date(b.deadline).getTime() - new Date(a.deadline).getTime());

    return (
        <div className="flex flex-col h-full">
            {completionState?.step === 'confirm' && (
                 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-sm text-center">
                        <h3 className="font-bold text-lg mb-4">本当に終了した？</h3>
                        <div className="flex justify-center gap-4">
                            <button onClick={() => handleConfirmation(false, completionState.goal)} className="px-6 py-2 bg-gray-200 rounded-md font-semibold">まだ！</button>
                            <button onClick={() => handleConfirmation(true, completionState.goal)} className="px-6 py-2 bg-purple-500 text-white rounded-md font-semibold">ほんと！</button>
                        </div>
                    </div>
                </div>
            )}
             {completionState?.step === 'pep_talk_loading' && (
                 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-sm text-center">
                        <p className="font-bold text-lg mb-4 animate-pulse">ちょっと待ってね、、、</p>
                    </div>
                </div>
            )}
            {completionState?.step === 'pep_talk' && (
                 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?q=80&w=2113&auto=format&fit=crop')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
                    <div className="bg-gray-800/80 backdrop-blur-sm rounded-lg p-6 w-full max-w-sm text-center text-white border border-purple-400/50">
                        <div className="text-5xl mb-4 animate-bounce">🔥</div>
                        <p className="font-bold text-lg mb-4 whitespace-pre-wrap">{completionState.message}</p>
                        <button onClick={() => setCompletionState(null)} className="px-6 py-2 bg-purple-500 text-white rounded-md font-semibold w-full">OK</button>
                    </div>
                </div>
            )}
            {completionState?.step === 'reflect' && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-sm text-center">
                        <h3 className="font-bold text-lg mb-2">お疲れさま！</h3>
                        <p className="text-sm text-gray-600 mb-4">今回の頑張りを振り返ろう</p>
                        <StarRating rating={reflectionRating} setRating={setReflectionRating} />
                        <textarea value={reflectionText} onChange={e => setReflectionText(e.target.value)} placeholder="感想を記録しよう" rows={3} className="w-full p-2 border rounded-md mt-4"></textarea>
                        <button onClick={() => handleSaveReflectionAndCelebrate(completionState.goal, reflectionRating, reflectionText)} disabled={isLoading} className="mt-4 px-6 py-2 bg-purple-500 text-white rounded-md w-full disabled:opacity-50">
                            {isLoading ? '...' : '振り返りを保存'}
                        </button>
                    </div>
                </div>
            )}
            {completionState?.step === 'celebrate' && (
                 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?q=80&w=2113&auto=format&fit=crop')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
                    <Confetti />
                    <div className="bg-gray-800/80 backdrop-blur-sm rounded-lg p-6 w-full max-w-sm text-center relative border border-purple-400/50">
                         <h3 className="text-xl font-bold text-yellow-400 mb-2">🎉 目標達成おめでとう！ 🎉</h3>
                         <p className="whitespace-pre-wrap bg-white/10 p-4 rounded-md text-gray-200 mb-4 max-h-48 overflow-y-auto">{completionState.message}</p>
                         <button onClick={() => setCompletionState(null)} className="mt-4 px-6 py-2 bg-purple-500 text-white rounded-md w-full">閉じる</button>
                    </div>
                </div>
            )}
            
            <div className="space-y-4 mb-6">
                <div className="h-64">
                    <GoalSlot type="long" label="長期目標" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="h-48">
                        <GoalSlot type="medium" label="中期目標" />
                    </div>
                    <div className="h-48">
                        <GoalSlot type="short" label="短期目標" />
                    </div>
                </div>
            </div>

            <div className="mb-6">
                 <h3 className="text-lg font-bold mb-2 text-gray-800">過去の頑張り</h3>
                 {completedGoals.length > 0 ? (
                     <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                         {completedGoals.map(goal => (
                             <div key={goal.id} className="bg-white p-3 rounded-lg shadow-sm border">
                                 <div className="flex justify-between items-center">
                                    <p className="text-sm font-semibold text-gray-700">{goal.title}</p>
                                    <div className="flex items-center">
                                        {[...Array(goal.reflection?.rating || 0)].map((_,i) => <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>)}
                                    </div>
                                 </div>
                                 {goal.reflection?.text && <p className="text-xs text-gray-500 mt-1 truncate">{goal.reflection.text}</p>}
                             </div>
                         ))}
                     </div>
                 ) : (
                     <p className="text-center text-sm text-gray-500 py-4 bg-gray-50 rounded-lg">達成した目標はまだありません。</p>
                 )}
            </div>

            <div className="bg-white p-4 rounded-lg shadow-md flex-1 flex flex-col min-h-[400px]">
                <div className="flex border-b mb-4">
                    <button onClick={() => setActiveSubTab('chat')} className={`py-2 px-4 font-semibold text-sm ${activeSubTab === 'chat' ? 'border-b-2 border-purple-500 text-purple-600' : 'text-gray-500'}`}>AI相談室</button>
                    <button onClick={() => setActiveSubTab('saved')} className={`py-2 px-4 font-semibold text-sm ${activeSubTab === 'saved' ? 'border-b-2 border-purple-500 text-purple-600' : 'text-gray-500'}`}>保存した相談 ({savedChats.length})</button>
                </div>

                {activeSubTab === 'chat' && (
                    <>
                        <div className="flex-1 overflow-y-auto pr-2 space-y-4 bg-gray-100 rounded-lg p-2">
                            {messages.map(msg => <ChatMessage key={msg.id} message={msg} />)}
                            {isLoading && <TypingIndicator />}
                            <div ref={messagesEndRef} />
                        </div>
                        <div className="flex justify-end pt-2">
                             <button onClick={() => setIsSaveModalOpen(true)} disabled={messages.length <= 1} className="px-4 py-2 bg-purple-100 text-purple-700 text-sm font-semibold rounded-md hover:bg-purple-200 disabled:opacity-50 disabled:cursor-not-allowed">この会話を保存</button>
                        </div>
                        <div className="mt-auto pt-2">
                            <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} placeholder={`${aiSettings.name}に相談してみよう...`} disabled={false}/>
                        </div>
                    </>
                )}
                {activeSubTab === 'saved' && (
                    <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                        {savedChats.length === 0 ? (
                            <p className="text-center text-gray-500 pt-8">保存された相談はありません。</p>
                        ) : (
                            savedChats.map(chat => (
                                <div key={chat.id} className="p-3 bg-gray-50 rounded-lg border flex justify-between items-center">
                                    <div>
                                        <h4 className="font-semibold text-gray-800">{chat.title}</h4>
                                        <p className="text-xs text-gray-500">{chat.savedAt}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => setViewingChat(chat)} className="px-3 py-1 bg-blue-500 text-white text-xs rounded-md">見る</button>
                                        <button onClick={() => {
                                            if (window.confirm(`「${chat.title}」を本当に削除しますか？`)) {
                                                deleteSavedChat(chat.id);
                                            }
                                        }} className="px-3 py-1 bg-red-500 text-white text-xs rounded-md">削除</button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {isSaveModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-sm">
                        <h3 className="font-bold text-lg mb-4">会話を保存</h3>
                        <input type="text" value={chatTitle} onChange={(e) => setChatTitle(e.target.value)} placeholder="会話のタイトルを入力" className="w-full p-2 border rounded-md mb-4"/>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setIsSaveModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded-md">キャンセル</button>
                            <button onClick={handleSaveChat} className="px-4 py-2 bg-purple-500 text-white rounded-md">保存</button>
                        </div>
                    </div>
                </div>
            )}
             {viewingChat && (
                <div className="fixed inset-0 bg-white z-40 flex flex-col">
                    <div className="p-4 border-b">
                         <div className="flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-lg">{viewingChat.title}</h3>
                                <p className="text-xs text-gray-500">{viewingChat.savedAt}</p>
                            </div>
                            <button onClick={() => setViewingChat(null)} className="px-4 py-2 bg-gray-200 text-sm rounded-md">戻る</button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {viewingChat.messages.map(msg => <ChatMessage key={msg.id} message={msg} />)}
                        <div ref={messagesEndRef} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default MotivationTab;