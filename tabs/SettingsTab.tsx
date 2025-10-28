import React, { useState, useEffect } from 'react';
import { UserInfo, AiSettings } from '../types';
import { GRADE_OPTIONS, GENDER_OPTIONS, MBTI_OPTIONS, AI_PERSONALITIES, LEARNING_PREFERENCES, PROFANITY_LIST } from '../constants';

interface SettingsTabProps {
    userInfo: UserInfo;
    onUserInfoChange: (newInfo: UserInfo) => void;
    aiSettings: AiSettings;
    onAiSettingsChange: (newSettings: AiSettings) => void;
}

const SettingsTab: React.FC<SettingsTabProps> = ({ userInfo, onUserInfoChange, aiSettings, onAiSettingsChange }) => {
    const [localUserInfo, setLocalUserInfo] = useState<UserInfo>(userInfo);
    const [localAiSettings, setLocalAiSettings] = useState<AiSettings>(aiSettings);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    
    useEffect(() => {
        setLocalUserInfo(userInfo);
    }, [userInfo]);

    useEffect(() => {
        setLocalAiSettings(aiSettings);
    }, [aiSettings]);

    const handleUserInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setLocalUserInfo({ ...localUserInfo, [e.target.name]: e.target.value });
    };
    
    const handlePreferenceChange = (key: string) => {
        const prefs = localUserInfo.learningPreferences || [];
        const newPrefs = prefs.includes(key) ? prefs.filter(p => p !== key) : [...prefs, key];
        setLocalUserInfo({...localUserInfo, learningPreferences: newPrefs});
    }

    const handleAiSettingsChange = (e: { target: { name: string, value: string } }) => {
        setLocalAiSettings({ ...localAiSettings, [e.target.name]: e.target.value });
    };

    const handleSave = () => {
        const checkProfanity = (text: string) => text && PROFANITY_LIST.some(word => text.toLowerCase().includes(word.toLowerCase()));

        if (checkProfanity(localUserInfo.name) || checkProfanity(localAiSettings.name) || checkProfanity(localAiSettings.firstPerson)) {
            setErrorMessage('ニックネーム、AI名、または一人称に不適切な単語が含まれています。');
            setSaveStatus('error');
            setTimeout(() => {
                setSaveStatus('idle');
                setErrorMessage('');
            }, 3000);
            return;
        }

        try {
            onUserInfoChange(localUserInfo);
            onAiSettingsChange(localAiSettings);
            setSaveStatus('success');
            setTimeout(() => setSaveStatus('idle'), 3000);
        } catch (e) {
            setErrorMessage('保存中にエラーが発生しました。');
            setSaveStatus('error');
            setTimeout(() => {
                setSaveStatus('idle');
                setErrorMessage('');
            }, 3000);
        }
    };

    const isChanged = JSON.stringify(userInfo) !== JSON.stringify(localUserInfo) || JSON.stringify(aiSettings) !== JSON.stringify(localAiSettings);
    
    const renderSaveButton = () => {
        switch (saveStatus) {
            case 'success':
                return (
                    <div className="flex items-center justify-center space-x-2 text-green-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                        <span>保存しました</span>
                    </div>
                );
            case 'error':
                 return <span className="text-red-600 text-sm">{errorMessage}</span>;
            case 'idle':
            default:
                return (
                    <button
                        onClick={handleSave}
                        disabled={!isChanged}
                        className="w-full bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        変更を保存
                    </button>
                );
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">AIパーソナリティ設定</h2>
                <div className="space-y-4">
                    <InputField label="AIの名前" name="name" value={localAiSettings.name} onChange={handleAiSettingsChange} />
                    <InputField label="AIの一人称" name="firstPerson" value={localAiSettings.firstPerson} onChange={handleAiSettingsChange} placeholder="私, ボク, ワシ など" />
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">AIの性格</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {AI_PERSONALITIES.map(p => (
                                <button
                                    key={p.key}
                                    type="button"
                                    onClick={() => handleAiSettingsChange({ target: { name: 'personality', value: p.key } })}
                                    className={`p-4 rounded-lg text-left border-2 transition-all ${localAiSettings.personality === p.key ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-300' : 'border-gray-200 hover:border-purple-300'}`}
                                >
                                    <h4 className="font-bold text-gray-800">{p.label}</h4>
                                    <p className="text-xs text-gray-600 mt-1">{p.description}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                    {localAiSettings.personality === 'custom' && (
                        <div>
                            <label htmlFor="customPrompt" className="block text-sm font-medium text-gray-700">カスタムAI設定</label>
                             <p className="text-xs text-gray-500 mb-1">AIの性格や話し方を自由に設定してください。(例: 猫のキャラクターで、語尾に「ニャン」をつけて話す)</p>
                            <textarea name="customPrompt" id="customPrompt" value={localAiSettings.customPrompt} onChange={(e) => handleAiSettingsChange(e)} rows={4} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"></textarea>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">プロフィール設定</h2>
                <div className="space-y-4">
                    <InputField label="ニックネーム" name="name" value={localUserInfo.name} onChange={handleUserInfoChange} />
                    <SelectField label="学年" name="grade" value={localUserInfo.grade} onChange={handleUserInfoChange} options={GRADE_OPTIONS} />
                    <SelectField label="性別" name="gender" value={localUserInfo.gender} onChange={handleUserInfoChange} options={GENDER_OPTIONS} />
                    <SelectField label="MBTI" name="mbti" value={localUserInfo.mbti} onChange={handleUserInfoChange} options={MBTI_OPTIONS} />
                    <div>
                        <label className="block text-sm font-medium text-gray-700">学習の好み</label>
                        <div className="mt-2 space-y-4">
                           {Object.entries(LEARNING_PREFERENCES).map(([category, options]) => (
                               <div key={category}>
                                   <h3 className="text-md font-semibold text-gray-600 mb-2">{category}</h3>
                                   <div className="space-y-2">
                                       {options.map(opt => (
                                           <button
                                                key={opt.key}
                                                type="button"
                                                onClick={() => handlePreferenceChange(opt.key)}
                                                className={`w-full text-left p-3 rounded-lg border-2 flex items-center transition-colors ${localUserInfo.learningPreferences?.includes(opt.key) ? 'border-purple-500 bg-purple-50' : 'bg-white hover:bg-gray-50 border-gray-300'}`}
                                            >
                                                <div className={`w-4 h-4 rounded-full mr-3 flex-shrink-0 ${localUserInfo.learningPreferences?.includes(opt.key) ? 'bg-purple-500 border-purple-500' : 'bg-white border-2 border-gray-300'}`}></div>
                                                <span className="text-sm font-medium text-gray-800">{opt.label}</span>
                                           </button>
                                       ))}
                                   </div>
                               </div>
                           ))}
                        </div>
                    </div>
                    <div>
                        <label htmlFor="bio" className="block text-sm font-medium text-gray-700">自己紹介 / 自由記述</label>
                        <textarea name="bio" id="bio" value={localUserInfo.bio || ''} onChange={handleUserInfoChange} rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm" placeholder="AIにあなたのことを教えてあげましょう！"></textarea>
                    </div>
                </div>
            </div>

             <div className="sticky bottom-4">
                 <div className="bg-white/80 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-gray-200">
                    {renderSaveButton()}
                    <p className="text-xs text-gray-500 mt-2 text-center">
                        設定を保存すると、AIとの会話は新しい設定でリセットされます。
                    </p>
                 </div>
             </div>
        </div>
    );
};

const InputField: React.FC<{label: string, name: string, value: string, onChange: (e: any) => void, placeholder?: string}> = ({label, name, value, onChange, placeholder}) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">{label}</label>
        <input type="text" name={name} id={name} value={value} onChange={onChange} placeholder={placeholder} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm" />
    </div>
);

const SelectField: React.FC<{label: string, name: string, value: string, onChange: (e: any) => void, options: {value:string, label:string}[]}> = ({label, name, value, onChange, options}) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">{label}</label>
        <select name={name} id={name} value={value} onChange={onChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm">
            {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
    </div>
);


export default SettingsTab;