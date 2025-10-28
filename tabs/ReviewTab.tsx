import React, { useState } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { UserInfo, Mistake, DrillProblem, AiSettings } from '../types';
import { AI_PERSONALITIES } from '../constants';

interface ReviewTabProps {
    userInfo: UserInfo;
    aiSettings: AiSettings;
    addOrUpdateMistake: (mistake: Mistake) => void;
}

const ReviewTab: React.FC<ReviewTabProps> = ({ userInfo, aiSettings, addOrUpdateMistake }) => {
    const [problem, setProblem] = useState('');
    const [cause, setCause] = useState('');
    const [problemImage, setProblemImage] = useState<string | null>(null);
    const [currentMistake, setCurrentMistake] = useState<Mistake | null>(null);
    const [answers, setAnswers] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const getAIPersonalityPrompt = () => {
        if (aiSettings.personality === 'custom' && aiSettings.customPrompt) {
            return aiSettings.customPrompt;
        }
        const personality = AI_PERSONALITIES.find(p => p.key === aiSettings.personality);
        return personality ? personality.prompt : AI_PERSONALITIES[0].prompt;
    };


    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setProblemImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGenerateDrill = async () => {
        if ((!problem.trim() && !problemImage) || !cause.trim()) {
            setError('問題(テキストまたは画像)と原因の両方を入力してください。');
            return;
        }
        setIsLoading(true);
        setError('');

        try {
            const parts: any[] = [
                {
                    text: `ユーザーが以下の間違いをしました。
                    問題(テキスト): ${problem || '添付画像を参照'}
                    原因: ${cause}
                    
                    このユーザーが同じ間違いを繰り返さないように、この問題の類題を5つ作成してください。`
                }
            ];

            if (problemImage) {
                const [mimeType, base64Data] = problemImage.split(';base64,');
                parts.unshift({
                    inlineData: {
                        mimeType: mimeType.split(':')[1],
                        data: base64Data,
                    }
                });
            }

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: { parts },
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            drill: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        question: { type: Type.STRING }
                                    },
                                    required: ['question']
                                }
                            }
                        },
                        required: ['drill']
                    },
                },
            });

            const responseJson = JSON.parse(response.text);
            const newMistake: Mistake = {
                id: `mistake-${Date.now()}`,
                problem,
                cause,
                problemImage: problemImage || undefined,
                drill: responseJson.drill
            };
            setCurrentMistake(newMistake);
            addOrUpdateMistake(newMistake);
            setAnswers(Array(responseJson.drill.length).fill(''));

        } catch (e) {
            console.error(e);
            setError('ドリルの生成中にエラーが発生しました。もう一度お試しください。');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAnswerChange = (index: number, value: string) => {
        const newAnswers = [...answers];
        newAnswers[index] = value;
        setAnswers(newAnswers);
    };

    const handleSubmitAnswers = async () => {
        if (!currentMistake || !currentMistake.drill) return;
         if (answers.some(a => !a.trim())) {
            setError('すべての回答を入力してください。');
            return;
        }
        setIsLoading(true);
        setError('');
        
        try {
            const promptText = `あなたは「${aiSettings.name}」という名前の学習サポートAIです。
一人称は「${aiSettings.firstPerson}」です。

あなたの性格設定:
${getAIPersonalityPrompt()}

ユーザー情報:
- 名前: ${userInfo.name}
- 学年: ${userInfo.grade}
- MBTI: ${userInfo.mbti}
- 学習の好み: ${userInfo.learningPreferences?.join(', ') || '指定なし'}
- 自己紹介: ${userInfo.bio || '指定なし'}

元の問題: ${currentMistake.problem}
ユーザーが自己分析した原因: ${currentMistake.cause}

以下のドリル問題に対して、ユーザーは次のように回答しました。
${currentMistake.drill.map((d, i) => `問題${i+1}: ${d.question}\n回答${i+1}: ${answers[i]}`).join('\n\n')}

指示:
あなたのAIの名前、一人称、性格設定、そしてユーザー情報を深く考慮して、ユーザーの回答を採点してください。
そして、ポジティブで、心に響くような励ましのフィードバックを、あなた自身の言葉で提供してください。
特にユーザーの性格（MBTI: ${userInfo.mbti}）や学習の好みに合った言葉を選ぶと、より効果的です。`;
            
            const parts: any[] = [{ text: promptText }];

            if (currentMistake.problemImage) {
                const [mimeType, base64Data] = currentMistake.problemImage.split(';base64,');
                parts.unshift({
                    inlineData: {
                        mimeType: mimeType.split(':')[1],
                        data: base64Data,
                    }
                });
                parts[1].text = `ユーザーは添付の画像の問題で間違いをしました。\n\n` + parts[1].text;
            }

             const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: { parts },
            });
            
            const updatedMistake = { ...currentMistake, answers, feedback: response.text };
            setCurrentMistake(updatedMistake);
            addOrUpdateMistake(updatedMistake);

        } catch(e) {
            console.error(e);
            setError('フィードバックの生成中にエラーが発生しました。');
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setProblem('');
        setCause('');
        setProblemImage(null);
        setCurrentMistake(null);
        setAnswers([]);
        setError('');
    }

    if (currentMistake && currentMistake.feedback) {
         return (
            <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
                 <h2 className="text-xl font-bold mb-4 text-gray-800">AIからのフィードバック</h2>
                 <div className="bg-purple-50 p-4 rounded-md whitespace-pre-wrap text-gray-700">{currentMistake.feedback}</div>
                 <button onClick={resetForm} className="mt-6 w-full bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold py-2 px-4 rounded-lg">
                    新しいミスを登録する
                 </button>
            </div>
        );
    }
    
    if (currentMistake && currentMistake.drill) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
                <h2 className="text-xl font-bold mb-4 text-gray-800">パーソナルドリル</h2>
                <div className="space-y-4">
                    {currentMistake.drill.map((d, i) => (
                        <div key={i}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">問題 {i + 1}: {d.question}</label>
                            <input type="text" value={answers[i]} onChange={(e) => handleAnswerChange(i, e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" />
                        </div>
                    ))}
                </div>
                {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
                <button onClick={handleSubmitAnswers} disabled={isLoading} className="mt-6 w-full bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50">
                    {isLoading ? '採点中...' : '答え合わせをする'}
                </button>
            </div>
        )
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
            <h2 className="text-xl font-bold mb-4 text-gray-800">ミスを登録しよう</h2>
            <div className="space-y-4">
                <div>
                    <label htmlFor="problem" className="block text-sm font-medium text-gray-700">間違えた問題 (テキスト)</label>
                    <textarea id="problem" value={problem} onChange={e => setProblem(e.target.value)} rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"></textarea>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">間違えた問題 (画像)</label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                        <div className="space-y-1 text-center">
                            {problemImage ? (
                                <div>
                                    <img src={problemImage} alt="Preview" className="mx-auto h-32 object-contain rounded-md shadow-sm" />
                                    <button onClick={() => setProblemImage(null)} className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium">
                                        画像を削除
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <div className="flex text-sm text-gray-600">
                                        <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-purple-600 hover:text-purple-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-purple-500">
                                            <span>ファイルをアップロード</span>
                                            <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleImageChange} accept="image/*" />
                                        </label>
                                        <p className="pl-1">またはドラッグ＆ドロップ</p>
                                    </div>
                                    <p className="text-xs text-gray-500">PNG, JPG, GIFなど</p>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                <div>
                    <label htmlFor="cause" className="block text-sm font-medium text-gray-700">なぜ間違えた？ (原因)</label>
                    <textarea id="cause" value={cause} onChange={e => setCause(e.target.value)} rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"></textarea>
                </div>
            </div>
            {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
            <button onClick={handleGenerateDrill} disabled={isLoading} className="mt-6 w-full bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50">
                {isLoading ? '生成中...' : 'パーソナルドリルを生成'}
            </button>
        </div>
    );
};

export default ReviewTab;