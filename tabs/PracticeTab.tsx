import React, { useState, useCallback } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { UserInfo, Mistake, AiSettings, DrillProblem } from '../types';
import { AI_PERSONALITIES } from '../constants';

interface PracticeTabProps {
    userInfo: UserInfo;
    mistakes: Mistake[];
    addOrUpdateMistake: (mistake: Mistake) => void;
    aiSettings: AiSettings;
}

const MistakeItem: React.FC<{ mistake: Mistake, onUpdate: (mistake: Mistake) => void }> = ({ mistake, onUpdate }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [memo, setMemo] = useState(mistake.memo || '');
    const [summary, setSummary] = useState('');
    const [isSummaryLoading, setIsSummaryLoading] = useState(false);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const getSummary = useCallback(async () => {
        if (!mistake.feedback || summary) return;
        setIsSummaryLoading(true);
        try {
            const prompt = `以下のフィードバックを、重要なポイントを3つに絞って箇条書きで要約してください:\n\n${mistake.feedback}`;
            const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
            setSummary(response.text);
        } catch (e) {
            console.error(e);
            setSummary('要約の生成に失敗しました。');
        } finally {
            setIsSummaryLoading(false);
        }
    }, [mistake.feedback, summary, ai.models]);

    const handleToggle = () => {
        const newIsExpanded = !isExpanded;
        setIsExpanded(newIsExpanded);
        if (newIsExpanded && mistake.feedback && !summary) {
            getSummary();
        }
    };

    const handleSaveMemo = () => {
        onUpdate({ ...mistake, memo });
        alert('メモを保存しました。');
    };

    return (
        <div className="bg-white rounded-lg shadow-md transition-all duration-300">
            <button onClick={handleToggle} className="w-full text-left p-4 focus:outline-none">
                <div className="flex justify-between items-center">
                    <p className="font-semibold text-gray-800 truncate">
                        {mistake.problem ? `問題: ${mistake.problem}` : '画像の問題'}
                    </p>
                    <svg className={`w-5 h-5 text-gray-500 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
                <p className="text-sm text-gray-600 mt-1">原因: {mistake.cause}</p>
            </button>
            {isExpanded && (
                <div className="p-4 border-t border-gray-200 animate-fade-in space-y-4">
                    {mistake.drill && mistake.drill.length > 0 && (
                        <div>
                            <h4 className="font-semibold text-gray-700 mb-2">AIが作成した類題:</h4>
                            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                                {mistake.drill.map((d, i) => <li key={i}>{d.question}</li>)}
                            </ul>
                        </div>
                    )}
                    {mistake.feedback && (
                        <div>
                            <h4 className="font-semibold text-gray-700 mb-2">AIフィードバック(要約):</h4>
                            {isSummaryLoading ? (
                                <p className="text-sm text-gray-500">要約を生成中...</p>
                            ) : (
                                <div className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 p-3 rounded-md">{summary}</div>
                            )}
                        </div>
                    )}
                    <div>
                        <h4 className="font-semibold text-gray-700 mb-2">メモ:</h4>
                        <textarea
                            value={memo}
                            onChange={(e) => setMemo(e.target.value)}
                            rows={3}
                            className="w-full p-2 border border-gray-300 rounded-md text-sm"
                            placeholder="このミスから学んだこと、次への対策などを記録しよう"
                        />
                        <div className="text-right mt-2">
                            <button onClick={handleSaveMemo} className="px-4 py-1.5 bg-purple-500 text-white text-xs font-semibold rounded-md hover:bg-purple-600">メモを保存</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


const PracticeTab: React.FC<PracticeTabProps> = ({ userInfo, mistakes, addOrUpdateMistake, aiSettings }) => {
    const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
    const [analysisResult, setAnalysisResult] = useState('');
    
    const [trainingState, setTrainingState] = useState<'idle' | 'generating' | 'solving' | 'grading' | 'finished'>('idle');
    const [trainingProblems, setTrainingProblems] = useState<DrillProblem[]>([]);
    const [trainingAnswers, setTrainingAnswers] = useState<string[]>([]);
    const [trainingFeedback, setTrainingFeedback] = useState('');
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const handleAnalyze = async () => {
        if (mistakes.length === 0) {
            alert('分析するには、少なくとも1つのミスを「復習」タブから登録する必要があります。');
            return;
        }
        setIsAnalysisLoading(true);
        setAnalysisResult('');
        try {
            const mistakesForPrompt = mistakes.map(m => ({ problem: m.problem || '画像問題', cause: m.cause }));
            const prompt = `あなたは優秀な学習コンサルタントです。以下の生徒のミスリストを分析し、共通する弱点の傾向を特定してください。そして、その弱点を克服するための具体的な学習アドバイスを、励ますような口調で提供してください。\n\n生徒情報:\n名前: ${userInfo.name}\n学年: ${userInfo.grade}\n\nミスリスト:\n${JSON.stringify(mistakesForPrompt)}`;
            const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
            setAnalysisResult(response.text);
        } catch (e) {
            console.error(e);
            setAnalysisResult('分析中にエラーが発生しました。');
        } finally {
            setIsAnalysisLoading(false);
        }
    };
    
    const handleStartTraining = async () => {
        if (mistakes.length === 0) {
            alert('トレーニングを開始するには、少なくとも1つのミスを「復習」タブから登録する必要があります。');
            return;
        }
        setTrainingState('generating');
        setTrainingFeedback('');
        setTrainingProblems([]);
        try {
             const mistakesForPrompt = mistakes.map(m => ({ problem: m.problem || '画像問題', cause: m.cause }));
             const prompt = `あなたは優秀な問題作成AIです。以下の生徒の過去のミスリストを参考に、彼/彼女の弱点を克服するための、少し応用的な新しい練習問題を5問作成してください。\n\n過去のミス:\n${JSON.stringify(mistakesForPrompt)}`;
             const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            problems: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: { question: { type: Type.STRING } },
                                    required: ['question']
                                }
                            }
                        },
                        required: ['problems']
                    },
                },
            });

            const resultJson = JSON.parse(response.text);
            setTrainingProblems(resultJson.problems);
            setTrainingAnswers(Array(resultJson.problems.length).fill(''));
            setTrainingState('solving');
        } catch (e) {
            console.error(e);
            alert('トレーニング問題の生成に失敗しました。');
            setTrainingState('idle');
        }
    };
    
    const handleSubmitTraining = async () => {
        if (trainingAnswers.some(a => !a.trim())) {
            alert('すべての問題に回答してください。');
            return;
        }
        setTrainingState('grading');
        try {
             const getAIPersonalityPrompt = () => {
                if (aiSettings.personality === 'custom' && aiSettings.customPrompt) return aiSettings.customPrompt;
                const p = AI_PERSONALITIES.find(p => p.key === aiSettings.personality);
                return p ? p.prompt : '';
            };
            const prompt = `あなたは「${aiSettings.name}」という名前の学習サポートAIです。一人称は「${aiSettings.firstPerson}」です。あなたの性格は「${getAIPersonalityPrompt()}」です。\n生徒「${userInfo.name}」がパーソナライズトレーニングを完了しました。以下の問題と生徒の回答をレビューし、採点と全体へのフィードバックをあなたのキャラクター設定と生徒情報（${userInfo.mbti}）に合わせて、ポジティブで心に響くように提供してください。\n\n${trainingProblems.map((p, i) => `Q${i+1}: ${p.question}\nA${i+1}: ${trainingAnswers[i]}`).join('\n\n')}`;
             const response = await ai.models.generateContent({ model: "gemini-2.5-pro", contents: prompt });
             setTrainingFeedback(response.text);
             setTrainingState('finished');
        } catch(e) {
            console.error(e);
            alert('フィードバックの生成に失敗しました。');
            setTrainingState('solving');
        }
    }


    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <button onClick={handleAnalyze} disabled={isAnalysisLoading} className="bg-white p-4 rounded-lg shadow-md text-left hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-wait">
                    <h3 className="font-bold text-lg text-gray-800">AIによるミス傾向分析</h3>
                    <p className="text-gray-600 text-sm">AIがあなたの弱点を分析し、アドバイスします。</p>
                </button>
                 <button onClick={handleStartTraining} disabled={trainingState !== 'idle'} className="bg-white p-4 rounded-lg shadow-md text-left hover:bg-gray-50 transition-colors disabled:opacity-50">
                    <h3 className="font-bold text-lg text-gray-800">パーソナライズトレーニング</h3>
                    <p className="text-gray-600 text-sm">これまでのミスから応用問題に挑戦します。</p>
                </button>
            </div>
            
            {(isAnalysisLoading || analysisResult) && (
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-bold mb-4 text-gray-800">分析結果</h2>
                    {isAnalysisLoading ? (
                        <p className="text-gray-600">分析中... あなたの弱点を見つけています...</p>
                    ) : (
                        <div className="whitespace-pre-wrap text-gray-700 bg-purple-50 p-4 rounded-md">{analysisResult}</div>
                    )}
                </div>
            )}
            
            {trainingState !== 'idle' && (
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-bold mb-4 text-gray-800">トレーニングモード</h2>
                    {trainingState === 'generating' && <p>あなた専用の問題を作成中です...</p>}
                    {trainingState === 'solving' && (
                        <div className="space-y-4">
                            {trainingProblems.map((p, i) => (
                                <div key={i}>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">問題 {i + 1}: {p.question}</label>
                                    <input type="text" value={trainingAnswers[i]} onChange={(e) => {
                                        const newAnswers = [...trainingAnswers];
                                        newAnswers[i] = e.target.value;
                                        setTrainingAnswers(newAnswers);
                                    }} className="w-full p-2 border border-gray-300 rounded-md" />
                                </div>
                            ))}
                            <button onClick={handleSubmitTraining} className="mt-4 w-full bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold py-2 px-4 rounded-lg">答え合わせをする</button>
                        </div>
                    )}
                    {trainingState === 'grading' && <p>採点中です... ドキドキ...</p>}
                    {trainingState === 'finished' && (
                        <div>
                             <div className="whitespace-pre-wrap text-gray-700 bg-purple-50 p-4 rounded-md mb-4">{trainingFeedback}</div>
                             <button onClick={() => setTrainingState('idle')} className="w-full bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg">トレーニングを終了</button>
                        </div>
                    )}
                </div>
            )}

            <div>
                <h2 className="text-xl font-bold mb-4 text-gray-800">問題一覧</h2>
                {mistakes.length === 0 ? (
                    <div className="bg-white p-6 rounded-lg shadow-md text-center">
                        <p className="text-gray-600">まだ登録されたミスがありません。</p>
                        <p className="text-gray-500 text-sm mt-1">まずは「復習」タブからミスを登録してみましょう。</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {mistakes.map((mistake) => (
                           <MistakeItem key={mistake.id} mistake={mistake} onUpdate={addOrUpdateMistake} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PracticeTab;